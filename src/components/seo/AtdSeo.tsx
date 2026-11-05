import Link from "next/link";
import { atdSeoJsonLd, loadAtdSeoDocument } from "@/lib/atdSeo";
import styles from "./AtdSeo.module.css";

type AtdSeoProps = {
  segments: readonly string[];
};

export function AtdSeo({ segments }: AtdSeoProps) {
  const document = loadAtdSeoDocument(segments.join("/"));
  const jsonLd = atdSeoJsonLd(document);

  return (
    <section className={`${styles.seo} atd-seo`} inert aria-hidden="true">
      <h1>{document.title}</h1>
      <p>{document.description}</p>
      <nav aria-label="Путь">
        <ol>
          {document.breadcrumbs.map((crumb, index) => {
            const current = index === document.breadcrumbs.length - 1;
            return (
              <li key={crumb.href ?? crumb.label}>
                {current || !crumb.href ? (
                  crumb.label
                ) : (
                  <Link href={crumb.href}>{crumb.label}</Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      <h2>{document.heading}</h2>
      <ul>
        {document.items.map((item) => (
          <li key={item.href ?? item.label}>
            {item.href ? (
              <Link href={item.href}>{item.label}</Link>
            ) : (
              item.label
            )}
          </li>
        ))}
      </ul>
      <script type="application/ld+json">{jsonLd}</script>
    </section>
  );
}
