import { strict as assert } from "node:assert";
import { describe, it } from "node:test";

import Renderer from "markdown-it/lib/renderer.mjs";
import Token from "markdown-it/lib/token.mjs";

import { renderMedia } from "./render.js";

describe("renderMedia", () => {
  it("renders empty media tokens", () => {
    const token = new Token("media", "video", 0);
    const result = renderMedia([token], 0, {}, {}, new Renderer());

    assert.equal(result, "<video></video>");
  });

  it("renders media tokens with attrs", () => {
    const token = new Token("media", "video", 0);

    token.attrSet("controls", "");

    const result = renderMedia([token], 0, {}, {}, new Renderer());

    assert.equal(result, '<video controls=""></video>');
  });

  it("renders media tokens with children", () => {
    const token = new Token("media", "video", 0);

    {
      const source = new Token("source", "source", 0);
      source.attrSet("src", "/movie.webm");

      const text = new Token("text", "", 0);
      text.content = "Description of Video";

      const linkOpen = new Token("link_open", "a", 1);
      linkOpen.attrSet("href", "/movie.webm");

      const linkContent = new Token("text", "", 0);
      linkContent.content = "Download webm video";

      const linkClose = new Token("link_close", "a", -1);

      token.children = [source, text, linkOpen, linkContent, linkClose];
    }

    const result = renderMedia([token], 0, {}, {}, new Renderer());

    assert.equal(
      result,
      '<video><source src="/movie.webm">Description of Video<a href="/movie.webm">Download webm video</a></video>',
    );
  });
});
