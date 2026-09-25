import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Local scratch — files staged for deletion, not part of the project.
    "_to_delete/**",
  ]),
  {
    rules: {
      // New in eslint-plugin-react-hooks v6 (React Compiler guidance). The
      // existing "load data in an effect, set status to loading" pattern used
      // across ~20 older components trips it; the code works correctly, so it
      // is a warning (shown, not blocking `npm run lint`) until those
      // components are refactored. New code should avoid it.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);

export default eslintConfig;
