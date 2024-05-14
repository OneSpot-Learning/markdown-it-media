import { strict as assert } from "node:assert";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import * as prettier from "prettier";

import markdownIt from "markdown-it";

import markdownItMedia from "../index.js";

describe("fixtures", async () => {
  const fixtureDirname = fileURLToPath(new URL("fixtures/", import.meta.url));
  const fixtureDirs = await readdir(fixtureDirname, { withFileTypes: true });
  const prettierConfigFile = await prettier.resolveConfigFile(fixtureDirname);
  const prettierOptions =
    (prettierConfigFile
      ? await prettier.resolveConfig(prettierConfigFile)
      : null) ?? {};

  for (const dir of fixtureDirs) {
    if (!dir.isDirectory()) {
      continue;
    }

    it(dir.name, async () => {
      const [source, expected, options] = await Promise.all(
        ["source.md", "expected.html", "options.json"].map((name) =>
          readFile(path.join(dir.path, dir.name, name), {
            encoding: "utf-8",
          }).catch(() => null),
        ),
      );

      if (!source) {
        assert.fail("Missing source.md");
      }

      if (!expected) {
        assert.fail("Missing expected.html");
      }

      const md = markdownIt().use(
        markdownItMedia,
        options ? JSON.parse(options) : undefined,
      );

      const result = await prettier.format(md.render(source), {
        ...prettierOptions,
        parser: "html",
      });

      assert.equal(result, expected);
    });
  }
});
