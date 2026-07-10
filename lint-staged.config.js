// lint-staged config as a JS module (not the package.json "lint-staged" key)
// because frontend/ and backend/ are independent npm projects with their own
// node_modules — eslint isn't installed at the repo root, so plain
// "eslint --fix" in a package.json string command fails with ENOENT when
// lint-staged runs from the git root. These function-form tasks `cd` into
// the right subproject first so npx resolves each project's local eslint
// and flat config (frontend/eslint.config.js / backend/eslint.config.js).
const path = require("path");

/**
 * @param {string[]} filenames absolute paths of staged files matching the glob
 * @param {string} subdir project subdirectory ("frontend" | "backend")
 */
function eslintFixIn(subdir, filenames) {
  const relFiles = filenames
    .map((f) => path.relative(path.resolve(subdir), f))
    .map((f) => `'${f}'`)
    .join(" ");
  return `sh -c "cd ${subdir} && npx eslint --fix ${relFiles}"`;
}

module.exports = {
  "frontend/**/*.{ts,tsx}": (filenames) => [
    `prettier --write ${filenames.map((f) => `'${f}'`).join(" ")}`,
    eslintFixIn("frontend", filenames),
  ],
  "backend/**/*.ts": (filenames) => [
    `prettier --write ${filenames.map((f) => `'${f}'`).join(" ")}`,
    eslintFixIn("backend", filenames),
  ],
  "**/*.{json,md,css}": ["prettier --write"],
};
