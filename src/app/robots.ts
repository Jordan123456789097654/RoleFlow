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
        ],
      },
    ],
    sitemap: "https://roleflow.site/sitemap.xml",
  };
}
