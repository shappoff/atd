import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { MapView } from "@/components/map/MapView";
import { withBasePath } from "@/lib/paths";
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
  title: "ATD",
  description: "Next.js static site",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <div className={styles.shell}>
          <div className={styles.map}>
            <MapView
              workerUrl={withBasePath("/maplibre/maplibre-gl-worker.mjs")}
            />
          </div>
          <div className={styles.content}>{children}</div>
        </div>
      </body>
    </html>
  );
}
