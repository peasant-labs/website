import { DOCS_GUIDES, type DocStep } from "@/lib/docs-content";

/**
 * The guides' copy, as data: each step is a list of blocks the guide page
 * draws and the docs search indexes, so the two can never disagree. Text uses
 * the same `code`, **control** and [link](href) marks as lib/docs-content.ts.
 *
 * Every step id is a public address (testdata/docs/anchors.yaml): add ids
 * freely, never rename or remove one.
 */
export type DocBlock =
  | Readonly<{ p: string }>
  | Readonly<{ ol: readonly string[] }>
  | Readonly<{ ul: readonly string[] }>
  | Readonly<{ cmds: readonly string[] }>
  | Readonly<{ captioned: readonly Readonly<{ caption: string; command: string }>[] }>
  | Readonly<{ options: readonly DocStep[] }>
  | Readonly<{ note: string }>
  | Readonly<{ path: string }>;

export type GuideStepData = Readonly<{ id: string; title: string; toc: string; body: readonly DocBlock[] }>;

export type GuideData = Readonly<{
  id: (typeof DOCS_GUIDES)[number]["id"];
  lede: string;
  steps: readonly GuideStepData[];
}>;

/*
 * Sources: village's new-collective form, collective settings (members) and
 * review page; fairtrade's publish window; peasant `village transcripts list
 * --help`, `village transcripts pull --help` and docs/pull.md.
 */
