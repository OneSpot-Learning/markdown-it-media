/**
 * @typedef {import("markdown-it/lib/rules_inline/state_inline.mjs").default} StateInline
 */

import markdownIt from "markdown-it";
import { isWhiteSpace } from "markdown-it/lib/common/utils.mjs";

/**
 * @typedef {InstanceType<markdownIt["core"]["State"]>["Token"]} Token
 */

/**
 * @param {string} src
 * @param {number} start
 * @param {number} end
 * @returns {number}
 */
function skipWhitespace(src, start, end) {
  let pos = start;

  while (pos < end) {
    if (!isWhiteSpace(src.charCodeAt(pos))) {
      break;
    }

    pos += 1;
  }

  return pos;
}

/**
 * @param {string} char
 * @returns {boolean}
 */
function isAlphanumeric(char) {
  return /[A-Za-z0-9]/.test(char);
}

/**
 * @param {string} src
 * @param {number} start
 * @param {number} end
 * @returns {null | { pos: number, value: string }}
 */
export function parseMediaType(src, start, end) {
  // Media types are type/subtype+tree; param=value
  let pos = start;

  // We only allow image, audio and video subtypes. Conveniently 5
  // letters each.
  const type = src.slice(start, start + 5);

  if (type !== "image" && type !== "audio" && type !== "video") {
    return null;
  }

  pos += 5;

  if (src.charAt(pos) !== "/") {
    return null;
  }

  pos += 1;

  const subTypeStart = pos;
  while (pos < end && isAlphanumeric(src.charAt(pos))) {
    pos += 1;

    if (/[-+.]/.test(src.charAt(pos))) {
      pos += 1;
    }
  }

  if (pos === subTypeStart) {
    // Subtype is required
    return null;
  }

  // Parameters
  if (src.charAt(pos) === ";") {
    pos += 1;

    // Simply skip ahead to the closing ] as parameters can be
    // complicated.

    while (pos < end && src.charAt(pos) !== "]") {
      pos += 1;
    }
  }

  return {
    pos,
    value: src.slice(start, pos),
  };
}

/**
 * @typedef {{ src: string, type: string | null }} Source
 * @param {string} src
 * @param {number} start
 * @param {number} end
 * @param {markdownIt} [md]
 * @returns {null | { pos: number, res: Source }}
 */
export function parseMediaSource(src, start, end, md = markdownIt()) {
  let pos = start;
  // media source must be ![  type  ](  <url>  )
  if (src.slice(pos, pos + 2) !== "![") {
    return null;
  }

  // ![  type  ](  <src>  )
  //   ^^ skipping these spaces
  pos = skipWhitespace(src, pos + 2, end);

  // ![  type  ](  <src>  )
  //     ^^^^ parsing media type
  const mediaType = parseMediaType(src, pos, end);

  if (!mediaType) {
    return null;
  }

  // ![  lang  ](  <src>  )
  //         ^^ skipping these spaces
  pos = skipWhitespace(src, mediaType.pos, end);

  if (src.slice(pos, pos + 2) !== "](") {
    return null;
  }

  // ![  lang  ](  <src>  )
  //             ^^ skipping these spaces
  pos = skipWhitespace(src, pos + 2, end);

  const linkDestinationRes = md.helpers.parseLinkDestination(src, pos, end);
  if (!linkDestinationRes.ok) {
    return null;
  }

  const href = md.normalizeLink(linkDestinationRes.str);
  if (!md.validateLink(href)) {
    return null;
  }

  pos = skipWhitespace(src, linkDestinationRes.pos, end);

  if (pos >= end || src.charAt(pos) !== ")") {
    return null;
  }

  return {
    pos: pos + 1,
    res: {
      src: href,
      type: mediaType.value,
    },
  };
}

/**
 * @param {string} src
 * @param {number} start
 * @param {number} end
 * @returns {null | { pos: number, value: string }}
 */
