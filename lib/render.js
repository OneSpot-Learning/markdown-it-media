/**
 * @typedef {import("markdown-it/lib/renderer.mjs").RenderRule} RenderRule
 */

/** @type {RenderRule} */
export function renderMedia(tokens, index, options, env, renderer) {
  const token = tokens[index];
  const attrs = renderer.renderAttrs(token);

  const open = `<${token.tag}${attrs}>`;
  const close = `</${token.tag}>`;

  let content = "";
  if (token.children) {
    content = renderer.renderInline(token.children, options, env);
  }

  return `${open}${content}${close}`;
}
