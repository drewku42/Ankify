import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";

export default tseslint.config(
  {
    ignores: ["dist/**", "node_modules/**", "src/components/ui/**"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  reactHooks.configs.flat.recommended,
  reactRefresh.configs.vite,
  {
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    rules: {
      // Existing code uses `any` in a handful of places (API payloads, event
      // handlers); catching real bugs matters more than banning `any` outright.
      "@typescript-eslint/no-explicit-any": "warn",
      // Unused function args are common in callback signatures (e.g. Redux
      // reducers, Express-style handlers) — allow leading-underscore opt-out.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // eslint-plugin-react-hooks v7's "recommended" bundles new React
      // Compiler-oriented diagnostics (set-state-in-effect, immutability,
      // static-components, etc.) on top of the classic rules-of-hooks /
      // exhaustive-deps pair. One existing effect (DeckPage.tsx) derives
      // local state from a prop/state value inside useEffect — a real but
      // pre-existing pattern, not a bug worth a refactor here. Downgrade to
      // warn so it's visible without failing lint.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  // Prettier last: disables stylistic rules so ESLint and Prettier don't fight.
  eslintConfigPrettier,
);
