import next from "eslint-config-next/core-web-vitals";
import ts from "eslint-config-next/typescript";

const config = [
  ...next, ...ts,
  { ignores: [".next/**", "node_modules/**", "next-env.d.ts"] },
  // The existing UI intentionally uses plain images for administrator-provided URLs.
  { rules: { "@next/next/no-img-element": "off" } },
  // These existing effects hydrate browser-only preferences after SSR.
  { files: ["src/components/PayForm.tsx", "src/components/InstallPrompt.tsx"], rules: { "react-hooks/set-state-in-effect": "off" } },
  // This async Server Component computes time remaining once per request.
  { files: ["src/app/account/page.tsx"], rules: { "react-hooks/purity": "off" } },
];
export default config;
