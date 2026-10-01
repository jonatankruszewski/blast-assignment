import { rxova } from "@rxova/repo-config/eslint";
import tseslint from "typescript-eslint";

export default rxova({
  tsconfigRootDir: import.meta.dirname,
  strict: true,
  node: ["*.config.{js,ts}", "**/*.config.{js,ts}"],
  browser: ["packages/*/src/**", "apps/*/src/**"],
  react: { files: ["**/*.{ts,tsx}"] },
  tests: true,
  ignores: ["**/storybook-static/**"],
  extends: [tseslint.configs.stylisticTypeChecked],
});
