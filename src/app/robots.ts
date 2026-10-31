import { PARENT_ORIGIN } from "@/lib/platform-hosts";
import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin",
          "/support/panel",
          "/auth/reset-password",
          "/roster",
          "/roster/",
        ],
      },
    ],
    sitemap: PARENT_ORIGIN + "/sitemap.xml",
  };
}
