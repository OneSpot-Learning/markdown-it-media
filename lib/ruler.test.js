import { strict as assert } from "node:assert";
import { describe, it } from "node:test";

import markdownIt from "markdown-it";
import StateInline from "markdown-it/lib/rules_inline/state_inline.mjs";

import { createMediaRule } from "./ruler.js";

/**
 * @param {string} src
 * @returns {StateInline}
 */
function createState(src) {
  return new StateInline(src, markdownIt(), {}, []);
}

describe("mediaRule", () => {
  const mediaRule = createMediaRule({ controls: false });

  it("matches a media rule", () => {
    const src = "![](/image.webp)";
    const state = createState(src);
    const result = mediaRule(state, false);

    assert.equal(result, true);
    assert.equal(state.pos, src.length);
  });

  it("won’t match non-media", () => {
    const src = "something else";
    const state = createState(src);
    const result = mediaRule(state, false);

    assert.equal(result, false);
    assert.equal(state.pos, 0);
  });

  it("outputs an image token", () => {
    const src = "![](/image.webp)";
    const state = createState(src);

    mediaRule(state, false);
    assert.equal(state.tokens.length, 1);

    const [token] = state.tokens;
    assert.equal(token.type, "image");
    assert.equal(token.tag, "img");
    assert.equal(token.attrGet("src"), "/image.webp");
  });

  it("sets correct attrs to image token", () => {
    const src = '![]((0.webp))![](title.webp "title")![](size.webp =800x600)';
    const state = createState(src);
    while (state.pos < state.posMax) {
      mediaRule(state, false);
    }

    assert.equal(state.tokens.length, 3);

    const [empty, title, size] = state.tokens;

    assert.equal(empty.attrGet("title"), null);
    assert.equal(empty.attrGet("width"), null);
    assert.equal(empty.attrGet("height"), null);

    assert.equal(title.attrGet("title"), "title");

    assert.equal(size.attrGet("width"), "800");
    assert.equal(size.attrGet("height"), "600");
  });

  it("adds the image alt as child content", () => {
    const src = "![alt](/image.webp)";
    const state = createState(src);

    mediaRule(state, false);
    assert.equal(state.tokens.length, 1);

    const [{ children }] = state.tokens;
    assert.equal(children?.length, 1);

    const [textToken] = children;
    assert.equal(textToken.type, "text");
    assert.equal(textToken.content, "alt");
  });

  it("outputs an audio tag", () => {
    const src = "![](/audio.mp3)";
    const state = createState(src);

    mediaRule(state, false);
    assert.equal(state.tokens.length, 1);

    const [token] = state.tokens;
    assert.equal(token.type, "audio");
    assert.equal(token.tag, "audio");
  });

  it("outputs a video tag", () => {
    const src = "![](/audio.mp4)";
    const state = createState(src);

    mediaRule(state, false);
    assert.equal(state.tokens.length, 1);

    const [token] = state.tokens;
    assert.equal(token.type, "video");
    assert.equal(token.tag, "video");
  });

  it("ignores the URL search string", () => {
    const src = "![](/audio.mp4?search=audio.mp3)";
    const state = createState(src);

    mediaRule(state, false);
    assert.equal(state.tokens.length, 1);

    const [token] = state.tokens;
    assert.equal(token.type, "video");
    assert.equal(token.tag, "video");
  });

  it("ignores the URL hash", () => {
    const src = "![](/audio.mp4#audio.mp3)";
    const state = createState(src);

    mediaRule(state, false);
    assert.equal(state.tokens.length, 1);

    const [token] = state.tokens;
    assert.equal(token.type, "video");
    assert.equal(token.tag, "video");
  });

  it("outputs a video tag for captioned audio", () => {
    const src = "![](/song.ogg [en](/lyrics.vtt))";
    const state = createState(src);

    mediaRule(state, false);
    assert.equal(state.tokens.length, 1);

    const [token] = state.tokens;
    assert.equal(token.type, "audio");
    assert.equal(token.tag, "video");
  });

  it("outputs a video tag for audio with a poster", () => {
    const src = "![](/album.flac #=/cover.jpeg)";
    const state = createState(src);

    mediaRule(state, false);
    assert.equal(state.tokens.length, 1);

    const [token] = state.tokens;
    assert.equal(token.type, "audio");
    assert.equal(token.tag, "video");
  });

  it("puts the source as a child", () => {
    const src = "![](/video.webm)";
    const state = createState(src);

    mediaRule(state, false);
    assert.equal(state.tokens.length, 1);

    const [token] = state.tokens;
    assert.ok(token.children);

    const source = token.children.find(({ type }) => type === "source");
    assert.ok(source);
    assert.equal(source.tag, "source");
    assert.equal(source.attrGet("src"), "/video.webm");
  });

  it("puts the correct media type on source", () => {
    const src = "![](![audio/webm; codec=vorbis](/song))";
    const state = createState(src);

    mediaRule(state, false);
    assert.equal(state.tokens.length, 1);

    const [token] = state.tokens;
    assert.ok(token.children);

    const source = token.children.find(({ type }) => type === "source");
    assert.ok(source);
    assert.equal(source.tag, "source");
    assert.equal(source.attrGet("src"), "/song");
    assert.equal(source.attrGet("type"), "audio/webm; codec=vorbis");
  });

  it("puts the captions as children", () => {
    const src =
      '![](/video.webm [en](/captions.en.vtt "English") [ar](/captions.ar.vtt))';
    const state = createState(src);

    mediaRule(state, false);
    assert.equal(state.tokens.length, 1);

    const [token] = state.tokens;
    assert.ok(token.children);

    const tracks = token.children.filter(({ type }) => type === "track");
    assert.equal(tracks.length, 2);

    assert.equal(tracks[0].tag, "track");
    assert.equal(tracks[0].attrGet("src"), "/captions.en.vtt");
    assert.equal(tracks[0].attrGet("srclang"), "en");
    assert.equal(tracks[0].attrGet("label"), "English");

    assert.equal(tracks[1].tag, "track");
    assert.equal(tracks[1].attrGet("src"), "/captions.ar.vtt");
    assert.equal(tracks[1].attrGet("srclang"), "ar");
    assert.equal(tracks[1].attrGet("label"), null);
  });

  it("puts the label as a child", () => {
    const src = "![label](/video.webm)";
    const state = createState(src);

    mediaRule(state, false);
    assert.equal(state.tokens.length, 1);

    const [token] = state.tokens;
    assert.ok(token.children);

    const label = token.children.find(
      ({ type, content }) => type === "text" && content === "label",
    );

    assert.ok(label);
  });

  it("adds a fallback download link as a child", () => {
    const src = "![](/video.webm)";
    const state = createState(src);

    mediaRule(state, false);
    assert.equal(state.tokens.length, 1);

    const [token] = state.tokens;
    assert.ok(token.children);

    const index = token.children.findIndex(({ type }) => type === "link_open");

    const linkOpen = token.children[index];
    assert.ok(linkOpen);
    assert.equal(linkOpen.attrGet("href"), "/video.webm");

    const linkContent = token.children[index + 1];
    assert.ok(linkContent);
    assert.equal(linkContent.type, "text");
    assert.equal(linkContent.content, "Download video");
  });

  it("provides poster as an attribute", () => {
    const src = "![](/video.webm #=/poster.webp)";
    const state = createState(src);

    mediaRule(state, false);
    assert.equal(state.tokens.length, 1);

    const [token] = state.tokens;
    assert.equal(token.attrGet("poster"), "/poster.webp");
  });

  it("omits controls attribute by default", () => {
    const src = "![](/video.webm)";
    const state = createState(src);

    mediaRule(state, false);
    assert.equal(state.tokens.length, 1);

    const [token] = state.tokens;
    assert.equal(token.attrGet("controls"), null);
  });

  it("adds controls if enabled", () => {
    const src = "![](/video.webm)";
    const state = createState(src);

    createMediaRule({ controls: true })(state, false);
    assert.equal(state.tokens.length, 1);

    const [token] = state.tokens;
    assert.equal(token.attrGet("controls"), "");
  });

  it("adds extra attrs to images", () => {
    const src = "![](/video.jpeg)";
    const state = createState(src);

    createMediaRule({ attrs: { image: { lazy: "true" } } })(state, false);
    assert.equal(state.tokens.length, 1);

    const [token] = state.tokens;
    assert.equal(token.attrGet("lazy"), "true");
  });

  it("adds extra attrs to video", () => {
    const src = "![](/video.jpeg)";
    const state = createState(src);

    createMediaRule({
      attrs: {
        image: { autoplay: "autoplay", muted: "muted", preload: "metadata" },
      },
    })(state, false);

    assert.equal(state.tokens.length, 1);

    const [token] = state.tokens;
    assert.equal(token.attrGet("autoplay"), "autoplay");
    assert.equal(token.attrGet("muted"), "muted");
    assert.equal(token.attrGet("preload"), "metadata");
  });
});