export const EVALS_GUIDE: GuideData = {
  id: "evals",
  lede: "Run a small coding task, measure the result independently, then collect the approved sessions that explain it.",
  steps: [
{
  "id": "task",
  "title": "prepare one repeatable task",
  "toc": "prepare one repeatable task",
  "body": [
    {
      "p": "This worked example is synthetic. You will ask two agent configurations to implement the same duration parser, run an independent checker, and keep the sessions behind both results. Peasant records and shares the work; it does not run the eval or calculate a score."
    },
    {
      "p": "You need Python 3, Git, a coding agent, and a disposable directory. These setup commands use a macOS, Linux or WSL shell. Create the task and its fixture before opening either agent session:"
    },
    {
      "captioned": [
        {
          "caption": "create the task and test fixtures",
          "command": "mkdir duration-eval\ncd duration-eval\ngit init\ncat > parser.py <<'PYTHON'\ndef parse_duration(value):\n    raise NotImplementedError(\"implement me\")\nPYTHON\ncat > cases.json <<'JSON'\n[\n  {\"input\": \"15s\", \"expected\": 15},\n  {\"input\": \"2m\", \"expected\": 120},\n  {\"input\": \"0s\", \"expected\": 0},\n  {\"input\": \"2h\", \"error\": \"ValueError\"},\n  {\"input\": \"-1s\", \"error\": \"ValueError\"},\n  {\"input\": \"1.5m\", \"error\": \"ValueError\"}\n]\nJSON\ncat > check.py <<'PYTHON'\nimport json\nfrom parser import parse_duration\n\ncases = json.load(open(\"cases.json\"))\npassed = 0\nfor case in cases:\n    try:\n        result = parse_duration(case[\"input\"])\n        ok = \"expected\" in case and result == case[\"expected\"]\n    except Exception as error:\n        ok = type(error).__name__ == case.get(\"error\")\n    passed += int(ok)\n    print((\"PASS\" if ok else \"FAIL\"), repr(case[\"input\"]))\nprint(f\"{passed}/{len(cases)} passed\")\nraise SystemExit(0 if passed == len(cases) else 1)\nPYTHON\ngit add parser.py cases.json check.py\ngit commit -m \"test: prepare duration parser task\""
        }
      ]
    },
    {
      "p": "Run `python3 check.py` now. The starter should print `0/6 passed` and exit with status 1. This confirms that the checker catches an unfinished implementation."
    },
    {
      "cmds": [
        "python3 check.py"
      ]
    },
    {
      "p": "Start the first agent session in this directory and paste the same prompt into each run:"
    },
    {
      "captioned": [
        {
          "caption": "task prompt",
          "command": "Implement parse_duration(value) in parser.py. Accept only a string of ASCII digits followed by s or m; return whole seconds as an integer. Zero is valid. Reject all other inputs with ValueError. Do not change cases.json or check.py. Run python3 check.py, report its output, and commit only parser.py."
        }
      ]
    },
    {
      "p": "Record the base commit, agent configuration, model identifier, prompt, and permitted tools outside the task directory. After the first run, keep its commit and session reference. Start the second run in a fresh clone of the base commit, with the same files and prompt. Do not give it the first solution."
    },
    {
      "note": "Keep both the passing and failing sessions. If you select only successes, the collection cannot explain the failures."
    }
  ]
},
{
  "id": "score",
  "title": "score the task outside peasant",
  "toc": "score the task outside peasant",
  "body": [
    {
      "ol": [
        "For each completed run, inspect the diff. Confirm that only parser.py changed and the fixture and checker are untouched.",
        "Run python3 check.py yourself in that run’s checkout. Save the actual output and exit status. A claimed pass in the agent’s final message is not your measurement.",
        "Run each configuration on the same task from the same base. For a larger comparison, repeat across a fixed task set and keep the failures as well."
      ]
    },
    {
      "p": "A successful implementation prints six PASS lines, then `6/6 passed`, and exits 0. The checker only covers the listed cases; inspect the implementation against the full prompt too. For example, a parser accepting fractional minutes violates the task even if unrelated tests pass."
    },
    {
      "captioned": [
        {
          "caption": "comparison worksheet: fill with your measurements",
          "command": "run,base_commit,agent_config,model,transcript_id,passed,total,exit_status,notes\na,<same base>,<configuration a>,<model>,<id>,<measured>,6,<measured>,<observation>\nb,<same base>,<configuration b>,<model>,<id>,<measured>,6,<measured>,<observation>"
        }
      ]
    },
    {
      "p": "Report passed cases and task completion separately. State the sample size, task set, environment and review rule. Two runs of one toy parser are a worked example, not evidence that one model is generally better."
    }
  ]
},
    {
      id: "collective",
      title: "make a collective",
      toc: "make a collective",
      body: [
        {
          ol: [
            "On peasant online, open **collectives** and choose **new collective**.",
            "Name it duration-eval and describe the fixed task, contribution rules and intended use.",
            "Set **who can publish** to **curated**, so each transcript waits for your approval.",
            "Set **who can read** to **members only**.",
            "Choose **create collective**.",
          ],
        },
      ],
    },
    {
      id: "install",
      title: "ask contributors to install peasant",
      toc: "install peasant",
      body: [
        { p: "Each contributor runs:" },
        { p: "Follow [the quick setup](/docs#quickstart), including kickstart on Windows." },
        {
          p: "In kickstart they connect to peasant online, which signs them in with GitHub, and choose the projects to track.",
        },
        { p: "Claude Code users also add the plugin:" },
        { cmds: ["/plugin marketplace add peasant-labs/peasant-plugins", "/plugin install peasant@peasant-plugins"] },
      ],
    },
    {
      id: "invite",
      title: "invite them",
      toc: "invite them",
      body: [
        { p: "A curated collective is invite-only. Once a contributor has signed in:" },
        { ol: ["Open the collective's settings.", "Under **members**, choose **invite by github username**."] },
        {
          p: "They join as members. To keep contributors from reading each other's sessions, change their role to **contributor**.",
        },
      ],
    },
    {
      id: "publish",
      title: "contributors publish",
      toc: "contributors publish",
      body: [
        { p: "In Claude Code, `/peasant` opens the session in the browser. There they:" },
        {
          ol: [
            "Choose **publish**.",
            "Check what leaves their computer and who can read it.",
            "Add your collective, and publish.",
          ],
        },
        {
          p: "The session then waits for your approval, because the collective is curated. They see it on their peasant online home under **waiting for approval**.",
        },
        {
          note: "Redaction runs on each contributor's computer before anything is sent. Credentials, personal details, paths and project identifiers are replaced with placeholders.",
        },
      ],
    },
    {
      id: "approve",
      title: "approve what goes in",
      toc: "approve what goes in",
      body: [
        {
          ol: [
            "On the collective's page, open the more menu and choose **review transcripts**.",
            "Select contributions.",
            "Choose **approve selected** or **reject selected**.",
          ],
        },
        { p: "You can also approve or reject from a transcript's own page." },
      ],
    },
    {
      id: "pull",
      title: "pull the set",
      toc: "pull the set",
      body: [
        {
          captioned: [
            { caption: "log in", command: "peasant village login" },
            { caption: "see what you can pull", command: 'peasant village transcripts list --collective duration-eval --all' },
            { caption: "preview the download", command: 'peasant village transcripts pull --collective duration-eval --dry-run' },
            { caption: "download approved transcripts", command: 'peasant village transcripts pull --collective duration-eval' },
          ],
        },
        {
          ul: [
            "`--collective` takes the collective's name, its id or its page URL. Repeat it for more than one.",
            "Only approved transcripts are pulled.",
            "Add `--user <account>` for one contributor, or `--dry-run` to preview.",
          ],
        },
        { p: "Each transcript lands in its own folder, kept apart from your own sessions:" },
        { path: "~/.local/share/peasant/village-pulls/<village host>/<transcript id>/" },
        { p: "It holds `transcript.jsonl` and `metadata.json`. Every agent's sessions arrive in the same shape." },
      ],
    },
{
  "id": "inspect",
  "title": "inspect the evidence and resolve problems",
  "toc": "inspect the evidence and resolve problems",
  "body": [
    {
      "p": "List the downloaded inventory, replace <transcript-id> with one actual id, and render its tool calls offline:"
    },
    {
      "cmds": [
        "peasant village transcripts list --local",
        "peasant village transcripts context <transcript-id> --format-tool-calls verbose"
      ]
    },
    {
      "p": "Add each actual transcript id to the worksheet. Read whether the agent ran the checker, saw a failing case, corrected its implementation, and made the commit. Store your checker output alongside the worksheet. A transcript is evidence of the process; the independent checkout supplies the score."
    },
    {
      "ul": [
        "Nothing to pull: confirm the author published to duration-eval and its owner approved the contribution. Publishing a private transcript without that collective does not add it to the set.",
        "Only part of the set appears in a listing: use --all; the remote list shows one page by default.",
        "Access denied: sign in as an account allowed to read the collective. Knowing its name or URL does not grant access.",
        "A run cannot be reproduced: check the base commit, environment and unmodified checker before attributing the difference to the model."
      ]
    }
  ]
},
  ],
};

