import type { Metadata } from "next";
import { AtdSeo } from "@/components/seo/AtdSeo";
import { atdPageMetadata } from "@/lib/atdSeo";

export function generateMetadata(): Metadata {
  return atdPageMetadata([]);
}

export default function Page() {
  return <AtdSeo segments={[]} />;
}
