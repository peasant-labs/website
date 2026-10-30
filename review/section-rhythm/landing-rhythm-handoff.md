# Landing section rhythm

Ready implementation: `website/website-60--fix--landing-section-rhythm` clean HEAD `30c33111066d4690db831830f3812942e028b868`, tree `96f25e7bf23bf9d4f6cbb7b4f4ab5f9e217088c4`, from fetched current origin/main `a55869ca`. No push, PR or merge performed. Persistent3314 untouched.

One CSS file only: `app/landing.css`, 11 additions/14 removals. Landing-only inherited section space clamps from72px to152px, with9vw fluid middle. The hero and mission now use the same rhythm as other landing sections, and the closing invitation inherits it. Other pages retain the original site rhythm. Artwork, component tree, copy, motion, fonts, heading scale, within-group gaps and CTA sizes are unchanged.

Actual content-to-content boundaries, measured in the built page:

| boundary |390before→after|768before→after|1440before→after|
|---|---|---|---|
|hero art→agent band|40→72|40→72|40→129.59|
|band→install|56→72|57.59→72|108→129.59|
|ordinary adjacent sections|112→144|115.19→144|216→259.19|
|sample→mission|96→144|97.59→144|164→259.19|
|mission→closing|96→144|96→144|112→259.19|
|closing→footer|96→112|96→112|96→169.59|

The group heights and widths are identical before/after. These are measured content bounds, not padding-only claims. All major boundaries are coherent; the largest actual gap at1440is259px, and144px onphone/tablet. Within-group spacing remains24–32px, so sections read as separate groups.

## Verification

- `pnpm install --frozen-lockfile` passed; lockfile unchanged.
- `pnpm build` passed, log `/tmp/landing-rhythm-build.log`.
- `pnpm exec tsc --noEmit` passed, log `/tmp/landing-rhythm-tsc.log`.
- Existing focused mounted tests: `pnpm exec playwright test --config /tmp/landing-rhythm.config.cjs --grep 'every section opens|the selected landing sections'`:2passed, including6fixture cases. Log `/tmp/landing-rhythm-tests.log`. No new low-impact tests added.
- Impeccable layout mechanical scan on source before/after: `[]`, no findings. Visual assessment performed separately first.
- Six mounted theme/size combinations1440/768/390: full,hero,outro =18 images, all inspected. No page errors, document overflow or WCAG2A/AA-tagged axe violations. No Firefox pass claimed.
- Actual normal-motion held scenes at1440/768/390 fit their available screen; stage nonzero, no overflow. Actual phonepointercoarse confirmed true. `/about` footer padding exactly unchanged at all3widths. Proof `scope.json`.

## Exact served artifact

Temporary detached production server3383 parent/PGID22574, cwd feature worktree above, log `/tmp/landing-rhythm-server.log`; buildID`lK0NSTHoM8xutuJOl0WAy`. Ownership `/tmp/landing-rhythm-runtime.json`.

Evidence directory `.agents.local/website-section-rhythm-qa/` contains18inspectedPNG, report.json, scope.json, provenance.json. All23observed served JS/CSS assets byte-identical to the clean normal build; unique `.site-shell:has(>.lp)`/9vw marker verified in servedCSS. Provenance records source/tree/buildID/sourceCSSsha plus every assethash and before/after measurements.

## Selected frame

Updated `.agents.local/visualizations/selected-landing-layout.html` and official rendered `selected-landing-layout-preview.html` SPACING ONLY after reading full visualize skill. Original SVG and images, exactcopy, colors, type, innergroupgaps unchanged. Header gap follows one section unit; hero→mission and mission→closing follow two, matching production measured rhythm. No doubled margin/padding creates a larger interval. Existing3395server serves current export.

All6updated frame shots1440/1024/390both themes inspected; runtime/overflow/bounds/bodyfloor QA and heading/touch QA (including320)pass. Sourcehash in `selected-landing-layout-qa/proof.json`matches current fragment. Root must include the fragment reference in this turn final because the fragment was updated.

User finding to retain verbatim (root owns register append): “the sections spacings feel tooooo crowded; the kickstart still not desired, too complicated too flluffed i want to minimize steps not add more”.