/*
 * Sources: village's collective settings (github orgs, pull requests), its
 * account settings, the pull-request page and the GitHub check and comment it
 * writes, and its waiting pull requests list and matcher; fairtrade's publish
 * window; peasant-plugins README and peasant `village auto --help`.
 */
export const REVIEWS_GUIDE: GuideData = {
  id: "reviews",
  lede: "Show reviewers the agent sessions behind a change, right from the pull request.",
  steps: [
{
  "id": "example",
  "title": "prepare a concrete change",
  "toc": "prepare a concrete change",
  "body": [
    {
      "p": "This synthetic example follows a fix that stops retrying a billing request after a permanent error. The author has one commit, abc1234, on the PR, and a local agent session that recorded that commit. Replace the example commit and repository with your own."
    },
    {
      "ul": [
        "Inputs: a PR containing the fix, its agent session, a collective with the repository linked, and a reviewer who belongs to that collective.",
        "Review question: did the agent distinguish permanent failures from temporary failures, and test both paths?",
        "Expected evidence: the recorded instruction, the relevant tool calls and test output, and a recorded commit that is actually on the PR."
      ]
    },
    {
      "captioned": [
        {
          "caption": "example author instruction",
          "command": "Fix retries so permanent billing errors stop immediately. Keep retries for temporary errors. Add regression coverage for both outcomes, run the relevant tests, and commit the change."
        }
      ]
    },
    {
      "p": "Make and commit the change in the agent session. Push the branch and open the pull request with your usual Git workflow. Peasant does not replace your test runner or code review."
    }
  ]
},
    {
      id: "link",
      title: "link your repositories",
      toc: "link your repositories",
      body: [
        { p: "As the collective's owner:" },
        {
          ol: [
            "Open the collective's settings and choose **connect github** to install the GitHub app.",
            "Back on peasant online, under **github orgs**, choose **manage**.",
            "Pick the repositories and save.",
          ],
        },
        { p: "A collective links one GitHub org today." },
      ],
    },
    {
      id: "show",
      title: "show transcripts on pull requests",
      toc: "show transcripts",
      body: [
        { p: "In the same settings, under **pull requests**, turn on **show transcripts on pull requests**." },
        {
          p: "Peasant online then adds one `peasant / prompts` check and one comment to pull requests in the linked repositories. The comment lists which commits have transcripts.",
        },
        { p: "The comment is updated in place, and the check never blocks merging." },
      ],
    },
    {
      id: "publish",
      title: "publish the session behind the change",
      toc: "publish the session",
      body: [
        { p: "The author types `/peasant` in Claude Code and publishes the session to the collective." },
        { p: "To publish on every git push instead, do one of these:" },
        {
          options: [
            { text: "In the publish window, tick **publish this repo automatically on git push**.", commands: [] },
            { text: "In Claude Code, type `/peasant auto`.", commands: [] },
            { text: "In the repository, run:", commands: ["peasant village auto"] },
          ],
        },
        {
          p: "Automatic publishing sends to the collectives you published to last. It is private with no license, skips review, and never blocks a push. More in [publish automatically](/docs#auto-publish).",
        },
      ],
    },
    {
      id: "attach",
      title: "link it to the pull request",
      toc: "link it",
      body: [
        {
          ol: [
            "Comment `/peasant attach` on the pull request.",
            "Peasant online replies with how many of your transcripts match, and a link.",
            "Open the link and choose **attach**.",
          ],
        },
        {
          p: "Until one of your transcripts matches, the pull request waits in **pull requests** on peasant online. Publishing a session behind one of its commits links it with no click.",
        },
        {
          p: "To skip the comment, turn on **link my transcripts to my pull requests automatically** in your own settings on peasant online, under **pull requests**. It is off by default, and covers the repositories your collectives link.",
        },
        {
          note: "A transcript links only when one of its recorded commits is in the pull request; a matching branch name is not enough. Linking never changes who can read a transcript.",
        },
      ],
    },
    {
      id: "review",
      title: "review",
      toc: "review",
      body: [
        {
          p: "The comment counts the transcripts and the commits they trace. It links to the pull request's page on peasant online.",
        },
        {
          p: "That page shows how many commits are traced, with the transcripts on the left and their prompts on the right. `j` and `k` move between them.",
        },
        { p: "Each reviewer sees only the transcripts they can read, so reviewers should be members of the collective." },
        { ol: [
          "Start with the diff and identify the permanent-error branch. Open the peasant / prompts check or its comment, then the linked PR page on peasant online.",
          "Open the transcript associated with the fix commit. Find the original instruction and the agent's decision about which failures can retry.",
          "Expand the tool calls that ran the regression tests. Check the command, output and whether it tested both permanent and temporary failures. An agent saying tests passed is weaker evidence than the recorded tool output.",
          "Compare the final diff with that evidence and run the repository's checks yourself. Leave findings on the GitHub PR with the transcript link and the relevant commit."
        ] },
        { captioned: [{ caption: "example reviewer finding", command: "The permanent-error path stops retrying, but the recorded test run only covers temporary errors. Please add and run a regression test proving a permanent failure makes exactly one request. Evidence: <transcript URL>, commit <actual commit>." }] },
        { note: "The check reports transcript coverage. It does not certify that the code is correct, that tests passed, or that every change was produced by an agent." },
      ],
    },
{
  "id": "troubleshooting",
  "title": "when the pr has no transcript",
  "toc": "when the pr has no transcript",
  "body": [
    {
      "ul": [
        "No match: confirm that the session recorded a commit on the PR. A matching repository or branch name alone is insufficient. If the branch was rewritten, check the current PR commits against the recorded evidence.",
        "No attachment: publish your own session to the linked collective, then follow [the attachment steps](#attach) and confirm the preview. The automatic-link setting is personal and off by default.",
        "A reviewer cannot open the transcript: add them to the appropriate collective. Attaching to a public repository never makes the transcript public.",
        "A curated contribution is waiting: the collective owner must approve it before it is available as approved collective evidence.",
        "No check or comment: ask the collective owner to confirm GitHub App access, the linked repository, and show transcripts on pull requests."
      ]
    }
  ]
},
  ],
};

