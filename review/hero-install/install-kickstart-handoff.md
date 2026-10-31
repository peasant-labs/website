# One-command install and agent publishing prompt

Current website slice: website/website-60--feat--install-kickstart. Documentation slice: peasant/website-60--feat--install-kickstart, commit37960105, based on fetched canonical/develop51887a07. No push/PR/merge performed by worker. Root owns consolidation and delivery.

Unix primary command: `curl -fsSL https://peasantlabs.org/install | bash -s -- --kickstart`

Agent prompt: `Publish this session with Peasant. Ask which collective if needed.`

Optionalinstaller mode uses verified newly installed absolute binary, forwards real controllingTTY only after approval and successful install. Bareinstaller unchanged. MissingTTY/cancel/checksumfailure/missingbinary neverstartsKickstart; nativeKickstart failure propagates. NoPATHprofilechange/hooks/login/publication introduced. ExistingWindowsinstaller remains its originalcommand, with explicitmanualKickstart note. Attempted portablePowerShellvalidation was bounded then dropped when interactivecursornegotiation required terminalemulation; no newWindowsruntimecode remains and the ownedtooling/processes were removed.

LP keeps canonicalTabs/CommandBlock for the terminal and canonicalCopyIconButton beside proportional plain agent prompt; no misleading shellsigil on the prompt. Consumerhydrationgate reserves44px copytarget before clientclipboard availability; noDS changes.

## Test promotion answers

1. Subject: optionalinstaller may launch ONLY the exact newly verified binary after success, with interactiveTTY and no unintended actions.
2. Necessity: ordinary function/unit assertions cannot observe controllingterminal handoff, cancellation exit, installed filesystem path or whether the wrong PATHbinary executed. This newpath directly hands off from piped Bash source into a TUI.
3. Production path: actual scripts/install.sh executed as piped `bash -s -- --kickstart`; only release downloads use local synthetic archive/checksums and binary. No productionlogic copied into the runner.
4. Cost:8 namedfixtures in YAML, one small Node runner and52-line PythonstandardlibraryPTY helper. Eachprocess≤10s plus2s parent budget; currententirefixture family<2s. No screenshot/process matrix or newCIworkflow.
5. Lifetime: unique mkdtemp fixture HOME/tool/archive directories removed in finally, ptyclosed/reaped; deadline kills ownedprocessgroup. SIGKILL may leave a uniquely named temporary fixture directory, but no realHOME/config/data or externalservices are touched; closing thePTY removes its processinput. No detached testservices.
6. Concurrency: everycaseowns unique temporary directory; no reused filename/state/db. EveryPTY owns its subprocess/session. Existing apppreview processes are untouched.
7. CIparity: pnpm test:installer requires the alreadyinstalled Node/YAML dependency, Python3standardlibrary and Bash/tar utilities (available on currentmacOS/Linux environments). NativeWindowsPowerShellwas explicitlyNOT certified; Windowsinstallation remains unchanged. Clean checkout commanddoesnotrelyon commitdepth or usercredentials.
8. Evidence: asserts exitstatus, actual installedbinary presence, correct `kickstart`argument, stdin/stdout/stderr all realTTY, noexecutionof a decoyPATHbinary, no invocation afterrefusal/failure. MountedLP tests assert exactcopy, focusable scrolling and plaintextprompt.
9. Mutation: removingthelaunchcall fails approvedfixture; launchingbeforeverify fails checksum/missingbinarycases; replacingabsolutebinarywithPATHcommand hitsdecoyandfails; omittingTTYredirection producesnony TTYtrace. Currenttests caught an invalidfakeTTYprobe (stdout checkedinsidecommandsubstitution) and it was corrected without changing productioncode.
10. Exitcondition: keep processfixture whilepipedinstallerowns terminal handoff. Ifhandoffmovesinto an alreadytestedprocessboundary with equivalentTTY/path/failureevidence, remove this helper and reuse thatboundary. Do not grow it into a general terminalemulator. Required-NAME manifest guards case deletion; no fixedcase-countdeletionguard.

## Verification

Normalbuild andTypeScript pass at e98de1f (including hydrationfix). Eight actual Unixinstallerfixtures pass. Existingfirst/phone LP tests pass after adapting removed terminalrow; widepassedinitialrunandboundedconfirmation afterone unrelated page-loadtimeout. Four mounted e98 configurations1440/390both themes pass realclipboard/notes/focus/AAaxe/overflow/runtime/hydration checks; allfour capturesinspected. Final d127e61 adds only oneCSSflexproperty and a right-edge geometryassert after visualinspectionnoticed desktopcopyactionbesidetext. That last property is intentionally awaiting root consolidatedbuild/assertion/captures, rather than duplicating anotherfullsliceaudit.

Frozen finalwebsite HEADd127e61f57960706ecd51163e7a311b8eba7b426/tree1c90cf4fabfc02a14f76a40d7966d2d46a1f7d47. Root integrated initial346andhero, thenmustcherry-picke98de1f andd127e61. Production3385still serves precisely e98de1f build93G6wBqnIUlG2upKA0Eo5, ownedPID/PGID67467, record/tmp/install-kickstart-runtime.json; rootmayretireonceconsolidatedreplacementserves. No sourcepush/PR/merge andno actualinstall/login/hooks/publishing. Root owns matching publicSites artifact.

Peasant doc379601058f40c69df251ebb2bd29f1a6254be935/tree1c262e34d5bc75f831a2372c28fa834a142dbee1 based canonical51887a07. git agent-commit unavailable; parentauthorizedordinaryexplicitlystaged/reviewedcommitfallback; nohooks/globalconfigchanged. WebsiteflagmustdeploybeforepublishingthepromotingSite/doccommand asworkingbehavior.
