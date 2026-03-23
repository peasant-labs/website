import type { MDXComponents } from "mdx/types";
import { Callout } from "@/components/mdx/callout";
import { Steps } from "@/components/mdx/steps";

const components: MDXComponents = {
  h1: (props) => (
    <h1
      className="text-display text-[var(--accent)] mb-2 pb-3 border-b border-[var(--border-strong)] font-bold tracking-tight"
      {...props}
    />
  ),

  h2: (props) => (
    <h2
      className="text-heading text-[var(--text-primary)] mt-12 mb-4 font-bold"
      {...props}
    >
      <span className="text-[var(--text-tertiary)] mr-2 select-none">
        {"──"}
      </span>
      {props.children}
    </h2>
  ),

  h3: (props) => (
    <h3
      className="text-subheading text-[var(--text-primary)] mt-8 mb-3 font-semibold"
      {...props}
    />
  ),

  p: (props) => (
    <p
      className="text-body text-[var(--text-secondary)] mb-4 leading-relaxed"
      {...props}
    />
  ),

  a: (props) => (
    <a
      className="text-[var(--accent)] underline underline-offset-4 decoration-[var(--accent)]/40 hover:decoration-[var(--accent)] transition-colors"
      {...props}
    />
  ),

  code: (props) => {
    // If inside a <pre>, render without inline styling
    const isInPre =
      typeof props.className === "string" &&
      props.className.includes("language-");
    if (isInPre) {
      return <code {...props} />;
    }
    return (
      <code
        className="bg-[var(--bg-elevated)] text-[var(--amber)] px-1.5 py-0.5 text-small border border-[var(--border-default)]"
        {...props}
      />
    );
  },

  pre: (props) => (
    <pre
      className="bg-[var(--bg-surface)] border border-[var(--border-default)] p-4 my-6 overflow-x-auto text-small leading-relaxed"
      {...props}
    />
  ),

  ul: (props) => (
    <ul className="my-4 space-y-1 text-[var(--text-secondary)]" {...props} />
  ),

  ol: (props) => (
    <ol
      className="my-4 space-y-1 text-[var(--text-secondary)] counter-reset-[step]"
      {...props}
    />
  ),

  li: (props) => (
    <li className="text-body flex items-start gap-2" {...props}>
      <span className="text-[var(--text-tertiary)] select-none shrink-0">
        {"$"}
      </span>
      <span>{props.children}</span>
    </li>
  ),

  blockquote: (props) => (
    <blockquote
      className="border-l-2 border-[var(--accent)] pl-4 my-6 text-[var(--text-tertiary)] italic"
      {...props}
    />
  ),

  table: (props) => (
    <div className="my-6 overflow-x-auto border border-[var(--border-default)]">
      <table className="w-full text-small" {...props} />
    </div>
  ),

  th: (props) => (
    <th
      className="text-left px-4 py-2 bg-[var(--bg-elevated)] text-[var(--text-primary)] border-b border-[var(--border-default)] font-semibold"
      {...props}
    />
  ),

  td: (props) => (
    <td
      className="px-4 py-2 text-[var(--text-secondary)] border-b border-[var(--border-default)]"
      {...props}
    />
  ),

  hr: (props) => (
    <hr className="my-8 border-[var(--border-default)]" {...props} />
  ),

  // Custom MDX components available in all docs
  Callout,
  Steps,
};

export function useMDXComponents(): MDXComponents {
  return components;
}
