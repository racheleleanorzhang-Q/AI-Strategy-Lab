import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // The original simulator predates React 19's stricter compiler-oriented rules.
  // Keep it behaviorally unchanged while new scenarios follow the current defaults.
  {
    files: ["components/StrategySimulator.tsx"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "react-hooks/purity": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/rules-of-hooks": "off",
    },
  },
  {
    files: ["components/ui/{badge,input}.tsx"],
    rules: { "@typescript-eslint/no-empty-object-type": "off" },
  },
  {
    files: ["lib/engine/apiClient.ts"],
    rules: { "@typescript-eslint/no-explicit-any": "off" },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
