export const nav = [
  { href: "/", label: "Home" },
  { href: "/solutions", label: "Solutions" },
  { href: "/demo", label: "Demo" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/about", label: "About" },
  { href: "/insights", label: "Insights" },
] as const;

export const cta = {
  primary: { href: "/loopscan", label: "Start a LoopScan" },
  secondary: { href: "/demo", label: "See the demos" },
} as const;

export const loopScanOffer = {
  price: "$7,500",
  duration: "Two days on site",
  findingsIn: "Findings in 10 business days",
  priceLine: "$7,500 · two days on site · findings in 10 business days",
  budgetLine:
    "Consulting and systems integration. Opex. Your operations lead signs it. Not software, not a subscription, not an IT capital request.",
  teamHoursTotal: "~11.5 hours",
  guarantee: "7-day money-back guarantee. No conditions.",
  // TODO: name the origin city for the 2.5-hour radius.
  radius:
    "Within 2.5 hours' drive. Beyond that, quoted separately.",
  firstClient:
    "We have not completed a paid LoopScan. There is no prior engagement to point to. That is why the guarantee has no conditions.",
  // TODO: retention window in days, if different from "delete when the engagement ends."
  dataHandling:
    "We pull read-only. The work runs in your environment. Nothing trains a model. When the engagement ends, we hand you the raw pull and the queries, then delete our copy.",
  // TODO: confirm these seven items against Dr. Sats' pricing work.
  deliverables: [
    "Current-state workflow map",
    "Friction points",
    "Information gaps",
    "System connections",
    "Repetitive work",
    "What to automate, and what not to",
    "Prioritized next step with business impact",
  ],
  credibleNextStep:
    "That may be a simple process change, a LoopScan, an automation opportunity, or no technology at all.",
} as const;

// TODO: hours by role from Dr. Sats' pricing work. Total stays ~11.5.
export const loopScanTeamHoursByRole: { role: string; hours: number }[] = [];

export const informationSources = [
  "ERP systems",
  "Email",
  "Spreadsheets",
  "Quality records",
  "Supplier updates",
  "Production reports",
  "Specifications",
  "Shared drives",
  "Institutional knowledge",
];

export const capabilities = [
  {
    name: "Process Improvement",
    summary:
      "Understand the work, remove unnecessary complexity, reduce waste, clarify ownership, and improve flow.",
  },
  {
    name: "Systems Integration",
    summary:
      "Connect the systems and information your teams already rely on, including ERP, email, spreadsheets, quality systems, supplier data, documents, and operational reporting.",
  },
  {
    name: "Automation + AI",
    summary:
      "Automate repetitive work, surface exceptions, make information easier to use, and support better decisions where technology creates real operational value.",
  },
] as const;

export const solutions = [
  {
    slug: "supply-chain-intelligence",
    interest: "supply_chain",
    outcome: "See supply problems earlier",
    title: "Supply Chain Intelligence",
    summary:
      "Identify shortages, supplier issues, inventory constraints, and exceptions before they become larger operational problems.",
    examples: [
      "Open PO exceptions",
      "Material risk",
      "Inventory coverage",
      "Supplier follow-up",
      "Replenishment priorities",
      "Lead-time issues",
      "Supplier communication",
      "Supply constraints",
    ],
    demoHref: "/supply",
    demoName: "LoopSupply",
  },
  {
    slug: "procurement-automation",
    interest: "procurement",
    outcome: "Give buyers their time back",
    title: "Procurement Automation",
    summary:
      "Reduce repetitive purchasing work and improve sourcing decisions using better information and structured workflows.",
    examples: [
      "RFQ comparison",
      "Landed cost",
      "Tooling",
      "MOQ",
      "Lead time",
      "Capacity",
      "Qualification",
      "Dual-source scenarios",
    ],
    demoHref: "/source",
    demoName: "LoopSource",
  },
  {
    slug: "manufacturing-intelligence",
    interest: "manufacturing",
    outcome: "Turn plant data into action",
    title: "Manufacturing Intelligence",
    summary: "Turn plant information into clear priorities, ownership, and action.",
    examples: [
      "Production",
      "Quality",
      "Supply",
      "Maintenance",
      "Planning",
      "Executive summaries",
      "Department briefs",
      "Actions and accountability",
    ],
    demoHref: "/brief",
    demoName: "LoopBrief",
  },
  {
    slug: "knowledge-systems",
    interest: "knowledge",
    outcome: "Make tribal knowledge searchable",
    title: "Knowledge Systems",
    summary:
      "Make SOPs, specifications, quality history, engineering information, and institutional knowledge easier to access and trust.",
    examples: [
      "SOPs",
      "Specifications",
      "Engineering documents",
      "Quality history",
      "Revision control",
      "Maintenance knowledge",
      "Institutional knowledge",
    ],
    demoHref: "/know",
    demoName: "LoopKnow",
  },
] as const;

export const demos = [
  {
    href: "/supply",
    name: "LoopSupply",
    headline: "Find the supply exception.",
    category: "Supply exceptions",
    promise:
      "Turn purchasing, supplier, inventory, and open-order information into clear priorities and action.",
    flow: ["Open PO data", "supply risk", "priority", "action"],
    description:
      "Turn purchasing, supplier, inventory, and open-order information into clear priorities and action.",
    cta: "Try LoopSupply",
  },
  {
    href: "/know",
    name: "LoopKnow",
    headline: "Find the trusted answer.",
    category: "Manufacturing knowledge",
    promise: "Turn scattered manufacturing knowledge into trusted, usable answers.",
    flow: ["Documents", "trusted knowledge", "source", "next step"],
    description:
      "Turn scattered manufacturing knowledge into trusted, usable answers.",
    cta: "Try LoopKnow",
  },
  {
    href: "/source",
    name: "LoopSource",
    headline: "Structure the sourcing decision.",
    category: "Sourcing decisions",
    promise:
      "Structure sourcing decisions by connecting supplier quotes, commercial terms, requirements, and tradeoffs.",
    flow: [
      "Supplier quotes",
      "normalized comparison",
      "tradeoffs",
      "recommendation",
    ],
    description:
      "Structure sourcing decisions by connecting supplier quotes, commercial terms, requirements, and tradeoffs.",
    cta: "Try LoopSource",
  },
  {
    href: "/brief",
    name: "LoopBrief",
    headline: "Coordinate the operation.",
    category: "Daily operations",
    promise:
      "Turn daily operational information into priorities, ownership, reporting, and action.",
    flow: ["Operational signals", "priorities", "owners", "action"],
    description:
      "Turn daily operational information into priorities, ownership, reporting, and action.",
    cta: "Try LoopBrief",
  },
] as const;

export const demoNote =
  "They are not fixed systems we expect every manufacturer to adopt. They are examples of what we build around an operation.";

export const demoPhilosophy = [
  {
    name: "LoopSupply",
    line: "Find the supply exception.",
  },
  {
    name: "LoopKnow",
    line: "Find the trusted answer.",
  },
  {
    name: "LoopSource",
    line: "Structure the sourcing decision.",
  },
  {
    name: "LoopBrief",
    line: "Coordinate the operation.",
  },
] as const;

export const services = [
  {
    slug: "loopscan",
    name: "LoopScan",
    headline: "$7,500. Two days on site. Findings in 10 business days.",
    summary: "Find the friction in the work.",
    detail:
      "LoopScan is a two-day on-site operational review. We map how the work happens today, name the friction, and hand you a seven-item findings pack within 10 business days.",
    deliverables: [
      "Current-state workflow map",
      "Friction points",
      "Information gaps",
      "System connections",
      "Repetitive work",
      "What to automate, and what not to",
      "Prioritized next step with business impact",
    ],
    cta: "Start a LoopScan",
  },
  {
    slug: "loopbuild",
    name: "LoopBuild",
    headline: "Improve the process. Build the right system around it.",
    summary: "Improve and implement it.",
    detail:
      "LoopBuild turns a prioritized opportunity into a working solution: process redesign, systems integration, workflow automation, AI, custom software, or a combination.",
    deliverables: [
      "Purchasing exception workflow",
      "Supplier follow-up process",
      "Reporting automation",
      "Knowledge system",
      "Sourcing workflow",
      "Operations management process",
      "System-to-system integration",
    ],
    cta: "Start a LoopScan",
  },
] as const;

export const howItWorks = [
  {
    step: "01",
    name: "See",
    summary: "Understand how the work actually happens.",
    points: [
      "Delays",
      "Repetitive work",
      "Disconnected information",
      "Bottlenecks",
      "Manual workarounds",
      "Tribal knowledge",
    ],
  },
  {
    step: "02",
    name: "Simplify",
    summary: "Remove unnecessary steps, clarify ownership, and improve the process.",
    points: [
      "Remove extra steps",
      "Clarify ownership",
      "Define outcomes",
      "Reduce handoffs",
      "Make work visible",
      "Improve flow",
    ],
  },
  {
    step: "03",
    name: "Connect",
    summary:
      "Connect the systems, people, and information required to make the workflow work.",
    points: [
      "ERP data",
      "Email and spreadsheets",
      "Documents",
      "Existing software",
      "People closest to the work",
      "Process rules",
    ],
  },
  {
    step: "04",
    name: "Automate",
    summary:
      "Automate repetitive or information-heavy work where it makes sense.",
    points: [
      "Repetitive tasks",
      "Information gathering",
      "Exception routing",
      "Workflow automation",
      "AI where it belongs",
      "Human approval where it matters",
    ],
  },
  {
    step: "05",
    name: "Measure",
    summary: "Establish whether the change actually improved the operation.",
    points: [
      "Time",
      "Cost",
      "Risk",
      "Quality",
      "Response time",
      "Baseline versus result",
    ],
  },
  {
    step: "06",
    name: "Improve",
    summary: "Use the result to strengthen the next loop.",
    points: [
      "Find the next constraint",
      "Adjust the workflow",
      "Train the team",
      "Expand what works",
      "Strengthen the process",
      "Repeat",
    ],
  },
] as const;

export const useCases = [
  "Buyers manually chasing overdue purchase orders",
  "Planners combining reports every morning",
  "Quality teams searching through years of corrective actions",
  "Engineers trying to find old specifications",
  "Supply chain teams discovering shortages too late",
  "Managers manually preparing operating reviews",
  "Employees relying on one experienced person who knows where everything is",
];

export const featuredArticleSlugs = [
  "ai-is-not-your-manufacturing-strategy",
  "why-manufacturers-should-not-automate-waste",
  "what-ai-can-actually-do-for-procurement",
] as const;

export const existingSystems = [
  "ERP",
  "Email",
  "Excel",
  "Quality Systems",
  "Shared Drives",
  "Supplier Data",
  "Production Data",
  "Maintenance Records",
];

export const loopSignalOutcomes = [
  "Better decisions",
  "Less manual work",
  "Faster response",
];

export const trustPrinciples = [
  {
    title: "Practical first",
    text: "Start with a real operational problem.",
  },
  {
    title: "Human in the loop",
    text: "Keep judgment and decision authority where it matters.",
  },
  {
    title: "Work with what you have",
    text: "Use existing systems whenever possible.",
  },
  {
    title: "Measure the result",
    text: "Every implementation improves a real business outcome.",
  },
] as const;

export const loopScanSteps = [
  {
    step: "01",
    name: "Observe",
    summary: "Understand how the work actually happens.",
    points: [
      "Workflows",
      "Systems",
      "Reports",
      "Spreadsheets",
      "Handoffs",
      "Manual tasks",
      "Recurring problems",
    ],
  },
  {
    step: "02",
    name: "Identify",
    summary: "Find the friction that slows the operation.",
    points: [
      "Repetitive work",
      "Information gaps",
      "Bottlenecks",
      "Delays",
      "Manual reporting",
      "Decision friction",
      "Tribal knowledge",
      "Recurring exceptions",
    ],
  },
  {
    step: "03",
    name: "Prioritize",
    summary: "Score opportunities before recommending technology.",
    points: [
      "Business impact",
      "Feasibility",
      "Risk",
      "Data availability",
      "Implementation effort",
    ],
  },
  {
    step: "04",
    name: "Recommend",
    summary: "Create a practical roadmap for where to begin.",
    points: [
      "What to improve",
      "What to automate",
      "Where AI belongs",
      "What not to automate",
      "Where to begin",
    ],
  },
] as const;

export const loopScanFindings = [
  {
    area: "Procurement",
    text: "Buyers spending hours each week following up on overdue purchase orders.",
  },
  {
    area: "Supply Chain",
    text: "Material shortages being discovered after production is already at risk.",
  },
  {
    area: "Operations",
    text: "Managers manually assembling daily or weekly production reports.",
  },
  {
    area: "Quality",
    text: "Teams searching old corrective actions every time a recurring problem appears.",
  },
  {
    area: "Engineering",
    text: "Employees spending significant time locating specifications and historical documents.",
  },
  {
    area: "Knowledge",
    text: "Critical processes depending on one experienced person knowing where information lives.",
  },
] as const;

export const commercialJourney = [
  {
    step: "01",
    name: "LoopScan",
    headline: "$7,500. Two days on site.",
    text: "Map how the work happens today, name the friction, and hand you findings within 10 business days.",
  },
  {
    step: "02",
    name: "LoopBuild",
    headline: "Improve and implement it.",
    text: "Turn a prioritized opportunity into a working solution — process redesign, systems integration, automation, AI, software, or a combination.",
  },
] as const;

export const operatingLoop = [
  {
    name: "See",
    summary: "Understand how the work actually happens.",
  },
  {
    name: "Simplify",
    summary: "Remove unnecessary steps, clarify ownership, and improve the process.",
  },
  {
    name: "Connect",
    summary: "Connect the systems, people, and information the workflow requires.",
  },
  {
    name: "Automate",
    summary: "Automate repetitive or information-heavy work where it makes sense.",
  },
  {
    name: "Measure",
    summary: "Establish whether the change actually improved the operation.",
  },
  {
    name: "Improve",
    summary: "Use the result to strengthen the next loop.",
  },
] as const;

export const implementationSequence = [
  {
    name: "Discover the workflow",
    summary: "Understand how the work happens today.",
  },
  {
    name: "Establish the baseline",
    summary: "Define the current time, cost, risk, or performance.",
  },
  {
    name: "Improve the process",
    summary: "Remove unnecessary complexity before connecting systems or automating work.",
  },
  {
    name: "Build what is needed",
    summary: "Connect the right information and implement the solution around the work.",
  },
  {
    name: "Define ownership",
    summary: "Clarify what people, workflows, software, or agents own.",
  },
  {
    name: "Measure the result",
    summary: "Determine whether the operation actually improved.",
  },
] as const;

export const founder = {
  name: "Seth Sager",
  role: "Founder",
  linkedin: "https://www.linkedin.com/in/seth-sager-a381781a",
  background:
    "Seth has worked from the shop floor through manufacturing engineering, production planning, purchasing, and supply chain — with a focus on lean methods, supplier development, and practical process improvement.",
};

export const loopScanAreas = [
  "Procurement",
  "Supply Chain",
  "Operations",
  "Quality",
  "Engineering",
  "Planning",
  "Knowledge / Documentation",
  "Other",
] as const;

export const loopScanIntakeExamples = [
  {
    area: "Procurement",
    text: "Buyers manually chasing overdue purchase orders.",
  },
  {
    area: "Supply Chain",
    text: "Shortages being discovered after production is already at risk.",
  },
  {
    area: "Operations",
    text: "Managers manually assembling production reports.",
  },
  {
    area: "Quality",
    text: "Teams searching through previous corrective actions every time a problem returns.",
  },
  {
    area: "Engineering",
    text: "Employees spending too much time locating specifications and historical documents.",
  },
  {
    area: "Knowledge",
    text: "Critical work depending on one experienced employee who knows where everything is.",
  },
] as const;
