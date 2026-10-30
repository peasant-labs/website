# Website PR35 production evidence

Source: `deaacb374bb2a78216736133176dbe028441a9ea`, Fairtrade `0.0.55`.

Built with the frozen registry lock and `pnpm build`; served with `pnpm start --hostname 127.0.0.1 --port 3381`. Every served Next stylesheet was compared byte-for-byte with this build, including the published ledger system-row separator rule.

All ten PNGs were inspected: full landing shell in both themes at 1440/390, plus the mounted viewer composition at 1440/1024/390. No styles or DOM were masked. The three phases and twelve turns remain present; no phase boundary also has an adjacent role separator. The sample contains no system turns, so that case is covered by Fairtrade's canonical release gates rather than invented app fixture content.

The exact source tree, build ID, package version, capture geometry and mounted checks are in `evidence/provenance.json`. This branch remains available after the implementation PR merges.

## Delivery verified on 2026-10-30

PR 35 merged as `d37fac61fc0b7ef76f3731b038ff3dc4ce4e301a`; its source tree matches the inspected implementation. A fresh frozen install and normal build from synced `website/main` passed. Both Railway production projects succeeded: GitHub deployments `7433282269` and `7433282292`.

Fresh browser requests to `peasantlabs.org` and `website-production-165b.up.railway.app` returned the separator fix. Their shared stylesheet `3c26fdba4950bfa9.css` is byte-identical to the inspected artifact (SHA256 `3960b6cbd890298e57ed194bd72ba2fcc39674030dd0b37bea74c37c5295daa9`); every other linked Next stylesheet also matches. The refreshed main preview on 3314 returns 200 at `/`, `/docs`, and `/blog`. Exact statuses, hashes, fresh response metadata and preview smoke are retained in [delivery/production.json](delivery/production.json).