export function parseNumber(src, start, end) {
  let pos = start;

  while (pos < end && /\d/.test(src.charAt(pos))) {
    pos += 1;
  }

  if (pos === start) {
    return null;
  }

  // Numbers can and with a single percentage mark.
  if (src.charAt(pos) === "%") {
    pos += 1;
  }

  return {
    pos,
    value: src.slice(start, pos),
  };
}

/**
 * @typedef {{ width: string, height: string }} SizeRes
 * @param {string} src
 * @param {number} start
 * @param {number} end
 * @returns {null | { pos: number, res: SizeRes }}
 */
export function parseMediaSize(src, start, end) {
  let pos = start;

  if (pos >= end || src.charAt(pos) !== "=") {
    return null;
  }

  pos += 1;

  const widthRes = parseNumber(src, pos, end);
  let width = "";

  if (widthRes) {
    pos = widthRes.pos;
    width = widthRes.value;
  }

  // next character must be 'x'
  if (src.charAt(pos) !== "x") {
    return null;
  }

  pos += 1;

  const heightRes = parseNumber(src, pos, end);
  let height = "";

  if (heightRes) {
    pos = heightRes.pos;
    height = heightRes.value;
  } else if (!widthRes) {
    // Need to specify either width or height.
    return null;
  }

  return {
    pos,
    res: { width, height },
  };
}

/**
 * @param {string} src
 * @param {number} start
 * @param {number} end
 * @param {markdownIt} [md]
 * @returns {null | { pos: number, value: string }}
 */
export function parseMediaPoster(src, start, end, md = markdownIt()) {
  let pos = start;
  // poster must be ![](  <url>  )
  if (src.slice(pos, pos + 2) !== "#=") {
    return null;
  }

  pos += 2;

  const linkDestinationRes = md.helpers.parseLinkDestination(src, pos, end);
  if (!linkDestinationRes.ok) {
    return null;
  }

  const href = md.normalizeLink(linkDestinationRes.str);
  if (!md.validateLink(href)) {
    return null;
  }

  pos = linkDestinationRes.pos;

  return {
    pos,
    value: href,
  };
}

/**
 * @param {string} src
 * @param {number} start
 * @param {number} end
 * @returns {null | { pos: number, value: string }}
 */
export function parseLanguageTag(src, start, end) {
  // Language tags are basically a series of one or more alphanumeric
  // character seperated by a hyphen: ab-c-defg-123
  //
  // https://www.rfc-editor.org/rfc/rfc5646.html

  let pos = start;

  while (pos < end && isAlphanumeric(src.charAt(pos))) {
    pos += 1;

    if (src.charAt(pos) === "-") {
      pos += 1;
    }
  }

  if (src.charAt(pos - 1) === "-") {
    // Don’t end with a hyphen

    pos -= 1;
  }

  if (pos === start) {
    return null;
  }

  return {
    pos,
    value: src.slice(start, pos),
  };
}

/**
 * @typedef {object} Captions
 * @property {string} src
 * @property {string} srclang
 * @property {string | null} label
 *
 * @param {string} src
 * @param {number} start
 * @param {number} end
 * @param {markdownIt} [md]
 * @returns {null | { pos: number, res: Captions }}
 */
