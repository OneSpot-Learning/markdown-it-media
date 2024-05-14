/* eslint-disable no-script-url */

/**
 * @typedef {import("markdown-it/lib/token.mjs").default} Token
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";

import markdownIt from "markdown-it";
import StateInline from "markdown-it/lib/rules_inline/state_inline.mjs";

import {
  parseLanguageTag,
  parseMedia,
  parseMediaArgs,
  parseMediaCaptions,
  parseMediaPoster,
  parseMediaSize,
  parseMediaSource,
  parseMediaType,
  parseNumber,
} from "./parse.js";

describe("parseMediaType", () => {
  it("parses image media type", () => {
    const src = "image/jpeg";
    const result = parseMediaType(src, 0, src.length);

    assert.deepEqual(result, {
      pos: src.length,
      value: "image/jpeg",
    });
  });

  it("parses video media type", () => {
    const src = "video/webm";
    const result = parseMediaType(src, 0, src.length);

    assert.deepEqual(result, {
      pos: src.length,
      value: "video/webm",
    });
  });

  it("parses media type with subtypes", () => {
    const src = "image/xml+svg";
    const result = parseMediaType(src, 0, src.length);

    assert.deepEqual(result, {
      pos: src.length,
      value: "image/xml+svg",
    });
  });

  it("parses video media type with params", () => {
    const src = 'video/webm; codec="vp8, vorbis"';
    const result = parseMediaType(src, 0, src.length);

    assert.deepEqual(result, {
      pos: src.length,
      value: 'video/webm; codec="vp8, vorbis"',
    });
  });

  it("won’t parse non-media types", () => {
    const src = "application/json";
    const result = parseMediaType(src, 0, src.length);

    assert.equal(result, null);
  });

  it("won’t parse non-media types", () => {
    const src = "video_webm";
    const result = parseMediaType(src, 0, src.length);

    assert.equal(result, null);
  });

  it("won’t parse missing subtype", () => {
    const src = "video/";
    const result = parseMediaType(src, 0, src.length);

    assert.equal(result, null);
  });

  it("won’t parse empty string", () => {
    const src = "";
    const result = parseMediaType(src, 0, src.length);

    assert.equal(result, null);
  });
});

describe("parseMediaSource", () => {
  it("parses media source", () => {
    const src = "![image/jpeg](image.jpeg)";
    const result = parseMediaSource(src, 0, src.length);

    assert.deepEqual(result, {
      pos: src.length,
      res: {
        src: "image.jpeg",
        type: "image/jpeg",
      },
    });
  });

  it("is ok with whitespace around media type", () => {
    const src = "![  image/jpeg  ](image.jpeg)";
    const result = parseMediaSource(src, 0, src.length);

    assert.deepEqual(result, {
      pos: src.length,
      res: {
        src: "image.jpeg",
        type: "image/jpeg",
      },
    });
  });

  it("is ok with whitespace around url", () => {
    const src = "![image/jpeg](   image.jpeg  )";
    const result = parseMediaSource(src, 0, src.length);

    assert.deepEqual(result, {
      pos: src.length,
      res: {
        src: "image.jpeg",
        type: "image/jpeg",
      },
    });
  });

  it("won’t parse if missing closing )", () => {
    const src = "![image/jpeg](image.jpeg";
    const result = parseMediaSource(src, 0, src.length);

    assert.equal(result, null);
  });

  it("won’t parse if space before open (", () => {
    const src = "![image/jpeg] (image.jpeg)";
    const result = parseMediaSource(src, 0, src.length);

    assert.equal(result, null);
  });

  it("won’t parse if non-media media type", () => {
    const src = "![alt](image.jpeg)";
    const result = parseMediaSource(src, 0, src.length);

    assert.equal(result, null);
  });

  it("won’t parse if some title", () => {
    const src = '![image/jpeg](image.jpeg "title")';
    const result = parseMediaSource(src, 0, src.length);

    assert.equal(result, null);
  });

  it("won’t parse if missing URL", () => {
    const src = "![image/jpeg](  )";
    const result = parseMediaSource(src, 0, src.length);

    assert.equal(result, null);
  });

  it("won’t parse if illegal URL", () => {
    const md = markdownIt();
    md.validateLink = (src) => !src.startsWith("javascript:");

    const src = "![image/jpeg](javascript:alert`xss`)";
    const result = parseMediaSource(src, 0, src.length, md);

    assert.equal(result, null);
    md.validateLink = () => true;

    assert.notEqual(parseMediaSource(src, 0, src.length, md), null);
  });
});

describe("parseNumber", () => {
  it("parses a number", () => {
    const src = "42abc";
    const result = parseNumber(src, 0, src.length);

    assert.deepEqual(result, {
      pos: 2,
      value: "42",
    });
  });

  it("parses a single digit", () => {
    const src = "4abc2";
    const result = parseNumber(src, 0, src.length);

    assert.deepEqual(result, {
      pos: 1,
      value: "4",
    });
  });

  it("parses five digits", () => {
    const src = "01234abc";
    const result = parseNumber(src, 0, src.length);

    assert.deepEqual(result, {
      pos: 5,
      value: "01234",
    });
  });

  it("parses a percentage", () => {
    const src = "42%abc";
    const result = parseNumber(src, 0, src.length);

    assert.deepEqual(result, {
      pos: 3,
      value: "42%",
    });
  });

  it("only parses first percantage", () => {
    const src = "42%58%abc";
    const result = parseNumber(src, 0, src.length);

    assert.deepEqual(result, {
      pos: 3,
      value: "42%",
    });
  });

  it("stops parsing at first percentage mark", () => {
    const src = "42%%abc";
    const result = parseNumber(src, 0, src.length);

    assert.deepEqual(result, {
      pos: 3,
      value: "42%",
    });
  });

  it("parses a number in the middle of source", () => {
    const src = "abc42def";
    const result = parseNumber(src, 3, src.length);

    assert.deepEqual(result, {
      pos: 5,
      value: "42",
    });
  });

  it("parses a number at the end of source", () => {
    const src = "abc42";
    const result = parseNumber(src, 3, src.length);

    assert.deepEqual(result, {
      pos: 5,
      value: "42",
    });
  });

  it("won’t parse non-numbers", () => {
    const src = "abc";
    const result = parseNumber(src, 0, src.length);

    assert.equal(result, null);
  });

  it("won’t parse single percentage", () => {
    const src = "%abc";
    const result = parseNumber(src, 0, src.length);

    assert.equal(result, null);
  });

  it("won’t parse empty string", () => {
    const src = "";
    const result = parseNumber(src, 0, src.length);

    assert.equal(result, null);
  });

  it("won’t parse end of source", () => {
    const src = "abc42";
    const result = parseNumber(src, 5, src.length);

    assert.equal(result, null);
  });
});

describe("parseMediaSize", () => {
  it("parses width and height", () => {
    const src = "=800x600";
    const result = parseMediaSize(src, 0, src.length);

    assert.deepEqual(result, {
      pos: 8,
      res: {
        width: "800",
        height: "600",
      },
    });
  });

  it("parses only width", () => {
    const src = "=800x";
    const result = parseMediaSize(src, 0, src.length);

    assert.deepEqual(result, {
      pos: 5,
      res: {
        width: "800",
        height: "",
      },
    });
  });

  it("parses only height", () => {
    const src = "=x600";
    const result = parseMediaSize(src, 0, src.length);

    assert.deepEqual(result, {
      pos: 5,
      res: {
        width: "",
        height: "600",
      },
    });
  });

  it("won’t parse neither width nor height", () => {
    const src = "=x";
    const result = parseMediaSize(src, 0, src.length);

    assert.equal(result, null);
  });

  it("parses in middle of source", () => {
    const src = "abc =800x600 def";
    const result = parseMediaSize(src, 4, src.length);

    assert.deepEqual(result, {
      pos: 12,
      res: {
        width: "800",
        height: "600",
      },
    });
  });

  it("parses at end of source", () => {
    const src = "abc =800x600";
    const result = parseMediaSize(src, 4, src.length);

    assert.deepEqual(result, {
      pos: 12,
      res: {
        width: "800",
        height: "600",
      },
    });
  });

  it("parses percentage", () => {
    const src = "abc =100%x";
    const result = parseMediaSize(src, 4, src.length);

    assert.deepEqual(result, {
      pos: 10,
      res: {
        width: "100%",
        height: "",
      },
    });
  });

  it("won’t parse if missing x", () => {
    const src = "=100%";
    const result = parseMediaSize(src, 0, src.length);

    assert.equal(result, null);
  });

  it("won’t parse if missing =", () => {
    const src = "100%x";
    const result = parseMediaSize(src, 0, src.length);

    assert.equal(result, null);
  });

  it("won’t parse empty string", () => {
    const src = "";
    const result = parseMediaSize(src, 0, src.length);

    assert.equal(result, null);
  });
});

describe("parseMediaPoster", () => {
  it("parses media poster", () => {
    const src = "#=poster.jpeg";
    const result = parseMediaPoster(src, 0, src.length);

    assert.deepEqual(result, {
      pos: src.length,
      value: "poster.jpeg",
    });
  });

  it("won’t parse if space before =", () => {
    const src = "# =poster.jpeg";
    const result = parseMediaPoster(src, 0, src.length);

    assert.equal(result, null);
  });

  it("won’t parse if space after =", () => {
    const src = "#= poster.jpeg";
    const result = parseMediaPoster(src, 0, src.length);

    assert.equal(result, null);
  });

  it("won’t parse if illegal URL", () => {
    const md = markdownIt();
    md.validateLink = (src) => !src.startsWith("javascript:");

    const src = "#=javascript:alert`xss`";
    const result = parseMediaPoster(src, 0, src.length, md);

    assert.equal(result, null);
    md.validateLink = () => true;

    assert.notEqual(parseMediaPoster(src, 0, src.length, md), null);
  });
});

describe("parseLanguageTag", () => {
  it("parses a simple langage tag", () => {
    const src = "en";
    const result = parseLanguageTag(src, 0, src.length);

    assert.deepEqual(result, { pos: 2, value: "en" });
  });

  it("parses subtags", () => {
    const src = "zh-yue-Hant-CN";
    const result = parseLanguageTag(src, 0, src.length);

    assert.deepEqual(result, {
      pos: 14,
      value: "zh-yue-Hant-CN",
    });
  });

  it("parses subtags with numbers", () => {
    const src = "es-005";
    const result = parseLanguageTag(src, 0, src.length);

    assert.deepEqual(result, {
      pos: 6,
      value: "es-005",
    });
  });

  it("parses subtags until special character", () => {
    const src = "[x-example]";
    const result = parseLanguageTag(src, 1, src.length);

    assert.deepEqual(result, {
      pos: 10,
      value: "x-example",
    });
  });

  it("parses subtags until whitespace", () => {
    const src = "[  x-example  ]";
    const result = parseLanguageTag(src, 3, src.length);

    assert.deepEqual(result, {
      pos: 12,
      value: "x-example",
    });
  });

  it("won’t parse subtags if non-alphanumeric", () => {
    const src = "[x-example]";
    const result = parseLanguageTag(src, 0, src.length);

    assert.equal(result, null);
  });

  it("won’t parse subtags if starts with hyphen", () => {
    const src = "-x-example";
    const result = parseLanguageTag(src, 0, src.length);

    assert.equal(result, null);
  });

  it("stops parsing on repeated hyphens", () => {
    const src = "i-klingon--Qonos";
    const result = parseLanguageTag(src, 0, src.length);

    assert.deepEqual(result, { pos: 9, value: "i-klingon" });
  });

  it("won’t parse hyphen at end of tag", () => {
    const src = "[x-example-]";
    const result = parseLanguageTag(src, 1, src.length);

    assert.deepEqual(result, {
      pos: 10,
      value: "x-example",
    });
  });

  it("won’t parse hyphen at end of tag at end of string", () => {
    const src = "x-example-";
    const result = parseLanguageTag(src, 0, src.length);

    assert.deepEqual(result, {
      pos: 9,
      value: "x-example",
    });
  });
});

describe("parseMediaCaptions", () => {
  it("parses media captions", () => {
    const src = "[en](captions.vtt)";
    const result = parseMediaCaptions(src, 0, src.length);

    assert.deepEqual(result, {
      pos: src.length,
      res: {
        src: "captions.vtt",
        srclang: "en",
        label: null,
      },
    });
  });

  it("parses media captions with a label", () => {
    const src = '[en](captions.vtt "label")';
    const result = parseMediaCaptions(src, 0, src.length);

    assert.deepEqual(result, {
      pos: src.length,
      res: {
        src: "captions.vtt",
        srclang: "en",
        label: "label",
      },
    });
  });

  it("parses media captions with extranous whitespace", () => {
    const src = '[  en  ](  captions.vtt  "label"  )';
    const result = parseMediaCaptions(src, 0, src.length);

    assert.deepEqual(result, {
      pos: src.length,
      res: {
        src: "captions.vtt",
        srclang: "en",
        label: "label",
      },
    });
  });

  it("won’t parse media captions if missing open bracket", () => {
    const src = "en]captions.vtt)";
    const result = parseMediaCaptions(src, 0, src.length);

    assert.equal(result, null);
  });

  it("won’t parse media captions if missing close bracket", () => {
    const src = "[en(captions.vtt";
    const result = parseMediaCaptions(src, 0, src.length);

    assert.equal(result, null);
  });

  it("won’t parse media captions if missing open paren", () => {
    const src = "[en]captions.vtt)";
    const result = parseMediaCaptions(src, 0, src.length);

    assert.equal(result, null);
  });

  it("won’t parse media captions if missing close paren", () => {
    const src = "[en](captions.vtt";
    const result = parseMediaCaptions(src, 0, src.length);

    assert.equal(result, null);
  });

  it("won’t parse if missing language tag", () => {
    const src = "[](captions.vtt)";
    const result = parseMediaCaptions(src, 0, src.length);

    assert.equal(result, null);
  });

  it("won’t parse if missing URL", () => {
    const src = "[en](  )";
    const result = parseMediaCaptions(src, 0, src.length);

    assert.equal(result, null);
  });

  it("won’t parse if illegal URL", () => {
    const md = markdownIt();
    md.validateLink = (src) => !src.startsWith("javascript:");

    const src = "[en](javascript:alert`xss`)";
    const result = parseMediaCaptions(src, 0, src.length, md);

    assert.equal(result, null);
    md.validateLink = () => true;

    assert.notEqual(parseMediaCaptions(src, 0, src.length, md), null);
  });
});

describe("parseMediaArgs", () => {
  const md = markdownIt();

  it("parses media with multiple sources", () => {
    const src = "![](/audio.mp3 ![audio/webm](/audio.webm))";
    const env = {};
    /** @type { Token[] } */
    const out = [];
    const state = new StateInline(src, md, env, out);

    const result = parseMediaArgs(state, 3);

    assert.deepEqual(result, {
      pos: src.length - 1,
      res: {
        sources: [
          { src: "/audio.mp3", type: null },
          { src: "/audio.webm", type: "audio/webm" },
        ],
        title: null,
        width: null,
        height: null,
        poster: null,
        captions: [],
      },
    });
  });

  it("parses media with media type in source", () => {
    const src = "![](![audio/webm; codec=vorbis](/audio.webm))";
    const env = {};
    /** @type { Token[] } */
    const out = [];
    const state = new StateInline(src, md, env, out);

    const result = parseMediaArgs(state, 3);

    assert.deepEqual(result, {
      pos: src.length - 1,
      res: {
        sources: [{ src: "/audio.webm", type: "audio/webm; codec=vorbis" }],
        title: null,
        width: null,
        height: null,
        poster: null,
        captions: [],
      },
    });
  });

  it("parses media with title", () => {
    const src = '![](/image.webp "title")';
    const env = {};
    /** @type { Token[] } */
    const out = [];
    const state = new StateInline(src, md, env, out);

    const result = parseMediaArgs(state, 3);

    assert.deepEqual(result, {
      pos: src.length - 1,
      res: {
        sources: [{ src: "/image.webp", type: null }],
        title: "title",
        width: null,
        height: null,
        poster: null,
        captions: [],
      },
    });
  });

  it("parses media with size", () => {
    const src = "![](/image.webp =800x600)";
    const env = {};
    /** @type { Token[] } */
    const out = [];
    const state = new StateInline(src, md, env, out);

    const result = parseMediaArgs(state, 3);

    assert.deepEqual(result, {
      pos: src.length - 1,
      res: {
        sources: [{ src: "/image.webp", type: null }],
        title: null,
        width: "800",
        height: "600",
        poster: null,
        captions: [],
      },
    });
  });

  it("parses media with poster", () => {
    const src = "![](/video.webm #=/poster.webp)";
    const env = {};
    /** @type { Token[] } */
    const out = [];
    const state = new StateInline(src, md, env, out);

    const result = parseMediaArgs(state, 3);

    assert.deepEqual(result, {
      pos: src.length - 1,
      res: {
        sources: [{ src: "/video.webm", type: null }],
        title: null,
        width: null,
        height: null,
        poster: "/poster.webp",
        captions: [],
      },
    });
  });

  it("parses media with poster and captions", () => {
    const src =
      '![](/video.webm [en](/captions.en.vtt "English") [ar](/captions.ar.vtt "العربية") #=/poster.webp)';
    const env = {};
    /** @type { Token[] } */
    const out = [];
    const state = new StateInline(src, md, env, out);

    const result = parseMediaArgs(state, 3);

    assert.deepEqual(result, {
      pos: src.length - 1,
      res: {
        sources: [{ src: "/video.webm", type: null }],
        title: null,
        width: null,
        height: null,
        poster: "/poster.webp",
        captions: [
          { srclang: "en", src: "/captions.en.vtt", label: "English" },
          { srclang: "ar", src: "/captions.ar.vtt", label: "العربية" },
        ],
      },
    });
  });

  it("parses with extraneous whitespace", () => {
    const src =
      '![](  /video.webm   ![video/mpeg](/video.mp4)  "title"   #=/poster.webp   =800x600)';
    const env = {};
    /** @type { Token[] } */
    const out = [];
    const state = new StateInline(src, md, env, out);

    const result = parseMediaArgs(state, 3);

    assert.deepEqual(result, {
      pos: src.length - 1,
      res: {
        sources: [
          { src: "/video.webm", type: null },
          { src: "/video.mp4", type: "video/mpeg" },
        ],
        title: "title",
        width: "800",
        height: "600",
        poster: "/poster.webp",
        captions: [],
      },
    });
  });

  it("parses with newline whitespace", () => {
    const src = `![](
      /video.webm
      ![video/mpeg](/video.mp4)
      "title"
      #=/poster.webp
      =800x600
    )`;

    const env = {};
    /** @type { Token[] } */
    const out = [];
    const state = new StateInline(src, md, env, out);

    const result = parseMediaArgs(state, 3);

    assert.deepEqual(result, {
      pos: src.length - 1,
      res: {
        sources: [
          { src: "/video.webm", type: null },
          { src: "/video.mp4", type: "video/mpeg" },
        ],
        title: "title",
        width: "800",
        height: "600",
        poster: "/poster.webp",
        captions: [],
      },
    });
  });

  it("parses media attributes in any order", () => {
    const src =
      '![](/video.webm "title" [en](/captions.en.vtt "English") #=/poster.webp [ar](/captions.ar.vtt "العربية") =800x600)';
    const env = {};
    /** @type { Token[] } */
    const out = [];
    const state = new StateInline(src, md, env, out);

    const result = parseMediaArgs(state, 3);

    assert.deepEqual(result, {
      pos: src.length - 1,
      res: {
        sources: [{ src: "/video.webm", type: null }],
        title: "title",
        width: "800",
        height: "600",
        poster: "/poster.webp",
        captions: [
          { srclang: "en", src: "/captions.en.vtt", label: "English" },
          { srclang: "ar", src: "/captions.ar.vtt", label: "العربية" },
        ],
      },
    });
  });

  it("won’t parse with missing source", () => {
    const src = "![label]()";
    const env = {};
    /** @type { Token[] } */
    const out = [];
    const state = new StateInline(src, md, env, out);

    const result = parseMedia(state);
    assert.equal(result, null);
  });
});

