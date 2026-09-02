export const nav = [
  { href: "/", label: "Home" },
  { href: "/solutions", label: "Solutions" },
  { href: "/services", label: "Services" },
  { href: "/loopscan", label: "LoopScan" },
  { href: "/demo", label: "Demo" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/about", label: "About" },
  { href: "/insights", label: "Insights" },
] as const;

/** The one site-wide call to action. Opens the LoopScan contact form. */
export const cta = {
  startLoopScan: { href: "/loopscan#intake", label: "Start with LoopScan" },
  seeDemos: { href: "/demo", label: "See the Demos" },
} as const;

export const painPoints = [
  "Buyers chasing overdue POs by hand.",
  "Managers rebuilding the same reports every morning.",
  "Critical knowledge living with the one person who knows where everything is.",
  "Teams moving information between systems by hand.",
] as const;

export const homepageFinding = {
  text: "Supplier mail for the same past-due rows until a date is pasted into Excel — then the next morning's export does not have that date, so the row looks late again.",
  source:
    "From a sample LoopScan read-back, built on the fictional Northfield dataset behind the demos.",
} as const;

/** LoopScan as it appears on the home page, the services overview, and the solutions cards. */
export const loopScanBlock = {
  name: "LoopScan",
  text: "We evaluate how your plant actually runs and come back with what we see and what we'd recommend next.",
} as const;

export const loopScanPage = {
  headline: "Understand the process.",
  sections: [
    {
      title: "What it is",
      text: "An evaluation of your operation. It starts with a conversation, includes a walk-through when it makes sense, and ends with a written read-back of what we found.",
    },
    {
      title: "What you get",
      text: "A plain-language summary of where the friction is, what it's likely costing, and our recommendation on next steps — whether that's something you handle yourselves, a tool like LoopSolve, or a scoped engagement with us.",
    },
    {
      title: "How it starts",
      text: "Share your contact details and we'll set up a call.",
    },
  ],
  dataNote:
    "A LoopScan needs no access to your systems. If sizing a problem ever calls for data, we ask first and take the smallest set that answers the question.",
} as const;

export const loopScanForm = {
  eyebrow: "Start with LoopScan",
  heading: "Share your contact details and we'll set up a call.",
  fields: {
    name: "Name",
    company: "Company",
    role: "Role",
    contact: "Email or phone",
    slowing: "What's slowing you down?",
  },
  slowingPlaceholder:
    "e.g. buyers chasing overdue POs by hand, or the same report rebuilt every morning",
  submit: "Start with LoopScan",
  successHeadline: "Thanks — we'll be in touch to set up a conversation.",
} as const;

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
      "Understand the work, remove unnecessary complexity, reduce waste, improve flow, clarify ownership.",
  },
  {
    name: "Systems Integration",
    summary:
      "Connect the systems and information your team already relies on so work moves across the organization.",
  },
  {
    name: "Automation + Practical AI",
    summary:
      "Automate repetitive and information-heavy work where technology earns its place.",
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

/** Real tools (not demos): free, browser-based, nothing leaves the device. */
export const tools = [
  {
    href: "/solve",
    name: "LoopSolve",
    headline: "Solve the problem. Prove the cause. Verify the fix.",
    description:
      "Use Five Whys, Fishbone, evidence, corrective actions, and effectiveness verification in one structured workspace. Free, runs in your browser, nothing leaves your device.",
    cta: "Try LoopSolve",
    badge: "Free tool",
  },
  {
    href: "/flow",
    name: "LoopFlow",
    headline: "See the process. Find the friction. Fix it once.",
    description:
      "Map the process as it actually runs, with times and handoffs on every step. See where the waiting is. Open a LoopSolve investigation from any pain point. Free, runs in your browser, nothing leaves your device.",
    cta: "Try LoopFlow",
    badge: "Free tool",
  },
] as const;

export const demoNote =
  "Examples of capability, not a fixed menu every manufacturer is expected to adopt.";

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

export const servicesIntro = {
  eyebrow: "Services",
  headline: "Start with the work. Build what’s needed. Sustain what works.",
  body: "Every engagement starts with LoopScan. What follows depends on what it finds.",
} as const;

export const services = [
  {
    slug: "loopscan",
    step: "01",
    name: "LoopScan",
    headline: "Understand the process.",
    text: loopScanBlock.text,
  },
  {
    slug: "loopbuild",
    step: "02",
    name: "LoopBuild",
    headline: "Improve the process. Build what’s needed.",
    text: "LoopBuild is the implementation work that follows a LoopScan: the process change, systems integration, automation, or custom software that removes the friction we found. It applies when the read-back points to something worth changing or connecting, and you want it done by people who understand the work it serves. Scope is defined together after LoopScan.",
  },
  {
    slug: "loopops",
    step: "03",
    name: "LoopOps",
    headline: "Keep it working.",
    text: "LoopOps is the sustainment method installed with the work: the daily management, standard work, and ownership that keep an improvement running after we’re done, run by your team rather than by us. It applies when a change has to hold across shifts, departments, and turnover, not just survive the week it was launched. Scope is defined together after LoopScan.",
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
    text: "Start with the work.",
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
    text: "Every implementation improves a business outcome.",
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
    "I started on the bench, then as a technician, then manufacturing engineering, then planning and purchasing. I still do that work. This isn't a practice I left the floor to build.",
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
