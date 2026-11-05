import type { Essay } from "@/lib/essay";

/*
 * A Short Guide to Data Strikes and Conscious Data Contribution in the Context of 2026 Frontier AI
 * by Nick Vincent, first published on Data Leverage on 2026-03-03:
 * https://dataleverage.substack.com/p/a-short-guide-to-data-strikes-and
 * Republished here as a guest post. The words, links, figures and notes
 * are his, unchanged; [^n] marks a note, *stars* mark his emphasis, and \[ \]
 * are brackets he wrote around a link.
 */
export const STRIKES: Essay = {
  blocks: [
    {
      kind: "figure",
      src: "/blog/a-short-guide-to-data-strikes/1.jpeg",
      alt: "A nineteenth-century lithograph of the Boston Tea Party: men on a ship throw chests of tea into the harbor while a crowd cheers from the wharf.",
      width: 1024,
      height: 790,
      caption: "The destruction of tea at Boston Harbor / lith. & pub. by Sarony & Major \\[[link](https://www.loc.gov/item/2003664100/)\\]",
    },
    {
      kind: "p",
      text: "This post will attempt to restate some of the basic arguments of data leverage in the context of (1) developments in the AI space and (2) a series of events involving Anthropic, OpenAI, and US public bodies that coincided with a notable public response.[^1] A key goal in writing this post is to highlight the very simple actions you can take now to make it relatively painless to switch between AI products and control how data you produce is used.",
    },
    {
      kind: "p",
      text: "At the moment, the exact details around the contracts and negotiations remain uncertain; I do not feel confident[^2] about having a strong take on the particulars. However, the reaction from the public does seem to warrant some commentary. Claude usage seems to be [surging](https://www.cnbc.com/2026/02/28/anthropics-claude-apple-apps.html). “[QuitGPT](https://quitgpt.org/)”, a grassroots boycott aimed at OpenAI, also seems to have substantial [participation](https://www.technologyreview.com/2026/02/10/1132577/a-quitgpt-campaign-is-urging-people-to-cancel-chatgpt-subscriptions/) (they claim 1.5 million participants at the time of writing). Figures in popular culture are also getting involved: Katy Perry has seemingly publicly [endorsed](https://www.businessinsider.com/katy-perry-anthropic-department-of-defense-spat-claude-subscription-2026-2) switching from ChatGPT to Claude in a newsworthy fashion. It also seems that AI companies are facing [internal](https://www.wsj.com/tech/ai/openai-ceo-altman-defends-pentagon-work-to-staff-calls-backlash-really-painful-76d769ec) pressure from employees to explain and justify their decisions. These are all pretty noisy signals, but together do tell a pretty consistent story: some chunk of the public is reacting to AI company decision-making!",
    },
    {
      kind: "p",
      text: "In this post, I am nottrying to endorse a data strike or contribution campaign aiming to help or hurt any particular lab. I am trying to make the case that developments in the AI space have seriously reduced the friction to engage in such action, so you might as well get ready to do so in case you want to “vote with your data” now or down the line. The current situation is very dynamic — we will probably see individual employees continue to jump between labs, new details emerge, fresh rounds of negotiations between labs and various potential customers, etc. Luckily, as I’ll argue below, because the frictions around data leverage are trending downwards, interested users can easily make their data-related collective action appropriately dynamic.",
    },
    {
      kind: "p",
      text: "To summarize arguments from early “[data strikes](https://dl.acm.org/doi/10.1145/3308558.3313742)” [and](https://dl.acm.org/doi/10.1145/3449177) “[data leverage](https://dl.acm.org/doi/10.1145/3442188.3445885)” work[^3]:",
    },
    {
      kind: "list",
      ordered: false,
      items: [
        {
          text: [
            "In general, the public has at least two avenues for gaining leverage to govern large companies: they can utilize consumer leverage (for instance, starting a boycott) or use existing political processes (for instance, voting for a politician who promises to pass certain regulations).",
          ],
        },
        {
          text: [
            "When companies use highly data-dependent technologies — which include new powerful “frontier AI models”, as well as the “classics” such as search engines, classification systems, and various types of recommender systems — the public has access to a complementary “third avenue” for gaining leverage: they can reduce, stop, redirect, or manipulate their data-generating behaviors to impact the effectiveness of data-dependent technologies.",
          ],
        },
        {
          text: [
            "Data leverage might emerge from the withholding or redirection of data used for training, but it could also emerge from data that’s used for *evaluation* (and this might be especially powerful in the short term).",
          ],
        },
      ],
    },
    {
      kind: "p",
      text: "Determining the most effective combination of deleting/withholding data (a “data strike”), redirecting data to a competitor (“conscious data contribution”), or manipulating data (“data poisoning”[^4]) for any given context remains a challenging (and interesting!) open area of research, with encouraging recent progress[^5].",
    },
    {
      kind: "p",
      text: "In many ways, frontier AI developments have made certain kinds of data leverage more challenging. The average size of a training set has gone up, which drives down the marginal impact of any one individual or small group of people. When there are only 10 people in a dataset, your contributions might cause a model to jump from 80 to 90 percent accuracy; that’s a lot! But when there are 10 million people in the dataset, instead you might contribute only 0.001 “points” of accuracy (to make up a number — the relationship isn’t linear and depends on many factors).",
    },
    {
      kind: "p",
      text: "Certain types of data leverage campaigns now require a larger number of total individuals to participate to achieve success. However, there are still plenty of ways that small groups can implement very effective collective action. In particular, the withholding or redirection of “long-tail data” is promising, and data strikes and bargaining around *scarce evaluation data* in particular can create very large amounts of leverage.",
    },
    {
      kind: "p",
      text: "To restate this point: as AI becomes more general, general-purpose models are deployed into many more domains. This proliferation increases the number of ‘niche bottlenecks’ where a small pool of experts controls high-value data and the ability to evaluate (and attest to their evaluations). So even though the total number of people contributing to “general LLM pre-training” is very high (and therefore doing collective action to massively harm “general” capabilities is harder than ever before), new tasks/domains/contexts are emerging in which you might legitimately be one of the ten people who is a true expert.[^6]",
    },
    {
      kind: "p",
      text: "Furthermore, from an individual’s perspective, voting with your data is in many ways *easier than it’s ever been*. Even though achieving critical mass may be challenging, the cost to engage in simple data-related action is very low! LLM and coding agent products are actually less “sticky” than many previous digital technologies. Data tends to be very easy to export (it’s mostly just text, for now), many core configuration choices actually just involve durable plaintext files, and many AI technologies can be used from “model-agnostic” interfaces.",
    },
    {
      kind: "p",
      text: "Of course, companies will try to make their AI products sticky. They might offer proprietary memory features, or integration with specialized software. But there’s a deep tension here — genuinely capable agents can likely use their genuine capabilities to undo such stickiness. If an AI company sells me access to a highly capable AI service that includes attempts to keep me locked in (e.g., proprietary approach to storing my “key memories”), that AI service can likely export the “stuff that matters” for me!",
    },
    {
      kind: "p",
      text: "AI capabilities can also support leverage in other ways. LLMs likely reduce the cost of organizing collective action itself. AI can certainly help with many of the technical aspects of starting and maintaining data leverage campaigns (e.g., setting up websites and communication channels) and help individual users troubleshoot any friction points.",
    },
    {
      kind: "p",
      text: "The stickiness of social networks could easily return in full force. We’ll have to see if any major frontier offerings become more embedded in actual social networks. xAI is taking a stab at this with Grok’s integration the X/Twitter social network, but OpenAI, Anthropic, and Google have all yet to really shoot for full social integration.",
    },
    {
      kind: "p",
      text: "With all this in mind, here’s a simple bulleted list of things you can do or think about today if you’re even vaguely interested in engaging in some type of data leverage at some point in the future. For computer scientists and technologists reading this blog who like to give tech advice to friends and family, consider sharing some of these tips!",
    },
    {
      kind: "list",
      ordered: false,
      items: [
        {
          text: [
            "You should, by default, select the “opt out” option for training. I would recommend only opting in if you receive direct benefits or if companies substantially increase their level of transparency around (1) the use of your data and (2) relevant use restrictions that you care about (e.g., mass surveillance).",
          ],
          list: {
            ordered: false,
            items: [
              {
                text: [
                  "In the short term, until the standard practices around opting in change, you don’t really stand to gain much from doing so. Even if you’re a huge AI fan, maintaining optionality to have leverage in the future is probably better for the AI field.",
                ],
              },
            ],
          },
        },
        {
          text: [
            "You should consider rotating the AI technologies that you use to reduce switching costs in the future. If you purchase the more expensive AI products, consider adopting habits so that it’s easy to switch which particular lab you buy the “top line” subscription from on a month-to-month basis.",
          ],
        },
        {
          text: [
            "You should consider exporting entire chat histories and/or manually exporting “high-value” chats.",
          ],
        },
        {
          text: [
            "You could consider using AI models via third-party intermediaries. This might mean using services like [OpenRouter](https://openrouter.ai/) or [themultiplicity.ai](http://themultiplicity.ai). You might also consider offerings with a strong privacy emphasis such as [oa-chat](https://chat.openanonymity.ai/) from the “Open Anonymity Project” at Stanford, the “[confer.to](https://confer.to/)” fully encrypted product, or DuckDuckGo’s “[Duck.ai](https://duck.ai/)”.",
          ],
          list: {
            ordered: false,
            items: [
              {
                text: [
                  "Even though AI coding agents are very capable, you might consider continuing to use web interfaces like those mentioned above specifically to avoid leaking extra data (for instance, files on your computer!) into transcripts.",
                ],
              },
            ],
          },
        },
        {
          text: [
            "You could talk to your friends about what AI products they use and why they’ve chosen a particular offering.",
          ],
        },
        {
          text: [
            "While the industry (and society at large!) continues to work out exactly various kinds of “data rules” will be enforced going forward, you might consider erring on the side of publishing less content to the open Internet or doing so with more restricted licenses. Hopefully we will soon gain clarity on the rulebook for data scraping going forward so we can keep the benefits of open sharing.",
          ],
          list: {
            ordered: false,
            items: [
              {
                text: [
                  "Corollary: you should keep an eye out for news regarding which data licensing approaches get the support needed for effective enforcement. You can bet that I’ll be posting about this topic on this blog!",
                ],
              },
            ],
          },
        },
      ],
    },
    {
      kind: "p",
      text: "This is all pretty basic, but I think it’s worth emphasizing — the costs here really are small and the potential upside is actually very large!",
    },
    {
      kind: "p",
      text: "Finally, to enable more effective action in the future, the broader computing community might consider iterating on resources to teach the public about how different types of data interact with AI research and development (many such resources already exist, in the form of YouTube videos, explainer blogs, research artifacts, and the like — we just need more iteration in this space!). For instance, we might continue to explain the differences between pre-training data, post-training data, evals and benchmarks, interaction telemetry, data that’s used for retrieval, and so on. Of particular relevance might be trying to figure out how various data sources interact with leverage (for instance, how access to certain data commons or certain privately licensed data might impact the value of user data).[^7]",
    },
    {
      kind: "p",
      text: "However, while I’m a huge advocate for progress on all of the above, I don’t actually think this kind of “data literacy” is a blocker to taking any of the very low friction actions enabled by the current paradigm. From a user’s perspective, the most important questions are these: (1) who can use my *content* for training, retrieval or evaluation and (2) who can use my *usage data* for training, retrieval, or evaluation? Down the line when we have a clear set of data rules, users might choose to express very complex preferences and engage in complicated contracts that specify specific usage conditions. But right now, people really just need to think about:",
    },
    {
      kind: "list",
      ordered: true,
      items: [
        {
          text: [
            "What AI tools will I use and how easily can I switch?",
          ],
        },
        {
          text: [
            "Are there ways I can use these tools in a way that retains more control over my usage data (toggling “help train AI” settings, using third-party intermediating interfaces)?",
          ],
        },
        {
          text: [
            "Are there ways I can control how my external content is used by the AI industry?",
          ],
        },
      ],
    },
    {
      kind: "p",
      text: "As always, let me know if you’ve found this useful, you think any of these points are off-base, or you have any other feedback on these ideas!",
    },
  ],
  notes: [
    {
      n: 1,
      text: [
        "Some relevant coverage and takes include: this post from [Dean Ball](https://www.hyperdimensional.co/p/clawed), this post from [Jonathan Stray](https://www.betterconflictbulletin.org/p/openai-just-agreed-to-power-autonomous), and this [coverage](https://www.youtube.com/watch?v=Zj35mEtwUvY) from the NYT podcast “Hard Fork”.",
      ],
    },
    {
      n: 2,
      text: [
        "I’ll maintain a changelog at the end of the post with any major updates or clarifications.",
      ],
    },
    {
      n: 3,
      text: [
        "Building heavily on thinking from Posner and Weyl’s“[Radical Markets](https://press.princeton.edu/books/paperback/9780691196060/radical-markets)” and Brunton and Nissenbaum’s “[Obfuscation](https://mitpress.mit.edu/9780262529860/obfuscation/)”, among many other ideas from computer science, sociology, and economics.",
      ],
    },
    {
      n: 4,
      text: [
        "Data poisoning remains an ethically and legally complicated avenue for leverage. In this post I’ll focus just on relatively simple approaches to data leverage that are lawful and legible. There may be cases where certain actors may prefer data poisoning, and there are certain types of data poisoning and obfuscation that are absolutely lawful (though they may violate certain Terms of Service).",
      ],
    },
    {
      n: 5,
      text: [
        "See e.g. the works from the 2025 NeurIPS workshop on [Algorithmic Collective Action](https://acaworkshop.github.io/)",
      ],
    },
    {
      n: 6,
      text: [
        "Emerging literature on benchmark saturation and ecological validity provides some empirical grounding for understanding specific contexts where evaluators can have outsized leverage, see e.g. Akhtar et al.’s “[When AI Benchmarks Plateau: A Systematic Study of Benchmark Saturation](https://arxiv.org/abs/2602.16763.)” and Wang et al.’s “[How Well Does Agent Development Reflect Real-World Work](https://arxiv.org/abs/2603.01203)?”. The broader literature on the impact of human feedback is also relevant, e.g. the [InstructGPT](https://arxiv.org/abs/2203.02155) paper from Ouyang et al.",
      ],
    },
    {
      n: 7,
      text: [
        "To be very clear, it is certainly true that labs will try to reduce dependence on both public data and user data by instead using licensed data, partnerships, synthetic data, and private corpora. This doesn’t *kill* leverage, it just pushes leverage toward scarce data.",
      ],
    },
  ],
};
