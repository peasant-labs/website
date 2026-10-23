import { ContactForm } from "@/components/contact-form";
import { SiteShell } from "@/components/site-shell";
import { metadataForRoute } from "@/lib/projects";

export const metadata = metadataForRoute({
  title: "contact | peasant",
  description: "leave your email and we will send you one message when it is ready.",
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
              leave your email and we will send you one message when it is ready.
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
