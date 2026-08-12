export type ArticleBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "quote"; text: string }
  | { type: "ul"; items: string[] };

export type Article = {
  slug: string;
  title: string;
  category: string;
  date: string;
  readTime: string;
  dek: string;
  blocks: ArticleBlock[];
};

export const articles: Article[] = [
  {
    slug: "why-manufacturers-should-not-automate-waste",
    title: "Why Manufacturers Should Not Automate Waste",
    category: "Process improvement",
    date: "2026-07-14",
    readTime: "6 min",
    dek: "If a process is slow because it has extra steps, automating it only makes the extra steps happen faster. That is not improvement.",
    blocks: [
      {
        type: "p",
        text: "Lean taught this decades ago. The principle has not changed because the tools have.",
      },
      {
        type: "p",
        text: "Before you connect a workflow to a model, a bot, or an integration, walk the process. Ask what would happen if a step disappeared. Ask who actually uses the output. Ask where the delay really is.",
      },
      {
        type: "p",
        text: "Often the delay is not computation. It is a handoff. A missing owner. A decision that no one is authorized to make. A spreadsheet that exists because two systems do not agree.",
      },
      {
        type: "quote",
        text: "Those are process problems. They should be solved as process problems.",
      },
      {
        type: "h2",
        text: "Speed is not the same as flow",
      },
      {
        type: "p",
        text: "A buyer who sends follow-up emails faster is still doing follow-up email. A planner who refreshes six reports in two minutes instead of twenty still starts the day by assembling a picture the systems already have.",
      },
      {
        type: "p",
        text: "The better question is whether that work should exist in its current form. If the answer is no, automation will lock the waste in place and make it harder to see.",
      },
      {
        type: "ul",
        items: [
          "Remove steps that exist only because information is hard to find.",
          "Clarify who decides, and with what inputs.",
          "Define what “done” looks like before you build anything.",
          "Then connect the remaining work into a system that is faster, clearer, and easier to measure.",
        ],
      },
      {
        type: "p",
        text: "Automate the value. Do not scale the waste.",
      },
    ],
  },
  {
    slug: "ai-is-not-your-manufacturing-strategy",
    title: "AI Is Not Your Manufacturing Strategy",
    category: "Manufacturing AI",
    date: "2026-06-22",
    readTime: "5 min",
    dek: "Better operations are the strategy. Tools are how you execute it.",
    blocks: [
      {
        type: "p",
        text: "Manufacturers do not have an AI problem. They have work that takes too long, information that is hard to find, and decisions that happen later than they should.",
      },
      {
        type: "p",
        text: "Those are operational problems. They show up in shortages, overtime, expedites, quality escapes, and meetings that exist to reconstruct what already happened.",
      },
      {
        type: "quote",
        text: "AI is not the strategy. Better operations are the strategy.",
      },
      {
        type: "h2",
        text: "Start with the constraint",
      },
      {
        type: "p",
        text: "A useful system begins with a constraint you can name. Purchase orders that sit unanswered. A morning report that three people assemble by hand. A quality investigation that starts with a search through shared drives.",
      },
      {
        type: "p",
        text: "Once the constraint is visible, the tools become obvious. Sometimes the answer is a cleaner workflow. Sometimes it is an integration. Sometimes a model can draft, retrieve, or watch for exceptions. The tool is chosen after the work is understood — not before.",
      },
      {
        type: "p",
        text: "Companies that invert this order collect pilots. Companies that keep the order collect results.",
      },
    ],
  },
  {
    slug: "start-with-the-process-your-team-hates",
    title: "Start With the Process Your Team Hates",
    category: "Operations",
    date: "2026-05-19",
    readTime: "5 min",
    dek: "The work people complain about is usually the work that is slow, unclear, and expensive. It is also the best place to begin.",
    blocks: [
      {
        type: "p",
        text: "Ask a plant manager, a buyer, or a quality engineer what they would stop doing tomorrow if they could. You will get a better roadmap than most strategy decks.",
      },
      {
        type: "p",
        text: "The processes teams hate tend to share a pattern. They are repetitive. They require hunting for information. They depend on one person who “knows how.” They produce a result that still needs checking.",
      },
      {
        type: "ul",
        items: [
          "Buyers chasing overdue purchase orders.",
          "Planners combining reports every morning.",
          "Quality teams searching years of corrective actions.",
          "Engineers looking for the current specification.",
          "Managers building the weekly operating review by hand.",
        ],
      },
      {
        type: "quote",
        text: "These are not side tasks. They are the connective tissue of the operation.",
      },
      {
        type: "p",
        text: "Start there. Go to the work. Simplify it. Build a system around the remaining steps. Measure whether the hated work got shorter, clearer, or disappeared.",
      },
      {
        type: "p",
        text: "If it did, you found your first loop.",
      },
    ],
  },
  {
    slug: "the-hidden-cost-of-tribal-knowledge",
    title: "The Hidden Cost of Tribal Knowledge",
    category: "Tribal knowledge",
    date: "2026-04-28",
    readTime: "7 min",
    dek: "When one person knows where everything is, the company is slower than it looks — and more fragile than it admits.",
    blocks: [
      {
        type: "p",
        text: "Every plant has someone who can find the old spec, remember the supplier exception, or explain why a job is run a certain way. That person is valuable. The system that requires them is not.",
      },
      {
        type: "p",
        text: "Tribal knowledge is not a culture problem. It is an information-flow problem. The knowledge exists. It is just trapped in inboxes, shared drives, side conversations, and memory.",
      },
      {
        type: "h2",
        text: "What it costs",
      },
      {
        type: "ul",
        items: [
          "Time spent searching instead of deciding.",
          "Work that waits until the right person is available.",
          "Inconsistent answers to the same question.",
          "Training that takes months because the real process is undocumented.",
          "Risk when that person is out, overloaded, or leaves.",
        ],
      },
      {
        type: "quote",
        text: "The goal is not to replace experienced people. It is to stop making the operation depend on their memory.",
      },
      {
        type: "p",
        text: "A knowledge system should retrieve the specification, the quality history, the SOP, and the last time this supplier missed a date — and put that in front of the person doing the work. Human judgment stays. The scavenger hunt does not.",
      },
    ],
  },
  {
    slug: "what-ai-can-actually-do-for-procurement",
    title: "What AI Can Actually Do for Procurement",
    category: "Procurement",
    date: "2026-03-11",
    readTime: "6 min",
    dek: "Buyers do not need a new philosophy. They need fewer hours spent on follow-up, comparison, and search.",
    blocks: [
      {
        type: "p",
        text: "Procurement teams already know what good looks like: the right part, at the right time, at a defensible cost, from a supplier who will actually deliver. The gap is the administrative work required to get there.",
      },
      {
        type: "p",
        text: "That work is follow-up. RFQ preparation. Quote comparison. Digging through pricing history. Checking whether a supplier’s lead time has slipped. Writing the same email with a different PO number.",
      },
      {
        type: "h2",
        text: "Where a system helps",
      },
      {
        type: "ul",
        items: [
          "Drafting and tracking supplier follow-up so overdue orders surface before they become shortages.",
          "Preparing RFQ packages from existing specs, history, and approved suppliers.",
          "Comparing quotes on the dimensions that matter — price, lead time, terms, risk — not just the number in the bottom right.",
          "Putting supplier performance and pricing history next to the decision, not in a separate report.",
        ],
      },
      {
        type: "quote",
        text: "The buyer should still decide. The system should make the decision possible sooner.",
      },
      {
        type: "p",
        text: "That is not a replacement for sourcing judgment. It is a way to return hours to the people who have it.",
      },
    ],
  },
  {
    slug: "erp-system-of-record-system-of-action",
    title: "ERP Is the System of Record. AI Can Become the System of Action.",
    category: "AI + ERP",
    date: "2026-02-17",
    readTime: "7 min",
    dek: "Your ERP already holds the transaction. The work is getting from that record to a decision, and from that decision to an action.",
    blocks: [
      {
        type: "p",
        text: "ERP systems are good at storing what happened: the order, the receipt, the inventory move, the invoice. They are less good at noticing what needs to happen next, explaining it in context, and helping someone act.",
      },
      {
        type: "p",
        text: "That gap is why so much operational work still lives in spreadsheets and email. The record is in the ERP. The action is everywhere else.",
      },
      {
        type: "quote",
        text: "A system of action watches for exceptions, assembles the relevant context, and puts a next step in front of the right person.",
      },
      {
        type: "h2",
        text: "Keep the system of record. Close the loop.",
      },
      {
        type: "p",
        text: "This is not an argument for replacing ERP. It is an argument for connecting it. Purchase orders, inventory, production, and quality data become useful when they are joined to documents, supplier correspondence, and the people who decide.",
      },
      {
        type: "p",
        text: "The loop is simple: information, decision, action, feedback, improvement. ERP covers part of the first step. Most manufacturers still do the rest by hand.",
      },
    ],
  },
  {
    slug: "kaizen-in-the-age-of-ai",
    title: "Kaizen in the Age of AI",
    category: "Lean and Kaizen",
    date: "2026-01-20",
    readTime: "6 min",
    dek: "Continuous improvement does not become obsolete when the tools get stronger. It becomes more important.",
    blocks: [
      {
        type: "p",
        text: "Kaizen is not a workshop format. It is a habit: see the work, remove friction, standardize what works, look again.",
      },
      {
        type: "p",
        text: "New tools do not replace that habit. They raise the cost of skipping it. A poorly designed process connected to a capable system will produce waste at a higher rate, with more confidence, and with less visibility.",
      },
      {
        type: "h2",
        text: "The loop is the same",
      },
      {
        type: "ul",
        items: [
          "See: go to the gemba. Watch how the work actually happens.",
          "Simplify: remove steps, clarify ownership, define the outcome.",
          "Build: connect data, documents, software, and people into a working system.",
          "Learn: measure the result, find the next constraint, repeat.",
        ],
      },
      {
        type: "quote",
        text: "Improvement never stops. The tools change. The discipline does not.",
      },
      {
        type: "p",
        text: "Used this way, models and automation become part of the standard work — not a side project, and not a substitute for understanding the floor.",
      },
    ],
  },
];

export function getArticle(slug: string) {
  return articles.find((article) => article.slug === slug);
}

export const insightTopics = [
  "Manufacturing AI",
  "Supply chain",
  "Procurement",
  "Lean and Kaizen",
  "Operations",
  "Human-in-the-loop AI",
  "AI + ERP",
  "Tribal knowledge",
  "Manufacturing automation",
  "Process improvement",
];
