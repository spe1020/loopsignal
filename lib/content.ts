export const nav = [
  { href: "/", label: "Home" },
  { href: "/solutions", label: "Solutions" },
  { href: "/signal", label: "Demo" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/about", label: "About" },
  { href: "/insights", label: "Insights" },
] as const;

export const informationSources = [
  "ERP",
  "Email",
  "Spreadsheets",
  "Specifications",
  "Quality Records",
  "Supplier Information",
  "Production Data",
  "Shared Drives",
  "Tribal Knowledge",
  "Inventory Data",
];

export const solutions = [
  {
    slug: "supply-chain-intelligence",
    interest: "supply_chain",
    outcome: "See supply problems earlier",
    title: "Supply Chain Intelligence",
    summary:
      "Help teams identify inventory risk, shortages, supplier issues, and exceptions before they become emergencies.",
    examples: [
      "Inventory risk",
      "PO exceptions",
      "Supplier lead-time monitoring",
      "Shortage alerts",
      "Supply reporting",
      "Open order status",
    ],
  },
  {
    slug: "procurement-automation",
    interest: "procurement",
    outcome: "Give buyers their time back",
    title: "Procurement Automation",
    summary:
      "Reduce repetitive supplier follow-up, RFQ work, quote comparison, and administrative purchasing tasks.",
    examples: [
      "Supplier follow-up",
      "RFQ preparation",
      "Quote comparison",
      "Supplier intelligence",
      "Pricing history",
      "Supplier performance",
    ],
  },
  {
    slug: "manufacturing-intelligence",
    interest: "manufacturing",
    outcome: "Turn plant data into action",
    title: "Manufacturing Intelligence",
    summary:
      "Transform production, downtime, scrap, quality, and operational information into useful decisions.",
    examples: [
      "Production summaries",
      "Downtime analysis",
      "Scrap analysis",
      "Meeting preparation",
      "Exception monitoring",
      "Shift handoffs",
    ],
  },
  {
    slug: "knowledge-systems",
    interest: "knowledge",
    outcome: "Make tribal knowledge searchable",
    title: "Knowledge Systems",
    summary:
      "Make SOPs, specifications, engineering documents, quality history, supplier knowledge, and maintenance information easier to access and use.",
    examples: [
      "SOP search",
      "Specification retrieval",
      "Engineering documents",
      "Quality history",
      "Supplier knowledge",
      "Maintenance information",
      "Training support",
      "Work instructions",
    ],
  },
] as const;

export const services = [
  {
    slug: "loopscan",
    name: "LoopScan",
    summary:
      "A focused review of your operation designed to identify where process improvement, AI, and automation can create the most value.",
    deliverables: [
      "Current-state workflow",
      "Key friction points",
      "Prioritized opportunities",
      "Business impact",
      "Technical feasibility",
      "Risk considerations",
      "Recommended first implementation",
      "Next-step roadmap",
    ],
    cta: "Start a LoopScan",
  },
  {
    slug: "loopbuild",
    name: "LoopBuild",
    summary:
      "Turn one high-value opportunity into a practical working system.",
    deliverables: [
      "Supplier follow-up automation",
      "RFQ workflow",
      "Production reporting",
      "Supply risk monitoring",
      "Quality investigations",
      "Knowledge search",
    ],
    cta: "Build Your First Loop",
  },
  {
    slug: "loopops",
    name: "LoopOps",
    summary:
      "Ongoing support and continuous improvement after the first system is live.",
    deliverables: [
      "System monitoring",
      "Workflow improvement",
      "Integrations",
      "Training",
      "Governance",
      "New use cases",
      "Monthly improvement reviews",
    ],
    cta: "Keep Improving",
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
    summary: "Improve the process before automating it.",
    points: [
      "Remove extra steps",
      "Clarify decisions",
      "Assign ownership",
      "Define outcomes",
      "Reduce handoffs",
      "Make work visible",
    ],
  },
  {
    step: "03",
    name: "Build",
    summary:
      "Connect the right combination of people, information, software, automation, and AI.",
    points: [
      "AI where it helps",
      "Automation",
      "ERP data",
      "Documents",
      "APIs and databases",
      "Existing software",
      "Human decision-makers",
      "Process rules",
    ],
  },
  {
    step: "04",
    name: "Learn",
    summary: "Measure the result and improve again.",
    points: [
      "Measure results",
      "Find the next constraint",
      "Adjust the workflow",
      "Train the team",
      "Expand what works",
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

export const loopWorksOutcomes = [
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
    text: "Every implementation should improve a real business outcome.",
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
      "Where AI could help",
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
    step: "1",
    name: "LoopScan",
    text: "Find the opportunity.",
  },
  {
    step: "2",
    name: "LoopBuild",
    text: "Build and prove one high-value system.",
  },
  {
    step: "3",
    name: "LoopOps",
    text: "Operate, improve, and expand what works.",
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
