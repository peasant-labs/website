# Website PR34 production evidence

Source: `91a953cadb7c265ca4c4ece2199a853a64330e9b`, Fairtrade `0.0.53`.
Built with `pnpm install --frozen-lockfile` and `pnpm build`; served with `pnpm start --hostname 127.0.0.1 --port 3328`.

The production stylesheet was checked for the published package's `data-agent-depth` marker. `evidence/provenance.json` records the exact source tree, build ID, widths, themes, and capture geometry. Captures include the mounted whole landing page and docs shell, plus demo and mission details. No DOM/style masking was used. All 18images were inspected.

This branch intentionally remains available after the implementation PR merges.
