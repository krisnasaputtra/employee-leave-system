import packageJson from "../../package.json";

const currentYear = new Date().getFullYear();

export const APP_CONFIG = {
  name: "LRM",
  version: packageJson.version,
  copyright: `© ${currentYear}, PT Bank Negara Indonesia (Persero) Tbk.`,
  meta: {
    title: "LRM — Leave Request Management",
    description:
      "LRM (Leave Request Management) — Employee leave request, approval, and tracking platform.",
  },
};
