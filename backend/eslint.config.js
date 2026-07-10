import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";

export default tseslint.config(
  {
    ignores: ["dist/**", "node_modules/**", "prisma/**"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.node,
    },
    rules: {
      // Express middleware/route handlers and third-party payloads (Prisma
      // JSON fields, passport callbacks) lean on `any` in a few spots.
      "@typescript-eslint/no-explicit-any": "warn",
      // Express handlers often take unused (req, res, next) args by
      // convention — allow leading-underscore opt-out instead of churn.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  // Prettier last: disables stylistic rules so ESLint and Prettier don't fight.
  eslintConfigPrettier,
);