describe("parseMedia", () => {
  const md = markdownIt();

  it("parses media", () => {
    const src = "![](/image.webp)";
    const env = {};
    /** @type { Token[] } */
    const out = [];
    const state = new StateInline(src, md, env, out);

    const result = parseMedia(state);

    assert.deepEqual(result, {
      pos: src.length,
      res: {
        sources: [{ src: "/image.webp", type: null }],
        label: "",
        title: null,
        width: null,
        height: null,
        poster: null,
        captions: [],
      },
    });
  });

  it("parses media with text label", () => {
    const src = "![label](/image.webp)";
    const env = {};
    /** @type { Token[] } */
    const out = [];
    const state = new StateInline(src, md, env, out);

    const result = parseMedia(state);

    assert.deepEqual(result, {
      pos: src.length,
      res: {
        sources: [{ src: "/image.webp", type: null }],
        label: "label",
        title: null,
        width: null,
        height: null,
        poster: null,
        captions: [],
      },
    });
  });

  it("won’t parse with title after attrs", () => {
    const src =
      '![label](/video.webm [en](/captions.en.vtt "English") #=/poster.webp [ar](/captions.ar.vtt "العربية") =800x600 "title")';
    const env = {};
    /** @type { Token[] } */
    const out = [];
    const state = new StateInline(src, md, env, out);

    const result = parseMedia(state);
    assert.equal(result, null);
  });

  it("won’t parse with title in middle of attrs", () => {
    const src =
      '![label](/video.webm [en](/captions.en.vtt "English") #=/poster.webp "title" [ar](/captions.ar.vtt "العربية") =800x600)';
    const env = {};
    /** @type { Token[] } */
    const out = [];
    const state = new StateInline(src, md, env, out);

    const result = parseMedia(state);
    assert.equal(result, null);
  });
});
