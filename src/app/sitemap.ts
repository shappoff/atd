import type { MetadataRoute } from "next";
import { getAtdFilterIndex } from "@/lib/atdData";
import { atdStaticParams } from "@/lib/atdRoute";
import { absoluteUrl } from "@/lib/paths";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    "/",
    ...atdStaticParams(getAtdFilterIndex()).map(
      (param) => `/${param.atd.join("/")}/`,
    ),
  ];

  return paths.map((path) => ({ url: absoluteUrl(path) }));
}