export function parseMediaCaptions(src, start, end, md = markdownIt()) {
  let pos = start;

  // captions are [  lang  ](  <src>  "label"  )
  if (src.charAt(pos) !== "[") {
    return null;
  }

  // [  lang  ](  <src>  "label"  )
  //  ^^ skipping these spaces
  pos = skipWhitespace(src, pos + 1, end);

  // [  lang  ](  <src>  "label"  )
  //    ^^^^ parsing language tag
  const languageTag = parseLanguageTag(src, pos, end);

  if (!languageTag) {
    return null;
  }

  // [  lang  ](  <src>  "label"  )
  //        ^^ skipping these spaces
  pos = skipWhitespace(src, languageTag.pos, end);

  if (src.slice(pos, pos + 2) !== "](") {
    return null;
  }

  // [  lang  ](  <src>  "label"  )
  //            ^^ skipping these spaces
  pos = skipWhitespace(src, pos + 2, end);

  // [  lang  ](  <src>  "label"  )
  //              ^^^^^ parsing media source
  const linkDestinationRes = md.helpers.parseLinkDestination(src, pos, end);

  if (!linkDestinationRes.ok) {
    return null;
  }

  const href = md.normalizeLink(linkDestinationRes.str);
  if (!md.validateLink(href)) {
    return null;
  }

  // [  lang  ](  <src>  "label"  )
  //                   ^^ skipping these spaces
  pos = skipWhitespace(src, linkDestinationRes.pos, end);

  // [  lang  ](  <src>  "label"  )
  //                      ^^^^^ parsing caption label
  const linkTitleRes = md.helpers.parseLinkTitle(src, pos, end);

  /** @type {string | null} */
  let label = null;
  if (linkTitleRes.ok) {
    label = linkTitleRes.str;
    pos = skipWhitespace(src, linkTitleRes.pos, end);
  }

  if (pos >= end || src.charAt(pos) !== ")") {
    return null;
  }

  return {
    pos: pos + 1,
    res: {
      src: href,
      srclang: languageTag.value,
      label,
    },
  };
}

/**
 * @typedef {object} MediaResponse
 * @property {Source[]} sources
 * @property {string} label
 * @property {string | null} title
 * @property {string | null} width
 * @property {string | null} height
 * @property {string | null} poster
 * @property {Captions[]} captions
 *
 * @param {StateInline} state
 * @param {number} start
 * @returns {null | { pos: number, res: Omit<MediaResponse, "label"> }}
 */
export function parseMediaArgs(state, start) {
  let pos = start;

  /** @type {Omit<MediaResponse, "label">} */
  const res = {
    title: null,
    poster: null,
    width: null,
    height: null,
    sources: [],
    captions: [],
  };

  // [label](  <src>  "title"  )
  //         ^^ skipping these spaces
  while (pos < state.posMax) {
    pos += 1;

    if (!isWhiteSpace(state.src.charCodeAt(pos))) {
      break;
    }
  }

  if (pos >= state.posMax) {
    return null;
  }

  // [label](  ...<src>  "title"  )
  //              ^^^^^ parsing media sources
  let mediaSource = parseMediaSource(state.src, pos, state.posMax, state.md);

  if (!mediaSource) {
    const linkDestinationRes = state.md.helpers.parseLinkDestination(
      state.src,
      pos,
      state.posMax,
    );

    if (linkDestinationRes.ok) {
      const src = state.md.normalizeLink(linkDestinationRes.str);
      if (!state.md.validateLink(src)) {
        return null;
      }

      mediaSource = {
        pos: linkDestinationRes.pos,
        res: {
          src,
          type: null,
        },
      };
    }
  }

  while (mediaSource) {
    res.sources.push(mediaSource.res);

    // [label](  <src>  ...<src>  )
    //                ^^ skipping these spaces
    pos = skipWhitespace(state.src, mediaSource.pos, state.posMax);

    mediaSource = parseMediaSource(state.src, pos, state.posMax, state.md);
  }

  if (res.sources.length === 0) {
    return null;
  }

  pos = skipWhitespace(state.src, pos, state.posMax);

  // [label](  <src>  "title"  )
  //                  ^^^^^^^ parsing media title
  const linkTitleRes = state.md.helpers.parseLinkTitle(
    state.src,
    pos,
    state.posMax,
  );

  if (pos < state.posMax && linkTitleRes.ok) {
    res.title = linkTitleRes.str;
    pos = skipWhitespace(state.src, linkTitleRes.pos, state.posMax);
  }

  // [label](  <src>  "title" ...<attrs>  )
  //                             ^^^^^^^ parsing media attrs

  // There must be at least one white space between previous and
  // next attribute.
  while (pos < state.posMax && isWhiteSpace(state.src.charCodeAt(pos - 1))) {
    // Only one size attribute allowed
    if (!res.width && !res.height) {
      const mediaSize = parseMediaSize(state.src, pos, state.posMax);
      if (mediaSize) {
        res.width = mediaSize.res.width;
        res.height = mediaSize.res.height;
        pos = skipWhitespace(state.src, mediaSize.pos, state.posMax);
        continue;
      }
    }

    // Only one poster attribute allowed
    if (!res.poster) {
      const mediaPoster = parseMediaPoster(
        state.src,
        pos,
        state.posMax,
        state.md,
      );
      if (mediaPoster) {
        res.poster = mediaPoster.value;
        pos = skipWhitespace(state.src, mediaPoster.pos, state.posMax);
        continue;
      }
    }

    const mediaCaptions = parseMediaCaptions(state.src, pos, state.posMax);
    if (mediaCaptions) {
      res.captions.push(mediaCaptions.res);

      pos = skipWhitespace(state.src, mediaCaptions.pos, state.posMax);
      continue;
    }

    break;
  }

  return { pos, res };
}

