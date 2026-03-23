export function Footer() {
  return (
    <footer className="bg-[var(--bg-deep)] pt-16 pb-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Full-width separator */}
        <div className="border-t border-[var(--border-default)] mb-12" />

        {/* Brand — matches header logo */}
        <div className="mb-8">
          <span className="text-subheading text-[var(--accent)] font-mono select-none">
            {"{p}"}
          </span>
        </div>

        {/* Three-column nav */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-12 text-small">
          <div>
            <p className="text-[var(--text-primary)] mb-2">Docs</p>
            <div className="space-y-1 text-[var(--text-secondary)]">
              <p>
                <span className="text-[var(--text-tertiary)]">├─ </span>
                <a
                  href="/docs/getting-started"
                  className="hover:text-[var(--accent)] transition-colors"
                >
                  Getting Started
                </a>
              </p>
              <p>
                <span className="text-[var(--text-tertiary)]">├─ </span>
                <a
                  href="/docs/guides"
                  className="hover:text-[var(--accent)] transition-colors"
                >
                  Guides
                </a>
              </p>
              <p>
                <span className="text-[var(--text-tertiary)]">└─ </span>
                <a
                  href="/docs/cli-reference"
                  className="hover:text-[var(--accent)] transition-colors"
                >
                  CLI Ref
                </a>
              </p>
            </div>
          </div>

          <div>
            <p className="text-[var(--text-primary)] mb-2">Community</p>
            <div className="space-y-1 text-[var(--text-secondary)]">
              <p>
                <span className="text-[var(--text-tertiary)]">├─ </span>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[var(--accent)] transition-colors"
                >
                  GitHub
                </a>
              </p>
              <p>
                <span className="text-[var(--text-tertiary)]">├─ </span>
                <a
                  href="https://village.peasantlabs.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[var(--accent)] transition-colors"
                >
                  Village
                </a>
              </p>
              <p>
                <span className="text-[var(--text-tertiary)]">└─ </span>
                <a
                  href="https://discord.gg"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[var(--accent)] transition-colors"
                >
                  Discord
                </a>
              </p>
            </div>
          </div>

          <div>
            <p className="text-[var(--text-primary)] mb-2">Project</p>
            <div className="space-y-1 text-[var(--text-secondary)]">
              <p>
                <span className="text-[var(--text-tertiary)]">├─ </span>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[var(--accent)] transition-colors"
                >
                  License (MIT)
                </a>
              </p>
              <p>
                <span className="text-[var(--text-tertiary)]">└─ </span>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[var(--accent)] transition-colors"
                >
                  Contributing
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom line */}
        <p className="text-caption text-[var(--text-tertiary)]">
          Built by peasants, for peasants. MIT License.
        </p>
      </div>
    </footer>
  );
}
