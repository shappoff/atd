import type { Metadata } from "next";
import { AtdSeo } from "@/components/seo/AtdSeo";
import { getAtdFilterIndex } from "@/lib/atdData";
import { atdStaticParams } from "@/lib/atdRoute";
import { atdPageMetadata } from "@/lib/atdSeo";

export const dynamicParams = false;

export function generateStaticParams() {
  return atdStaticParams(getAtdFilterIndex());
}

export async function generateMetadata({
  params,
}: PageProps<"/[...atd]">): Promise<Metadata> {
  const { atd } = await params;
  return atdPageMetadata(atd);
}

export default async function Page({ params }: PageProps<"/[...atd]">) {
  const { atd } = await params;
  return <AtdSeo segments={atd} />;
}
