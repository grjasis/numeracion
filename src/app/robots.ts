import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/site";

/** robots.txt: el sitio es público y entero indexable. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  };
}
