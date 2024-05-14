import js from "@eslint/js";
import jsdoc from "eslint-plugin-jsdoc";
import prettier from "eslint-plugin-prettier";
import globals from "globals";

/** @type {import("eslint").Linter.FlatConfig[]} */
export default [
  js.configs.recommended,
  jsdoc.configs["flat/recommended"],

  {
    plugins: {
      prettier,
    },

    // @ts-ignore
    rules: prettier.configs.recommended.rules,
  },

  {
    ignores: [
      ".git/",
      "package-lock.json",
      "node_modules/",
      "coverage/",
      "dist/",
    ],
  },

  {
    files: ["**/*.js"],

    languageOptions: {
      globals: globals["shared-node-browser"],
      ecmaVersion: "latest",
      sourceType: "module",
    },

    rules: {
      "accessor-pairs": "error",
      "array-callback-return": "error",
      "class-methods-use-this": "error",
      curly: ["error", "all"],
      eqeqeq: [
        "error",
        "always",
        {
          null: "ignore",
        },
      ],
      "grouped-accessor-pairs": "error",
      "no-alert": "error",
      "no-caller": "error",
      "no-console": "warn",
      "no-debugger": "warn",
      "no-duplicate-imports": "error",
      "no-else-return": [
        "error",
        {
          allowElseIf: false,
        },
      ],
      "no-eval": "error",
      "no-extend-native": "error",
      "no-extra-bind": "error",
      "no-implicit-coercion": "error",
      "no-implied-eval": "error",
      "no-invalid-this": "error",
      "no-labels": "error",
      "no-lone-blocks": "error",
      "no-multi-str": "error",
      "no-new": "error",
      "no-new-func": "error",
      "no-new-wrappers": "error",
      "no-octal-escape": "error",
      "no-param-reassign": "error",
      "no-return-assign": "error",
      "no-return-await": "error",
      "no-script-url": "error",
      "no-self-compare": "error",
      "no-sequences": "error",
      "no-shadow": "error",
      "no-template-curly-in-string": "error",
      "no-throw-literal": "error",
      "no-unmodified-loop-condition": "error",
      "no-unused-expressions": "error",
      "no-unused-vars": ["error", { varsIgnorePattern: "^_" }],
      "no-useless-backreference": "error",
      "no-useless-concat": "error",
      "no-useless-rename": "error",
      "no-useless-return": "error",
      "no-var": "error",
      "no-void": "error",
      "object-shorthand": "error",
      "prefer-arrow-callback": "error",
      "prefer-const": "error",
      "prefer-destructuring": [
        "error",
        {
          VariableDeclarator: {
            array: true,
            object: true,
          },
          AssignmentExpression: {
            array: false,
            object: false,
          },
        },
      ],
      "prefer-promise-reject-errors": "error",
      "prefer-template": "error",
      radix: ["error", "as-needed"],
      "require-atomic-updates": "error",
      "sort-imports": ["error", { ignoreDeclarationSort: true }],

      // Handled better by typescript
      "jsdoc/no-undefined-types": "off",
      "jsdoc/require-param-description": "off",
      "jsdoc/require-property-description": "off",
      "jsdoc/require-returns-description": "off",
      "jsdoc/tag-lines": "off",
    },
  },

  {
    files: [
      "src/custom-element.js",
      "src/compiler/renders/to-dom.js",
      "src/compiler/renders/update-dom.js",
    ],
  },

  {
    files: ["tests/**/*.js", "*.config.js", "bin/**/*.js"],

    languageOptions: {
      globals: globals.nodeBuiltin,
    },
  },
];
