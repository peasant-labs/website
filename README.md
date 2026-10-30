# Website PR35 production evidence

Source: `deaacb374bb2a78216736133176dbe028441a9ea`, Fairtrade `0.0.55`.

Built with the frozen registry lock and `pnpm build`; served with `pnpm start --hostname 127.0.0.1 --port 3381`. Every served Next stylesheet was compared byte-for-byte with this build, including the published ledger system-row separator rule.

All ten PNGs were inspected: full landing shell in both themes at 1440/390, plus the mounted viewer composition at 1440/1024/390. No styles or DOM were masked. The three phases and twelve turns remain present; no phase boundary also has an adjacent role separator. The sample contains no system turns, so that case is covered by Fairtrade's canonical release gates rather than invented app fixture content.

The exact source tree, build ID, package version, capture geometry and mounted checks are in `evidence/provenance.json`. This branch remains available after the implementation PR merges.
