import { ContactForm } from "@/components/contact-form";
import { SiteShell } from "@/components/site-shell";
import { metadataForRoute } from "@/lib/projects";

export const metadata = metadataForRoute({
  title: "contact | peasant labs",
  description: "leave an email — one message when the work is published.",
  canonical: "/contact",
});

export default function ContactPage() {
  return (
    <SiteShell>
      <main id="content" className="pj-main" tabIndex={-1}>
        <header className="pj-catalog-hero">
          <div className="pj-hero-copy">
            <h1 id="project-heading" tabIndex={-1}>
              contact
            </h1>
            <p className="pj-lede" data-reading-text>
              leave an email — one message when the work is published.
            </p>
          </div>
        </header>

        <section className="pj-section pj-contact" aria-label="email signup">
          <ContactForm />
        </section>
      </main>
    </SiteShell>
  );
}
