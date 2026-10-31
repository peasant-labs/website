# Compact hero implementation

Ready sourcec0f7bfd0ec0b2c79f7eee32411b977a1288e83f1, treeaa5608ba3ac527f838d73174ffb5d70c7b5a60e2. Clean worktreewebsite/website-60--fix--compact-hero from verified currentorigin/main59223199. No push/PR/merge performed.

## Changed behavior

Wide artwork is one shallow cluster:280×76-cellstage,capped840px. Laptop/card drawings and per-person scales retain the three-pixel grid. The stack rests near the laptop/people instead of floating54cells higher; side objects are pulled toward it. Phone uses its original100×82layout unchanged. Centered title/CTA, exact factual copy, generous section spacing, mission/closing, original scan/redact/flight/stack logic and grounded figure behavior remain unchanged. No artwork assets redrawn.

At1440/1920the scene is840×228 instead of1080×366. Local bounds: laptop(15,21)285×174; topcard(324,33)180×126; stackbase(321,186)186×12; commons(543,66)279×150. The stack/laptop bottom difference is3px instead of171px; space below the centerbase is30px instead of189px. Resting gaps are21px laptop→stack and39px card→commons. No new canvas/holder/border.

## Validation

Normalfrozeninstall/build andTypeScriptpass. Eight existing focused mounted tests pass:6theme/sizegeometrycases, original loop/pause/reducedmotion/groundedfigures test, andselected-sectioncompositiontest. The old wide raised-triangle assertion is replaced by fixture-based baseline spread, topinset and boundedsubjectgap constraints. Phone's original separation and all perspective/grounding assertions remain. Rest geometry is read under reducedmotion; the test explicitly enables normalmotion and requires real animations before sampling each journey frame.

Commands: pnpm install --frozen-lockfile; pnpm build; pnpm exec tsc --noEmit; pnpm exec playwright test --config /tmp/hero-compact.config.cjs --grep 'the hero composition|the hero picture loops|the selected landing sections'. Logs /tmp/hero-compact-{install,build,tsc,tests}.log. Impeccablelayoutdetectafterchange returns[]; parent owns the independent beforeassessments.

Twenty-four actual production images inspected:8cases1440/1920/768/390both themes ×fullmountedviewport/restingscenecrop/actualnormalmotioncrest. All48sampledjourneyframes stayinside theircanvas; all8axechecks report0violations, allpageerrors/overflow0.320DOMbounds also0overflow. All23servedJS/CSS assets match the normalbuild; source/runtimehashes,buildID andeverycapturehash retained in .agents.local/hero-compact-qa/{report,provenance}.json. NoFirefoxpassclaimed. One bounded firstpass, no runtimecoordinatecorrectionneeded.

## Temporary runtime ownership

Productionhttp://localhost:3384, parent/PGID63036, cwdwebsite/website-60--fix--compact-hero, buildvV5qaS9-aGcntPUAcuCeX. Ownership /tmp/hero-compact-runtime.json; log /tmp/hero-compact-server.log. DetachedPopen/start_new_session. Leave running for rootreviews. Persistent3314 untouched. Root retires3384onlyaftermergedreplacementproof.

## Selected frame

Read fullvisualizeskill beforeediting. Updatedselected-landing-layout.html andofficialexport with new280×76wideSVG/max840, usingonlytheoriginalsymbols. Repeatedexistingcards form the visible stack, matching sharedground; no newpaths/assets. Below48remtheexistingmobileframearrangement is retained. Othersectioncontent/spacing unchanged. Existing3395servesexport. SixframeQA andsixheading/touch/overflowchecks pass (includes320); all6wholeframeimagesinspected plusfinal4wideheroconfirmation. Root MUSTinclude selectedfragmentreference in sameturnfinal: <workspace>/.agents.local/visualizations/selected-landing-layout.html, modewide.
