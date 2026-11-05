import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { MapView } from "@/components/map/MapView";
import {
  ATD_FILTERS_PUBLIC_PATH,
  ATD_PLACES_PUBLIC_PATH,
  absoluteUrl,
  withBasePath,
} from "@/lib/paths";
import { DEFAULT_TITLE, SITE_TITLE_TEMPLATE } from "@/lib/siteTitle";
import "@shappoff/ui/styles.css";
import "./globals.css";
import styles from "./layout.module.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(absoluteUrl("/")),
  title: {
    default: DEFAULT_TITLE,
    template: SITE_TITLE_TEMPLATE,
  },
  description: "Карта губерний, уездов, волостей и населённых пунктов.",
  openGraph: {
    locale: "ru_RU",
    type: "website",
    siteName: "АТД",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <div className={styles.shell}>
          <div className={styles.map}>
            <MapView
              workerUrl={withBasePath("/maplibre/maplibre-gl-worker.mjs")}
              placesUrl={withBasePath(ATD_PLACES_PUBLIC_PATH)}
              filtersUrl={withBasePath(ATD_FILTERS_PUBLIC_PATH)}
            />
          </div>
          <div className={styles.content}>{children}</div>
        </div>
      </body>
    </html>
  );
}
