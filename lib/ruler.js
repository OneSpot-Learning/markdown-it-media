/**
 * @typedef {import("markdown-it/lib/parser_inline.mjs").RuleInline} RuleInline
 * @typedef {import("markdown-it/lib/rules_inline/state_inline.mjs").default} StateInline
 * @typedef {import("./parse.js").MediaResponse} MediaResponse
 * @typedef {import("./plugin.js").PluginOptions} PluginOptions
 */

import Token from "markdown-it/lib/token.mjs";

import { parseMedia } from "./parse.js";
import { getMediaType } from "./media-type.js";

/**
 * @param {string} text
 * @returns {Token}
 */
function textToken(text) {
  const t = new Token("text", "", 0);
  t.content = text;

  return t;
}

/**
 * @param {Token} token
 * @param {MediaResponse} media
 * @param {Record<string, string>} extraAttrs
 * @returns {void}
 */
function addImageAttrs(token, media, extraAttrs = {}) {
  token.attrSet("src", media.sources[0].src);
  token.attrSet("alt", "");

  if (media.title) {
    token.attrSet("title", media.title);
  }

  if (media.width) {
    token.attrSet("width", media.width);
  }

  if (media.height) {
    token.attrSet("height", media.height);
  }

  for (const [key, value] of Object.entries(extraAttrs)) {
    token.attrSet(key, value);
  }
}

/**
 * @param {Token} token
 * @param {MediaResponse} media
 * @param {Record<string, string>} extraAttrs
 * @returns {void}
 */
function addMediaAttrs(token, media, extraAttrs = {}) {
  if (media.title) {
    token.attrSet("title", media.title);
  }

  if (token.tag !== "audio") {
    if (media.width) {
      token.attrSet("width", media.width);
    }

    if (media.height) {
      token.attrSet("height", media.height);
    }

    if (media.poster) {
      token.attrSet("poster", media.poster);
    }
  }

  for (const [key, value] of Object.entries(extraAttrs)) {
    token.attrSet(key, value);
  }
}

/**
 * @param {StateInline} state
 * @param {MediaResponse} media
 * @param {PluginOptions | undefined} options
 * @returns {Token}
 */
function pushMediaToken(state, media, options) {
  /** @type {Token[]} */
  const children = [];

  /** @type {Token} */
  let token;

  const mediaType = getMediaType(media.sources);

  if (!mediaType || mediaType === "image") {
    token = state.push("image", "img", 0);

    state.md.inline.parse(media.label, state.md, state.env, children);
    token.children = children;

    addImageAttrs(token, media, options?.attrs?.image);

    return token;
  }

  let tagName = mediaType;

  if (tagName === "audio" && (media.poster || media.captions.length > 0)) {
    // The <audio> tag cannot display poster or show captions, but
    // the <video> tag can play audio files.
    tagName = "video";
  }

  token = state.push(mediaType, tagName, 0);

  for (const { src, type } of media.sources) {
    const t = new Token("source", "source", 0);
    t.attrSet("src", src);

    if (type) {
      t.attrSet("type", type);
    }

    children.push(t);
  }

  for (const caption of media.captions) {
    const t = new Token("track", "track", 0);

    t.attrSet("src", caption.src);
    t.attrSet("srclang", caption.srclang);

    if (caption.label) {
      t.attrSet("label", caption.label);
    }

    t.attrSet("kind", "captions");

    children.push(t);
  }

  state.md.inline.parse(media.label, state.md, state.env, children);

  for (const { src, type } of media.sources) {
    children.push(textToken(" "));

    const t = new Token("link_open", "a", 1);
    t.attrSet("href", src);
    children.push(t);

    let subtype = null;
    if (type) {
      const match = type.match(/^[a-z]+\/(.+)(?:;.*)*/);

      if (match && match[1]) {
        subtype = `${match[1]} `;
      }
    }

    children.push(textToken(`Download ${subtype ?? ""}${mediaType}`));
    children.push(new Token("link_close", "a", -1));
  }

  children.push(textToken("."));
  token.children = children;

  if (options?.controls) {
    token.attrSet("controls", "");
  }

  addMediaAttrs(token, media, options?.attrs?.[mediaType]);

  return token;
}

/**
 * @param {PluginOptions} [options]
 * @returns {RuleInline}
 */
export function createMediaRule(options) {
  return function mediaRule(state, silent) {
    const { pos, posMax } = state;
    const media = parseMedia(state);

    if (!media) {
      state.pos = pos;
      state.posMax = posMax;
      return false;
    }

    state.pos = media.pos;

    if (!silent) {
      pushMediaToken(state, media.res, options);
    }

    return true;
  };
}
