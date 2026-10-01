import { baseKnipConfig } from "@rxova/repo-config/knip";

// lint-staged backs the pre-commit hook, which is disabled until hardening (M7).
export default baseKnipConfig({ docsApp: false, ignoreDependencies: ["lint-staged"] });
