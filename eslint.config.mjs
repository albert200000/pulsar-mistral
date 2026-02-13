import globals from "globals";
import { defineConfig } from "eslint/config";
import prettierPlugin from "eslint-plugin-prettier/recommended";

export default defineConfig([
  prettierPlugin,
  {
    files: ["**/*.{js}"],
    languageOptions: {
      ecmaVersion: 2019,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.worker,
        atom: "readonly",
      },
    },
  },
]);
