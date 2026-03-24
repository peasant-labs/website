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
            <p className="text-[var(--text-primary)] mb-2">docs</p>
            <div className="space-y-1 text-[var(--text-secondary)]">
              <p>
                <span className="text-[var(--text-tertiary)]">├─ </span>
                <a
                  href="/docs/getting-started"
                  className="hover:text-[var(--accent)] transition-colors"
                >
                  getting started
                </a>
              </p>
              <p>
                <span className="text-[var(--text-tertiary)]">├─ </span>
                <a
                  href="/docs/guides"
                  className="hover:text-[var(--accent)] transition-colors"
                >
                  guides
                </a>
              </p>
              <p>
                <span className="text-[var(--text-tertiary)]">└─ </span>
                <a
                  href="/docs/cli-reference"
                  className="hover:text-[var(--accent)] transition-colors"
                >
                  cli ref
                </a>
              </p>
            </div>
          </div>

          <div>
            <p className="text-[var(--text-primary)] mb-2">community</p>
            <div className="space-y-1 text-[var(--text-secondary)]">
              <p>
                <span className="text-[var(--text-tertiary)]">├─ </span>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[var(--accent)] transition-colors"
                >
                  github
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
                  village
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
                  discord
                </a>
              </p>
            </div>
          </div>

          <div>
            <p className="text-[var(--text-primary)] mb-2">project</p>
            <div className="space-y-1 text-[var(--text-secondary)]">
              <p>
                <span className="text-[var(--text-tertiary)]">├─ </span>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[var(--accent)] transition-colors"
                >
                  license (mit)
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
                  contributing
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom line */}
        <p className="text-caption text-[var(--text-tertiary)]">
          built by peasants, for peasants. mit license.
        </p>
      </div>
    </footer>
  );
}
