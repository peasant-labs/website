# Landing section composition review

## Final wrapped-heading confirmation

Final source `1766d71bafe9aaa6c8b41812b081461c16be28d1`, production build `6a9ZLKOjR30BBjxOIQpzR`.

The only delta from the initial composition source below is readable leading for the wrapped hero and final CTA titles, plus computed mounted assertions. Both use 1.4: 40px/56px at desktop and 28px/39.2px on phone, in both themes. The selected phrase groups and all placements/actions remain intact.

The normal production build, TypeScript and touched-test ESLint pass. The existing section test passes across all six fixture layouts (desktop/tablet/phone, light/dark). Twelve refreshed desktop/phone images were inspected: zero overflow, page errors or WCAG-tagged axe findings; transcript windows remain at scroll offset zero. The original 23-test result and six-state audit below remain retained; broad route suites were not repeated for these two line-height rules.

[Final report](landing/leading-confirmation/report.json), [provenance](landing/leading-confirmation/provenance.json), [section test](landing/leading-confirmation/section-test.log), [build](landing/leading-confirmation/build.log), [TypeScript](landing/leading-confirmation/tsc.log), [touched-test ESLint](landing/leading-confirmation/lint-delta.log).

### Final hero

| View | Light | Dark |
|---|---|---|
| desktop | ![desktop light](https://raw.githubusercontent.com/peasant-labs/website/website-38--screenshots/landing/leading-confirmation/desktop-light-hero.png) | ![desktop dark](https://raw.githubusercontent.com/peasant-labs/website/website-38--screenshots/landing/leading-confirmation/desktop-dark-hero.png) |
| phone | ![phone light](https://raw.githubusercontent.com/peasant-labs/website/website-38--screenshots/landing/leading-confirmation/phone-light-hero.png) | ![phone dark](https://raw.githubusercontent.com/peasant-labs/website/website-38--screenshots/landing/leading-confirmation/phone-dark-hero.png) |

### Final mission and CTA

| View | Light | Dark |
|---|---|---|
| desktop | ![desktop light](https://raw.githubusercontent.com/peasant-labs/website/website-38--screenshots/landing/leading-confirmation/desktop-light-outro.png) | ![desktop dark](https://raw.githubusercontent.com/peasant-labs/website/website-38--screenshots/landing/leading-confirmation/desktop-dark-outro.png) |
| phone | ![phone light](https://raw.githubusercontent.com/peasant-labs/website/website-38--screenshots/landing/leading-confirmation/phone-light-outro.png) | ![phone dark](https://raw.githubusercontent.com/peasant-labs/website/website-38--screenshots/landing/leading-confirmation/phone-dark-outro.png) |

Full-page confirmation: [desktop light](landing/leading-confirmation/desktop-light-full.png), [desktop dark](landing/leading-confirmation/desktop-dark-full.png), [phone light](landing/leading-confirmation/phone-light-full.png), [phone dark](landing/leading-confirmation/phone-dark-full.png).

---

# Initial composition evidence

Mounted production evidence for source `a293a068bfb9738fe1f4ba6f2905bf4bc9d6309b`, build `8jhGSyembN8sdlIKq1r5d`.

The selected direction combines a centered Open field hero, Paired canvas mission with text left and illustration right, and a centered Quiet column final invitation. These are the real production components and original artwork, including the animated card journey. The static captures use the supported reduced-motion finished frame.

## Validation

- Normal frozen install, production build and TypeScript check pass.
- ESLint: zero errors; six existing warnings in untouched project tests.
- 23 focused production checks pass, including six hero geometry cases with every named flight stage, pause/reduced-motion, selected section relationships and phrase wrapping, real CTA exits, four graph host/theme cases, phone transcript cards and keyboard window access.
- Six whole landing states inspected: 1440, 768 and 390 pixels, each in light and dark. Zero page errors, page overflow or WCAG 2 A/AA / 2.1 A/AA tagged axe violations. All transcript window body scroll offsets remain zero.
- One correction batch reduced phone button padding while retaining 52px targets. Final full-page transitions and affected phone details were inspected again. Other route coverage remains recorded in the preceding [full route audit](https://github.com/peasant-labs/website/tree/website-37--screenshots); it was not repeated for this landing-only change.

Source/build/served CSS and image hashes: [provenance](landing/provenance.json). Per-state metrics: [report](landing/report.json). [Focused tests](landing/focused-tests.log), [build](landing/build.log), [TypeScript](landing/tsc.log), [ESLint](landing/lint.log).

## Mounted captures

### Hero and site header

| View | Light | Dark |
|---|---|---|
| Desktop 1440 | ![Desktop 1440 light](https://raw.githubusercontent.com/peasant-labs/website/website-38--screenshots/landing/desktop-light-hero.png) | ![Desktop 1440 dark](https://raw.githubusercontent.com/peasant-labs/website/website-38--screenshots/landing/desktop-dark-hero.png) |
| Tablet 768 | ![Tablet 768 light](https://raw.githubusercontent.com/peasant-labs/website/website-38--screenshots/landing/tablet-light-hero.png) | ![Tablet 768 dark](https://raw.githubusercontent.com/peasant-labs/website/website-38--screenshots/landing/tablet-dark-hero.png) |
| Phone 390 | ![Phone 390 light](https://raw.githubusercontent.com/peasant-labs/website/website-38--screenshots/landing/phone-light-hero.png) | ![Phone 390 dark](https://raw.githubusercontent.com/peasant-labs/website/website-38--screenshots/landing/phone-dark-hero.png) |

### Mission through final CTA and footer

| View | Light | Dark |
|---|---|---|
| Desktop 1440 | ![Desktop 1440 light](https://raw.githubusercontent.com/peasant-labs/website/website-38--screenshots/landing/desktop-light-outro.png) | ![Desktop 1440 dark](https://raw.githubusercontent.com/peasant-labs/website/website-38--screenshots/landing/desktop-dark-outro.png) |
| Tablet 768 | ![Tablet 768 light](https://raw.githubusercontent.com/peasant-labs/website/website-38--screenshots/landing/tablet-light-outro.png) | ![Tablet 768 dark](https://raw.githubusercontent.com/peasant-labs/website/website-38--screenshots/landing/tablet-dark-outro.png) |
| Phone 390 | ![Phone 390 light](https://raw.githubusercontent.com/peasant-labs/website/website-38--screenshots/landing/phone-light-outro.png) | ![Phone 390 dark](https://raw.githubusercontent.com/peasant-labs/website/website-38--screenshots/landing/phone-dark-outro.png) |

### Full shell and page transitions

- Desktop 1440: [light](landing/desktop-light-full.png), [dark](landing/desktop-dark-full.png)
- Tablet 768: [light](landing/tablet-light-full.png), [dark](landing/tablet-dark-full.png)
- Phone 390: [light](landing/phone-light-full.png), [dark](landing/phone-dark-full.png)
