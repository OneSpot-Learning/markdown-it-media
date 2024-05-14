/**
 * @typedef {Record<string, string>} AttrsOption
 * @typedef {object} PluginOptions
 * @property {boolean} [controls=false]
 * @property {object} [attrs]
 * @property {AttrsOption} [attrs.image]
 * @property {AttrsOption} [attrs.audio]
 * @property {AttrsOption} [attrs.video]
 * @typedef {import("markdown-it").PluginWithOptions<PluginOptions>} Plugin
 */

import { createMediaRule } from "./ruler.js";
import { renderMedia } from "./render.js";

/** @type {Plugin} */
export function markdownItMedia(md, options) {
  md.inline.ruler.before("image", "media", createMediaRule(options));
  md.inline.ruler.disable("image");

  md.renderer.rules.audio = renderMedia;
  md.renderer.rules.video = renderMedia;
}