export const CLASSROOM_GUIDE: GuideData = {
  "id": "classroom",
  "lede": "Collect the sessions behind an assignment, then review how each student used an agent.",
  "steps": [
    {
      "id": "assignment",
      "title": "define the assignment and evidence",
      "toc": "define the assignment and evidence",
      "body": [
        {
          "p": "Worked example: students implement the duration parser from [the eval tutorial](/docs/guides/evals#task). Give everyone the same base files, task prompt and cases.json. Tell students that you will review the process as well as run the checker."
        },
        {
          "captioned": [
            {
              "caption": "example submission brief",
              "command": "Implement the duration parser. Submit your code commit, the actual output of python3 check.py, and the transcript of the agent session you used. In your own words, name one agent suggestion you accepted or corrected and explain why. Publish only to our class collective."
            }
          ]
        },
        {
          "p": "Agree what students should publish before they begin. Peasant contains only the sessions they choose to publish; an absent transcript cannot prove that no agent was used."
        }
      ]
    },
    {
      "id": "collective",
      "title": "set up a private class collective",
      "toc": "set up a private class collective",
      "body": [
        {
          "ol": [
            "As the class collective owner, create a collective named duration-class. Set who can publish to curated and who can read to members only.",
            "Ask students to complete [setup](/docs#quickstart) and sign in. Invite them by GitHub username in collective settings.",
            "Change student roles to contributor when they should submit without reading other students’ work. Keep teaching reviewers as members."
          ]
        },
        {
          "note": "A contributor is an existing collective role. Peasant has no separate teacher or student role. Use the actual roles and access settings instead of assuming the class roster grants access."
        }
      ]
    },
    {
      "id": "submit",
      "title": "submit and approve the work",
      "toc": "submit and approve the work",
      "body": [
        {
          "ol": [
            "The student opens their own session locally, reads it, and chooses publish.",
            "They review redaction, add duration-class, and publish. The curated contribution waits for approval.",
            "The owner opens review transcripts from the collective’s more menu and approves the intended submissions.",
            "The student supplies the transcript link and code commit with their assignment. The link does not widen access."
          ]
        },
        {
          "p": "If a transcript contains material the student should not share, they should stop before publishing. Redaction hides detected sensitive values; it does not replace reading the material."
        }
      ]
    },
    {
      "id": "review",
      "title": "review one submission",
      "toc": "review one submission",
      "body": [
        {
          "ol": [
            "Run the independent checker on the submitted code. Save its real output.",
            "Read the published session for the task instruction, implementation choices, failing tests and corrections.",
            "Compare the student’s explanation with the recorded tool calls and final commit. Give feedback on a specific decision, not transcript length or token totals."
          ]
        },
        {
          "captioned": [
            {
              "caption": "example feedback",
              "command": "Your transcript shows that you noticed the 1.5m case failed and changed the parser. Explain why rejecting a fractional value follows the assignment, and point to the final test run in your submission."
            }
          ]
        },
        {
          "ul": [
            "Missing submission: confirm the student chose the class collective and the owner approved it.",
            "A reviewer cannot open it: check the reviewer’s account and collective membership.",
            "Need local copies for review: follow [pull the approved set](/docs/guides/evals#pull), replacing duration-eval with duration-class."
          ]
        }
      ]
    }
  ]
};

