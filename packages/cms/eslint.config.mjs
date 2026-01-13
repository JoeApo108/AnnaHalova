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
    ".open-next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Scripts are plain JS with require()
    "scripts/**",
  ]),
  // Custom rules
  {
    rules: {
      // Allow calling functions that set state in useEffect (common data fetching pattern)
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);

export default eslintConfig;
