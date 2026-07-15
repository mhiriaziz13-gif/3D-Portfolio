export type VerifiedCaseStudy = {
  context: string;
  problem: string;
  contribution: string;
  approach: string[];
  workflow: string;
  tools: string[];
  deliverables: string[];
  safeguards: string[];
  outcome: string;
  lessons: string;
  expertise: string[];
  experience: string;
  faq: { question: string; answer: string }[];
  relatedTitle: string;
};

export const verifiedCaseStudies: Record<string, VerifiedCaseStudy> = {
  "RPA for Invoice Control & Booking Reconciliation": {
    context: "Tourism operations require invoice, voucher, reservation and stay information to be checked against commercial rules before exceptions can be reviewed.",
    problem: "The control process needed to connect multiple records and apply rules covering room rates, board types, discounts, supplements and special offers without hiding exceptions from human review.",
    contribution: "Ahmed designed and expanded the UiPath workflow and translated verified operating rules into structured automation and review outputs.",
    approach: ["Connect invoice, voucher, reservation and stay data in a consistent workflow.", "Apply business rules by category rather than embedding an unreviewable result.", "Separate matched records from exceptions requiring follow-up."],
    workflow: "UiPath orchestrates the checks, produces structured JSON and generates an HTML report that supports exception review and audit follow-up.",
    tools: ["UiPath", "JSON", "HTML reporting", "Business-rules automation"],
    deliverables: ["Reconciliation workflow", "Structured JSON output", "HTML review report", "Exception-review path"],
    safeguards: ["Human review remains part of the control process.", "Public material excludes contracts, customer details, booking references, commercial amounts and confidential rules."],
    outcome: "The deliverable created a more structured and auditable control process. No time, cost or accuracy percentage is claimed without verified evidence.",
    lessons: "Automation is most useful when business rules, exceptions and review responsibility remain explicit rather than being hidden inside a single pass/fail result.",
    expertise: ["Automation & Operations", "Data & Business Intelligence"],
    experience: "Related to Ahmed's tourism-operations and business-systems work at Sunshine Vacances France.",
    faq: [{ question: "Does the workflow replace human invoice review?", answer: "No. It structures checks and exceptions so reviewers can focus on records that require attention." }, { question: "Does this case study publish hotel or traveller data?", answer: "No. Confidential operational and personal data is intentionally excluded." }],
    relatedTitle: "Hotel KPI & Cost Control Analysis",
  },
  "Digital Transformation for a Men's Barbershop": {
    context: "A local service business needed its website, online booking and customer communication to work as one customer journey rather than separate activities.",
    problem: "Discovery, booking, local visibility and ongoing communication needed a clearer digital structure without assuming that traffic or revenue growth could be attributed without measurement evidence.",
    contribution: "Ahmed led the digital-transformation work across the website, online booking, local SEO and customer communication, with support for social media, email marketing, paid social and Planity collaboration.",
    approach: ["Connect local discovery to a clear booking path.", "Align website information and customer communication.", "Support visibility through local SEO and relevant social content."],
    workflow: "The customer journey moves from local or social discovery to service information, online booking and follow-up communication through the available channels.",
    tools: ["Website", "Online booking", "Local SEO", "Social media", "Email marketing", "Paid social", "Planity"],
    deliverables: ["Public website", "Online-booking journey", "Local SEO work", "Social and email communication support"],
    safeguards: ["No customer information is published.", "No booking, traffic or revenue uplift is claimed without verified analytics."],
    outcome: "The project established a more coherent digital customer journey and communication structure. The portfolio does not assign unsupported growth metrics to the work.",
    lessons: "For a local service business, visibility and conversion paths need consistent information and a usable booking experience before campaign activity can be interpreted responsibly.",
    expertise: ["Marketing & Customer Growth", "Automation & Operations"],
    experience: "Related to Ahmed's verified consulting work for ChicChac in Noisy-le-Grand, France.",
    faq: [{ question: "Which parts of the customer journey were covered?", answer: "The verified scope covers the website, online booking, local SEO, social media, email marketing, paid social, Planity and customer communication." }, { question: "Did the project guarantee more bookings?", answer: "No. The case study does not make an unverified booking or revenue claim." }],
    relatedTitle: "RPA for Invoice Control & Booking Reconciliation",
  },
  "AI-Ready E-Learning Platform": {
    context: "A secure multilingual e-learning platform needed conventional learning workflows alongside a private, locally deployed knowledge-retrieval contribution.",
    problem: "The platform had to support enrolment, progress tracking, dashboards, event booking and notifications while integrating local LLaMA 3.2 access and RAG over approved PDF and CSV content.",
    contribution: "Ahmed contributed as an AI and full-stack development intern within a wider team. He did not solely own the platform or every architectural decision.",
    approach: ["Contribute to Angular interfaces and Spring Boot services.", "Support REST-based multilingual learning workflows.", "Integrate local model access through Ollama and retrieval over approved documents."],
    workflow: "Angular clients communicate with Spring Boot microservices through REST APIs. The local assistant uses LLaMA 3.2 through Ollama, with RAG retrieving relevant PDF and CSV material before response generation.",
    tools: ["Angular", "Spring Boot", "REST APIs", "Microservices", "LLaMA 3.2", "Ollama", "RAG", "PDF and CSV retrieval"],
    deliverables: ["Learning and dashboard contributions", "Enrolment and progress workflows", "Event booking and notifications", "Local assistant and retrieval contribution"],
    safeguards: ["The model was locally deployed for the verified contribution.", "Monitoring and security safeguards formed part of the work.", "The case study distinguishes contribution from sole ownership."],
    outcome: "Ahmed contributed working platform and AI-retrieval capabilities within the project scope. No user count, performance percentage or business result is claimed.",
    lessons: "Adding RAG to a learning platform requires clear content boundaries, retrieval controls and monitoring; the model interface is only one part of the system.",
    expertise: ["Technical Stack", "Data & Business Intelligence"],
    experience: "Related to Ahmed's AI and full-stack development internship at VERMEG.",
    faq: [{ question: "Was the assistant hosted through a public model API?", answer: "The verified implementation used a locally deployed LLaMA 3.2 model through Ollama." }, { question: "Did Ahmed build the complete platform alone?", answer: "No. He contributed as an intern within a wider project team." }],
    relatedTitle: "Library Management Application",
  },
  "Library Management Application": {
    context: "A library-management application needed a full-stack structure for catalogue and borrowing operations.",
    problem: "Management workflows, search and borrowing tracking needed to share a consistent application and relational data model.",
    contribution: "Ahmed built the full-stack application during his verified ArabSoft internship using Angular, Spring Boot, REST APIs and a relational database.",
    approach: ["Model core library records in a relational database.", "Expose management and search operations through REST APIs.", "Build Angular interfaces for management and borrowing workflows."],
    workflow: "The Angular client calls Spring Boot REST endpoints, which apply application logic and persist catalogue and borrowing records in the relational database.",
    tools: ["Angular", "Spring Boot", "REST APIs", "Relational database"],
    deliverables: ["Full-stack management application", "Search functions", "Borrowing-tracking workflow", "REST-based application structure"],
    safeguards: ["The public case study describes functions and architecture without exposing organizational or user records.", "No unsupported scale or performance claim is made."],
    outcome: "The project delivered the verified management, search and borrowing-tracking functions as a complete application exercise.",
    lessons: "Clear REST boundaries and a consistent relational model help keep search, management and borrowing state aligned across the interface and backend.",
    expertise: ["Technical Stack", "Automation & Operations"],
    experience: "Related to Ahmed's full-stack development internship at ArabSoft.",
    faq: [{ question: "Which application functions are verified?", answer: "Management workflows, search and borrowing tracking are verified in the repository content." }, { question: "Which database product was used?", answer: "The verified evidence supports a relational database; a more specific product is not claimed here." }],
    relatedTitle: "AI-Ready E-Learning Platform",
  },
  "Hotel KPI & Cost Control Analysis": {
    context: "Hotel management-control work depends on connecting occupancy, operational costs and revenue-related KPIs with budgets and financial reporting.",
    problem: "Operating indicators and budget variance needed to be analysed in a form that could support cost-control review and management decisions without exposing confidential financial values.",
    contribution: "Ahmed analysed occupancy, costs and revenue-related KPIs and contributed to budget preparation, variance analysis and financial reporting.",
    approach: ["Structure relevant occupancy, cost and revenue-related indicators.", "Compare reported performance with budget expectations.", "Present variance and cost-control observations for management review."],
    workflow: "Operational and financial reporting inputs are organized into KPI and variance views, reviewed for notable changes and translated into decision-support observations.",
    tools: ["Excel", "KPI analysis", "Financial reporting", "Budget variance analysis", "Business Intelligence"],
    deliverables: ["KPI analysis", "Budget-preparation support", "Variance analysis", "Financial reporting", "Cost-control observations"],
    safeguards: ["No hotel financial value or confidential report is published.", "The case study avoids implying employer endorsement."],
    outcome: "The work supported structured performance and cost-control review for management decision-making. No savings or revenue impact is claimed.",
    lessons: "A useful KPI view needs business context and variance interpretation; reporting a number alone does not explain the operational decision it should support.",
    expertise: ["Data & Business Intelligence", "Automation & Operations"],
    experience: "Related to Ahmed's verified management-control work and internship experience at El Mouradi Hotels.",
    faq: [{ question: "Are hotel financial figures available in this case study?", answer: "No. Confidential financial values and internal reports are excluded." }, { question: "What decisions did the analysis support?", answer: "The verified scope covers budget, variance, cost-control and management performance review." }],
    relatedTitle: "RPA for Invoice Control & Booking Reconciliation",
  },
};
