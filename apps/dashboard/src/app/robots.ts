import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://fatisda26-taskpanel.vercel.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login", "/privacy", "/terms"],
        disallow: ["/api/", "/dashboard/"],
      },
    ],
    sitemap: `${appUrl}/sitemap.xml`,
  };
}