/**
 * @param {StateInline} state
 * @returns {null | { pos: number, res: MediaResponse }}
 */
export function parseMedia(state) {
  if (
    state.src.charAt(state.pos) !== "!" ||
    state.src.charAt(state.pos + 1) !== "["
  ) {
    return null;
  }

  const labelStart = state.pos + 2;
  const labelEnd = state.md.helpers.parseLinkLabel(state, state.pos + 1, false);

  // parser failed to find ']', so it's not a valid link
  if (labelEnd < 0) {
    return null;
  }

  const label = state.src.slice(labelStart, labelEnd);

  let pos = labelEnd + 1;

  if (pos < state.posMax && state.src.charAt(pos) === "(") {
    const argsRes = parseMediaArgs(state, pos);

    if (!argsRes) {
      return null;
    }

    pos = argsRes.pos;

    if (pos >= state.posMax || state.src.charAt(pos) !== ")") {
      return null;
    }

    pos += 1;

    return {
      pos,
      res: {
        label,
        ...argsRes.res,
      },
    };
  }

  // Link reference

  /** @type {{env: unknown}} */
  const { env } = state;

  if (!env || typeof env !== "object" || !("references" in env)) {
    return null;
  }

  let ref = label;
  pos = skipWhitespace(state.src, pos, state.posMax);

  if (pos < state.posMax && state.src.charAt(pos) === "[") {
    const start = pos + 1;

    pos = state.md.helpers.parseLinkLabel(state, pos);

    if (pos >= 0) {
      ref = state.src.slice(start, pos);
      pos += 1;
    } else {
      pos = labelEnd + 1;
    }
  } else {
    pos = labelEnd + 1;
  }

  // covers ref === '' and ref === undefined
  // (collapsed reference link and shortcut reference link respectively)
  if (!ref) {
    ref = state.src.slice(labelStart, labelEnd);
  }

  const { references } = env;

  if (!references || typeof references !== "object") {
    return null;
  }

  const key = state.md.utils.normalizeReference(ref);
  const link = /** @type {Record<string, unknown>} */ (references)[key];

  if (!link || typeof link !== "object") {
    return null;
  }

  /** @type {MediaResponse} */
  const res = {
    label,
    sources: [],
    title: null,
    poster: null,
    width: null,
    height: null,
    captions: [],
  };

  if ("href" in link && typeof link.href === "string") {
    res.sources = [{ src: link.href, type: null }];
  } else if ("sources" in link && Array.isArray(link.sources)) {
    res.sources = link.sources;
  } else {
    return null;
  }

  if ("title" in link && typeof link.title === "string") {
    res.title = link.title;
  }

  if ("poster" in link && typeof link.poster === "string") {
    res.poster = link.poster;
  }

  if ("width" in link && typeof link.width === "string") {
    res.width = link.width;
  }

  if ("height" in link && typeof link.height === "string") {
    res.height = link.height;
  }

  if ("captions" in link && Array.isArray(link.captions)) {
    res.captions = link.captions;
  }

  return {
    pos,
    res,
  };
}
