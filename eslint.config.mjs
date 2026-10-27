import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

export default [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  // CSV export links are file downloads from route handlers, not pages
  { files: ["src/app/admin/**/*.tsx"], rules: { "@next/next/no-html-link-for-pages": "off" } },
  { ignores: [".next/**", "node_modules/**", ".pglite/**"] },
];