export const ONBOARDING_GUIDE: GuideData = {
  "id": "onboarding",
  "lede": "Use a past pull request and its recorded sessions to understand a code decision.",
  "steps": [
    {
      "id": "choose",
      "title": "choose a small merged change",
      "toc": "choose a small merged change",
      "body": [
        {
          "p": "Worked example: a new teammate is learning why a billing retry loop stops on permanent errors. Pick a merged PR that changed that behavior and has attached transcripts. You need repository access and membership in a collective that can read them."
        },
        {
          "ol": [
            "Read the PR description and the final diff before opening the transcript.",
            "Write down a question: why does a permanent error stop the loop, and what test protects that decision?",
            "Open the peasant / prompts check or comment, then its linked PR page on peasant online."
          ]
        },
        {
          "note": "Older PRs may have no transcript. Use the [PR review guide](/docs/guides/reviews) for future changes; Peasant cannot reconstruct an agent session that was never recorded."
        }
      ]
    },
    {
      "id": "trace",
      "title": "trace the decision through the session",
      "toc": "trace the decision through the session",
      "body": [
        {
          "ol": [
            "Choose the transcript associated with the relevant PR commit.",
            "Read the original prompt and find the turn that distinguishes temporary failures from permanent ones.",
            "Expand the tool calls around the implementation and regression tests. Compare what ran with the final diff.",
            "Note any corrections from the author. They often explain a constraint the final code alone does not show."
          ]
        },
        {
          "captioned": [
            {
              "caption": "example reading notes: fill from the real session",
              "command": "PR: <URL>\nCommit: <actual commit>\nTranscript: <URL>\nDecision: <what stops a retry>\nReason: <prompt or correction that explains it>\nEvidence: <test command and recorded result>\nOpen question: <what the trace does not establish>"
            }
          ]
        },
        {
          "p": "Treat the transcript as historical evidence. A suggestion that appeared early may have been rejected. Check the final code and current tests before reusing it."
        }
      ]
    },
    {
      "id": "reuse",
      "title": "test your understanding in the repository",
      "toc": "test your understanding in the repository",
      "body": [
        {
          "ol": [
            "Find the current test that covers the same error path. Run it with the repository’s documented test command.",
            "Explain the behavior to a teammate using the PR, commit and transcript references in your notes.",
            "If you reuse a prompt, preserve its constraints but update repository-specific details. Review the new agent output on its own merits."
          ]
        },
        {
          "p": "A useful outcome is a concrete explanation such as: permanent errors return immediately; temporary errors keep the retry budget; the linked test distinguishes them. Fill in those details only when your chosen code and evidence establish them."
        }
      ]
    },
    {
      "id": "offline",
      "title": "keep a readable local reference",
      "toc": "keep a readable local reference",
      "body": [
        {
          "p": "If your account can pull the transcript, replace <transcript-url> with its actual page URL:"
        },
        {
          "cmds": [
            "peasant village login",
            "peasant village transcripts pull <transcript-url>",
            "peasant village transcripts context <transcript-url> --format-tool-calls verbose"
          ]
        },
        {
          "p": "The context command reads the downloaded transcript offline. Pulled transcripts stay separate from your own sessions and are not published back."
        },
        {
          "ul": [
            "Access denied: ask a collective owner to confirm membership and whether that transcript is shared there. The PR being public does not grant transcript access.",
            "No matching session: use the code and PR discussion for this change, and record the missing evidence in your notes.",
            "Current behavior differs: the transcript describes that historical change; follow later commits before treating it as current design."
          ]
        }
      ]
    }
  ]
};

export const FIND_SESSIONS_GUIDE: GuideData = {
  "id": "find-sessions",
  "lede": "Find a session on your computer and recover the reasoning behind a change.",
  "steps": [
    {
      "id": "import",
      "title": "make your saved sessions searchable",
      "toc": "make your saved sessions searchable",
      "body": [
        {
          "p": "Worked example: you remember fixing retries in a repository called billing, but cannot remember the agent or day. First import the sessions your supported agents still have on this computer."
        },
        {
          "cmds": [
            "peasant harvest --dry-run",
            "peasant harvest",
            "peasant web start"
          ]
        },
        {
          "p": "Open the local web at [localhost:8690](http://localhost:8690). Browse your sessions and use search to look for a distinctive instruction or phrase from the work, such as permanent error. Nothing needs to be published."
        },
        {
          "note": "Peasant can import source files that still exist. It cannot recover sessions your agent already deleted. [Recording help](/docs#record) covers source locations and selection."
        }
      ]
    },
    {
      "id": "narrow",
      "title": "narrow by repository and time",
      "toc": "narrow by repository and time",
      "body": [
        {
          "p": "The terminal is useful when you know the repository and approximate date. Replace billing with your repository’s directory basename or git remote URL:"
        },
        {
          "cmds": [
            "peasant sessions list --project billing --since 14d --limit 50"
          ]
        },
        {
          "p": "This lists local ingested sessions from the last two weeks. If you know the agent, add its supported --harness filter; use peasant sessions list --help for the accepted values. Widen the date or remove the project filter when the result is empty."
        },
        {
          "p": "Copy the actual session id from the result. To inspect the opening entries in the terminal:"
        },
        {
          "cmds": [
            "peasant sessions context --session <session-id> --turn 0 -C 5"
          ]
        },
        {
          "p": "The --turn value is the raw entry index, not a position in a compact list. Use the indices the command shows when you inspect another part of the session."
        }
      ]
    },
    {
      "id": "read",
      "title": "recover the decision, not just the phrase",
      "toc": "recover the decision, not just the phrase",
      "body": [
        {
          "ol": [
            "Open the matching session in the local web, or read its entries in the terminal. Confirm the repository and date before treating it as the right work.",
            "Read the surrounding prompt, tool result and correction. Search hits alone can include a failed attempt or an abandoned plan.",
            "Check the recorded commits against the repository’s current history. Use the session to explain the change, then verify the current implementation."
          ]
        },
        {
          "captioned": [
            {
              "caption": "example recovery note",
              "command": "I found the retry session for <repository> on <date>. The relevant instruction was <prompt>. The agent changed <behavior> after <test or correction>. Recorded commit: <actual commit>. Current code still needs verification at <file or test>."
            }
          ]
        },
        {
          "p": "Keep the session local if it is just for you. To send it to a teammate, choose publish, review redaction and select a collective they can read. Opening the session or copying its local URL does not publish it."
        }
      ]
    },
    {
      "id": "missing",
      "title": "when a session is missing",
      "toc": "when a session is missing",
      "body": [
        {
          "ul": [
            "Check the saved project selection with peasant kickstart. Selection scopes discovery and lists; it does not erase already-stored sessions.",
            "Check that the agent’s source is enabled in local settings and that its saved files exist. For a custom source folder, follow [record sessions](/docs#record).",
            "Run harvest again after the agent writes more of its source transcript. Importing an active session does not make later turns appear without another import.",
            "A transcript pulled from peasant online is separate: use peasant village transcripts list --local and peasant village transcripts context <transcript-id> instead."
          ]
        }
      ]
    }
  ]
};

export const GUIDES = [EVALS_GUIDE, REVIEWS_GUIDE, CLASSROOM_GUIDE, ONBOARDING_GUIDE, FIND_SESSIONS_GUIDE] as const;
