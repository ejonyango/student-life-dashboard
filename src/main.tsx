import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.mjs?url";
import {
  BookOpen,
  Bot,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  ExternalLink,
  FileText,
  GraduationCap,
  Inbox,
  Linkedin,
  MailCheck,
  MessageSquareText,
  Network,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  UserRoundCheck
} from "lucide-react";
import "./styles.css";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

type Application = {
  id?: string;
  company: string;
  role: string;
  status: "Applied" | "Interview" | "Drafting" | "Follow-up" | "Offer prep";
  next: string;
  fit: number;
  source?: string;
  applicationLink?: string;
  resumeVersion?: string;
  packetId?: string;
  packet?: ApplicationPacket | null;
};

type Lesson = {
  id?: string;
  course: string;
  time: string;
  task: string;
  intensity: "Low" | "Medium" | "High";
  professor?: string;
  location?: string;
  textbook?: string;
  term?: string;
};

type Agent = {
  name: string;
  state: string;
  detail: string;
  icon: React.ReactNode;
};

type Listing = {
  company: string;
  role: string;
  location: string;
  sourceBoard: "LinkedIn" | "Handshake" | "Indeed" | "Company Careers" | "TheirStack" | "SerpApi" | "RapidAPI";
  sourceDescription: string;
  companyVerification: string;
  applicationLink: string;
  verifiedDate: string;
  skills: string[];
  experienceSignals: string[];
  majors: string[];
};

type ResumeProfile = {
  fileName: string;
  text: string;
  skills: string[];
  experience: string[];
  major: string;
  keywords: string[];
};

type BaselineResume = {
  status: "Draft" | "Approved";
  updatedAt: string;
  name: string;
  contact: string;
  education: string[];
  experience: {
    company: string;
    role: string;
    location: string;
    dates: string;
    bullets: string[];
  }[];
  activities: {
    name: string;
    role: string;
    bullets: string[];
  }[];
  skills: string[];
};

type NavigateItem = {
  title: string;
  detail: string;
  source: "Navigate360";
};

type AcademicPlanTerm = {
  term: string;
  starts: string;
  credits: number;
  courses: string[];
};

type CompletedCourse = {
  code: string;
  title: string;
  source: "Resume" | "Navigate360";
  area: string;
};

type NavigateTask = {
  title: string;
  type: "Event" | "To-Do" | "Notification" | "Status";
  date: string;
  priority: "High" | "Medium" | "Low";
};

type NavigateResource = {
  name: string;
  category: string;
  detail: string;
};

type MatchedListing = Listing & {
  matchCount: number;
  matchedTerms: string[];
  fit: number;
};

type ProviderStatus = {
  provider: string;
  status: "ok" | "missing_key" | "error";
  message: string;
  count: number;
};

type JobSearchState = {
  status: "idle" | "loading" | "success" | "error";
  listings: Listing[];
  checkedAt: string;
  query: string;
  providerStatus: ProviderStatus[];
  error?: string;
};

type AgentAction = {
  id: string;
  actionType: string;
  status: "draft" | "approved" | "sent" | "skipped" | "error";
  subject: string;
  body: string;
  relatedApplicationId?: string;
  createdAt?: string;
};

type AdvisorTask = "intelligence_brief" | "assignment_checkin" | "research_advisor";

type AdvisorResult = {
  subject?: string;
  body?: string;
  trendThemes?: string[];
  importantDevelopments?: string[];
  industryImpacts?: string[];
  investmentAngles?: string[];
  sourceNotes?: string[];
  actionPlan?: string[];
  scheduleBlocks?: string[];
  studyPlanBlocks?: StudyPlanBlock[];
  researchPlan?: string[];
  suggestedSources?: string[];
  searchKeywords?: string[];
  clarifyingQuestions?: string[];
  approvalChecklist?: string[];
  riskNotes?: string[];
};

type StudyPlanBlock = {
  assignmentTitle?: string;
  courseName?: string;
  title?: string;
  focus?: string;
  daysBeforeDue?: number;
  preferredStartTime?: string;
  durationMinutes?: number;
  priority?: "low" | "medium" | "high";
};

type AssignmentTask = {
  id?: string;
  courseName: string;
  title: string;
  dueAt: string;
  textbook?: string;
  assignedPages?: string;
  details: string;
  status: "open" | "in_progress" | "done" | "archived";
  priority: "low" | "medium" | "high";
  createdAt?: string;
  updatedAt?: string;
};

type ReminderSettings = {
  enabled: boolean;
  cadence: "daily" | "weekdays" | "weekly";
  checkInTime: string;
  email: string;
  phone: string;
  channels: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  lastCheckedAt?: string;
};

type ClassNote = {
  id?: string;
  courseName: string;
  title: string;
  noteType: "notes" | "lecture_transcript" | "reading" | "research";
  content: string;
  tags: string[];
};

type CalendarDueDay = {
  date: Date;
  dateKey: string;
  inMonth: boolean;
  assignments: AssignmentTask[];
  events: CalendarEntry[];
};

type CalendarEntry = {
  id?: string;
  assignmentId?: string;
  title: string;
  courseName: string;
  startsAt: string;
  endsAt: string;
  location: string;
  notes: string;
  eventType: "study_block" | "class_event" | "interview" | "deadline" | "personal";
  source?: "manual" | "advisor_study_plan";
  googleEventUrl?: string;
  createdAt?: string;
  updatedAt?: string;
};

type StudyPlanState = {
  status: "none" | "draft" | "approved";
  approvedAt: string;
  sourceSignature: string;
};

type ApplicationPacket = {
  listing: MatchedListing;
  resumeFocus: string[];
  coverNote: string;
  talkingPoints: string[];
  commonAnswers: string[];
  reviewWarnings: string[];
  fitSummary: string;
  generatedBy: string;
  model: string;
  aiStatus: "ok" | "missing_key" | "fallback" | "error";
  aiMessage: string;
};

type Page =
  | "dashboard"
  | "available-listings"
  | "applications"
  | "school"
  | "calendar"
  | "agents"
  | "advisor"
  | "social"
  | "resume";

const defaultResumeProfile: ResumeProfile = {
  fileName: "Eric Onyango Resume.pdf",
  text:
    "Eric Onyango\nChicago, IL | (972) 352-3118 | eonyango@luc.edu | LinkedIn\n\nEDUCATION\nLoyola University Chicago, Quinlan School of Business, Chicago, IL\nBBA in Finance | Major GPA: 4.0/4.0\nRelevant Coursework: Intermediate Microeconomics (ECON 303), Intermediate Accounting I (ACCT 303), Database Systems (INFS 346), Business Statistics (ISSCM 241)\nMinors: Accounting and Information Systems, Environmental Economics and Sustainability\nDean's List: Fall '24, Spring '26; Class of 2028\n\nPROFESSIONAL EXPERIENCE\nIncoming Summer 2026 Intern - Exelon Business Services, LLC, Chicago, IL\nFinance Intern - Treasury and Capital Markets Team, Summer 2026\n\nRenewable Advisors, New York, NY - Remote\nWinter Analyst, January 2026 - April 2026\n- Supported preparation of capital raising materials for a sustainability focused advisory firm, updating investor presentations, fundraising timelines, and diligence workstreams for private placement mandates.\n- Researched and compiled recent private placement and M&A transactions across climate, infrastructure, and energy transition sectors to support pitch materials and investor outreach strategy.\n- Assisted in preparing investor presentation materials evaluating an African agribusiness platform's $80M+ recapitalization strategy, including operating forecasts, CapEx deployment, margin expansion, and capital markets funding alternatives.\n\nProject Destined, Remote\nReal Estate Private Equity Intern, December 2025 - February 2026\n- Underwrote three multifamily investments through a selective real estate private equity training program.\n\nHevesta Capital, Albuquerque, NM - Remote\nSearch Fund Intern, February 2025 - July 2025\n- Generated 15 proprietary acquisition leads through thematic sourcing across founder owned lower middle market businesses in climate adjacent sectors.\n- Conducted market mapping of 400+ CPA firms and intermediaries to expand referral channels and origination pipeline.\n- Analyzed ownership structures, financial profiles, and valuation benchmarks across target companies to support preliminary diligence and investment prioritization.\n\nACTIVITIES & INVOLVEMENT\nRambler Investment Fund, Student Managed Investment Fund: $1.5M AUM, Chicago, IL\nAnalyst, August 2024 - Present\n- Evaluated Energy, Technology Hardware, and Healthcare equities using valuation, catalysts, and macro trends.\n- Built investment theses through analysis of 10-Ks, 10-Qs, financial statements, and cash flow models with Refinitiv Eikon.\n\nGlobal Case Competition at Harvard - Rambler Investment Fund, March 2025\n- Selected to present M&A strategy recommendations in international case competition.\n\nAnalyst Development Program - Banking and Capital Markets Group, January 2025 - Present\n- Trained in 3-statement modeling, accounting ratios, valuation methods, and advanced Excel.\n\nNational Association of Black Accountants, Chicago, IL\nTreasurer, August 2025 - Present\n- Managed chapter budget, allocating funds for professional events, travel, and initiatives.\n\nAWARDS, SKILLS & INTERESTS\nAwards: MTWW Scholar 2025, Regents Scholarship, Jesuit Heritage Scholarship\nSkills: Excel, PowerPoint, SQL, Refinitiv Eikon, Grata\nInterests: Phanerozoic Time Period, North American Mythology, Fishkeeping, Basketball, Cinematography",
  skills: [
    "excel",
    "powerpoint",
    "sql",
    "refinitiv eikon",
    "grata",
    "valuation",
    "financial modeling",
    "capital markets",
    "treasury",
    "investment research",
    "private placement",
    "m&a",
    "due diligence",
    "market mapping",
    "financial statements",
    "accounting"
  ],
  experience: [
    "finance intern",
    "winter analyst",
    "real estate private equity",
    "search fund intern",
    "investment fund analyst",
    "capital raising",
    "investor presentations",
    "acquisition sourcing",
    "treasurer"
  ],
  major: "finance",
  keywords: ["Chicago", "finance internship", "capital markets", "investment banking"]
};

const initialBaselineResume: BaselineResume = {
  status: "Draft",
  updatedAt: "May 11, 2026",
  name: "Eric Onyango",
  contact: "Chicago, IL | (972) 352-3118 | eonyango@luc.edu | LinkedIn",
  education: [
    "Loyola University Chicago, Quinlan School of Business - BBA in Finance, Class of 2028",
    "Major GPA: 4.0/4.0; Minors in Accounting and Information Systems, Environmental Economics and Sustainability",
    "Relevant Coursework: Intermediate Microeconomics, Intermediate Accounting I, Database Systems, Business Statistics"
  ],
  experience: [
    {
      company: "Exelon Business Services, LLC",
      role: "Incoming Finance Intern - Treasury and Capital Markets Team",
      location: "Chicago, IL",
      dates: "Summer 2026",
      bullets: [
        "Incoming finance intern supporting treasury and capital markets workstreams."
      ]
    },
    {
      company: "Renewable Advisors",
      role: "Winter Analyst",
      location: "New York, NY - Remote",
      dates: "January 2026 - April 2026",
      bullets: [
        "Prepared capital raising materials for sustainability-focused advisory mandates, including investor presentations, fundraising timelines, and diligence workstreams.",
        "Researched private placement and M&A transactions across climate, infrastructure, and energy transition sectors to support pitch materials and investor outreach.",
        "Supported analysis of an African agribusiness platform's $80M+ recapitalization strategy, including operating forecasts, CapEx deployment, margin expansion, and funding alternatives."
      ]
    },
    {
      company: "Project Destined",
      role: "Real Estate Private Equity Intern",
      location: "Remote",
      dates: "December 2025 - February 2026",
      bullets: [
        "Underwrote three multifamily investments through a selective real estate private equity training program."
      ]
    },
    {
      company: "Hevesta Capital",
      role: "Search Fund Intern",
      location: "Albuquerque, NM - Remote",
      dates: "February 2025 - July 2025",
      bullets: [
        "Generated 15 proprietary acquisition leads through thematic sourcing across founder-owned lower middle market businesses in climate-adjacent sectors.",
        "Mapped 400+ CPA firms and intermediaries to expand referral channels and origination pipeline.",
        "Analyzed ownership structures, financial profiles, and valuation benchmarks to support preliminary diligence and investment prioritization."
      ]
    }
  ],
  activities: [
    {
      name: "Rambler Investment Fund",
      role: "Analyst",
      bullets: [
        "Evaluated Energy, Technology Hardware, and Healthcare equities using valuation, catalysts, macro trends, filings, financial statements, and cash flow models with Refinitiv Eikon.",
        "Selected to present M&A strategy recommendations in the Global Case Competition at Harvard."
      ]
    },
    {
      name: "Analyst Development Program - Banking and Capital Markets Group",
      role: "Participant",
      bullets: [
        "Trained in 3-statement modeling, accounting ratios, valuation methods, and advanced Excel."
      ]
    },
    {
      name: "National Association of Black Accountants",
      role: "Treasurer",
      bullets: [
        "Managed chapter budget and allocated funds for professional events, travel, and initiatives."
      ]
    }
  ],
  skills: ["Excel", "PowerPoint", "SQL", "Refinitiv Eikon", "Grata", "Valuation", "Financial Modeling", "Capital Markets"]
};

const initialApplications: Application[] = [
  {
    company: "Exelon",
    role: "Finance Intern - Treasury and Capital Markets",
    status: "Interview",
    next: "Prepare treasury, capital markets, and renewable energy talking points",
    fit: 96
  },
  {
    company: "William Blair",
    role: "Investment Banking Summer Analyst",
    status: "Applied",
    next: "Follow up with Chicago analyst contact after resume review",
    fit: 92
  },
  {
    company: "JPMorgan Chase",
    role: "Corporate & Investment Bank Summer Analyst",
    status: "Drafting",
    next: "Tailor resume around private placement and M&A transaction research",
    fit: 90
  },
  {
    company: "CME Group",
    role: "Finance & Risk Summer Analyst",
    status: "Follow-up",
    next: "Send note referencing Rambler Investment Fund markets experience",
    fit: 88
  }
];

const initialCourses: Lesson[] = [
  {
    course: "COMM 103: Business & Professional Speaking",
    time: "Tue | Thu 11:30 AM - 12:45 PM",
    task: "Section 210 · School of Communication 014",
    intensity: "High",
    location: "School of Communication 014",
    term: "Fall 2026"
  },
  {
    course: "ENGL 210: Business Writing",
    time: "Thu 7:00 PM - 9:30 PM",
    task: "Section 02W · Writing Intensive",
    intensity: "Medium",
    location: "Corboy Law Center 0426",
    term: "Fall 2026"
  },
  {
    course: "FINC 334: Principles of Corporate Finance",
    time: "Tue | Thu 10:00 AM - 11:15 AM",
    task: "Section 101 · Registered",
    intensity: "High",
    location: "Corboy Law Center 0206",
    term: "Fall 2026"
  },
  {
    course: "INFS 343: Business Analytics",
    time: "Tue 4:15 PM - 6:45 PM",
    task: "Section 105 · Registered",
    intensity: "Medium",
    location: "Schreiber Center 302",
    term: "Fall 2026"
  },
  {
    course: "INFS 347: Systems Analysis & Design",
    time: "Tue | Thu 8:30 AM - 9:45 AM",
    task: "Section 10E · Engaged Learning · Undergraduate Research",
    intensity: "Medium",
    location: "Schreiber Center 405",
    term: "Fall 2026"
  },
  {
    course: "THEO 231: Hebrew Bible/Old Testament",
    time: "Tue | Thu 1:00 PM - 2:15 PM",
    task: "Section 001 · Tier 2 Theological Knowledge",
    intensity: "Low",
    location: "Corboy Law Center L08",
    term: "Fall 2026"
  }
];

const academicStanding = {
  gpaLabel: "Major GPA",
  gpa: "4.0/4.0",
  classYear: "Class of 2028",
  honors: ["Dean's List: Fall 2024", "Dean's List: Spring 2026"],
  completedCourses: [
    {
      code: "ECON 303",
      title: "Intermediate Microeconomics",
      source: "Resume",
      area: "Economics"
    },
    {
      code: "ACCT 303",
      title: "Intermediate Accounting I",
      source: "Resume",
      area: "Accounting"
    },
    {
      code: "INFS 346",
      title: "Database Systems",
      source: "Resume",
      area: "Information Systems"
    },
    {
      code: "ISSCM 241",
      title: "Business Statistics",
      source: "Resume",
      area: "Analytics"
    }
  ] satisfies CompletedCourse[]
};

const navigateAcademicPlan: AcademicPlanTerm[] = [
  {
    term: "Fall 2026",
    starts: "August 24, 2026",
    credits: 15,
    courses: [
      "COMM 103 - Business & Professional Speaking",
      "ENGL 210 - Business Writing",
      "FINC 334 - Principles of Corporate Finance",
      "INFS 343 - Business Analytics",
      "INFS 347 - Systems Analysis & Design",
      "THEO 231 - Hebrew Bible/Old Testament"
    ]
  },
  {
    term: "J-term 2027",
    starts: "January 04, 2027",
    credits: 3,
    courses: ["LREB 315 - Law and the Regulatory Environment of Business I"]
  },
  {
    term: "Spring 2027",
    starts: "January 19, 2027",
    credits: 15,
    courses: [
      "ACCT 317 - Managerial Accounting",
      "ENVS 101 - The Scientific Basis of Environmental Issues",
      "ENVS 384 - Conservation Economics",
      "FINC 335 - Investments",
      "FINC 337 - Banking, Money & Capital Markets"
    ]
  },
  {
    term: "Fall 2027",
    starts: "August 30, 2027",
    credits: 18,
    courses: [
      "ACCT 308 - Accounting Information Systems and Sustainability Reporting",
      "ENVS 335 - Ecological Economics",
      "FINC 347 - Financial Institutions",
      "FINC 356 - Advanced Topics in Investment Banking and Asset Management",
      "HIST 213 - African History: Themes & Issues",
      "MGMT 304 - Strategic Management"
    ]
  },
  {
    term: "J-term 2028",
    starts: "January 03, 2028",
    credits: 3,
    courses: ["MGMT 341 - Ethics in Business"]
  },
  {
    term: "Spring 2028",
    starts: "January 18, 2028",
    credits: 12,
    courses: [
      "CLST 271 - Classical Mythology",
      "ECON 328 - Environmental Economics",
      "ENVS 283 - Environmental Sustainability",
      "FINC 355 - International Finance Management"
    ]
  }
];

const navigateTasks: NavigateTask[] = [
  {
    title: "First week of Summer 2026 classes",
    type: "Event",
    date: "Due May 18, 2026 at 7:00 AM",
    priority: "High"
  },
  {
    title: "Schedule an Appointment with your Academic Advisor",
    type: "To-Do",
    date: "June 1, 2026 to August 31, 2026",
    priority: "High"
  },
  {
    title: "Schedule an Appointment with a Career Services Counselor",
    type: "To-Do",
    date: "June 29, 2026 to August 31, 2026",
    priority: "High"
  },
  {
    title: "Take part in a Career or Internship Fair",
    type: "To-Do",
    date: "May 25, 2026 to August 31, 2026",
    priority: "High"
  },
  {
    title: "Schedule an Appointment with a Financial Aid Counselor",
    type: "To-Do",
    date: "June 1, 2026 to August 31, 2026",
    priority: "Medium"
  },
  {
    title: "Check out services offered in the Tutoring Center",
    type: "To-Do",
    date: "May 25, 2026 to August 31, 2026",
    priority: "Medium"
  },
  {
    title: "Review LUCommunity and sign up for a club or organization",
    type: "To-Do",
    date: "May 25, 2026 to August 31, 2026",
    priority: "Low"
  },
  {
    title: "Attend a Student Senate Meeting with SGLC",
    type: "To-Do",
    date: "June 8, 2026 to August 31, 2026",
    priority: "Low"
  },
  {
    title: "Please give feedback on your recent appointment",
    type: "Notification",
    date: "Last sent Feb 25",
    priority: "Medium"
  },
  {
    title: "No active holds",
    type: "Status",
    date: "Navigate360 Holds",
    priority: "Low"
  }
];

const navigateResources: NavigateResource[] = [
  {
    name: "Vargas-Castro, Vicky",
    category: "Advisor",
    detail: "Listed in Navigate360 People under Advisor."
  },
  {
    name: "Center for Experiential Learning",
    category: "Academic Support",
    detail: "Lake Shore Campus resource for experiential learning opportunities."
  },
  {
    name: "Tutoring Center",
    category: "Academic Support",
    detail: "Peer tutoring, supplemental instruction, and student success support."
  },
  {
    name: "Writing Center",
    category: "Academic Support",
    detail: "Coaching and feedback for writing assignments."
  },
  {
    name: "Resource Librarians (WTC)",
    category: "Academic Support",
    detail: "Water Tower Campus research assistance."
  }
];

const agents: Agent[] = [
  {
    name: "Email Agent",
    state: "Needs approval",
    detail: "Watching recruiter threads for Exelon, banking, search fund, and markets opportunities.",
    icon: <Inbox size={18} />
  },
  {
    name: "Calendar Agent",
    state: "Synced",
    detail: "Balances Quinlan coursework with interview prep and investment fund commitments.",
    icon: <CalendarDays size={18} />
  },
  {
    name: "Resume Agent",
    state: "Ready",
    detail: "Prioritizes finance, capital markets, private placement, and valuation language.",
    icon: <FileText size={18} />
  },
  {
    name: "Network Agent",
    state: "Drafting",
    detail: "Prepares outreach for Rambler alumni, NABA contacts, and Chicago finance professionals.",
    icon: <Linkedin size={18} />
  }
];

const listings: Listing[] = [
  {
    company: "Morningstar",
    role: "Summer Intern - Investment Research",
    location: "Chicago, IL",
    sourceBoard: "LinkedIn",
    sourceDescription: "Internship focused on investment research, financial analysis, and market problem solving.",
    companyVerification: "Company careers page checked before adding.",
    applicationLink: "https://www.morningstar.com/company/careers",
    verifiedDate: "May 10, 2026",
    skills: ["investment research", "financial statements", "excel", "valuation", "capital markets"],
    experienceSignals: ["investment fund analyst", "financial analysis", "investor presentations"],
    majors: ["finance", "economics", "accounting"]
  },
  {
    company: "Exelon",
    role: "Finance Intern - Treasury & Capital Markets",
    location: "Chicago, IL",
    sourceBoard: "Indeed",
    sourceDescription: "Finance internship aligned with treasury, capital markets, forecasting, and corporate finance work.",
    companyVerification: "Company careers page checked before adding.",
    applicationLink: "https://jobs.exeloncorp.com/",
    verifiedDate: "May 10, 2026",
    skills: ["treasury", "capital markets", "excel", "financial modeling", "powerpoint"],
    experienceSignals: ["finance intern", "capital raising", "investor presentations"],
    majors: ["finance", "accounting", "economics"]
  },
  {
    company: "William Blair",
    role: "Investment Banking Summer Analyst",
    location: "Chicago, IL",
    sourceBoard: "Handshake",
    sourceDescription: "Analyst internship involving financial analysis, valuation, client materials, and transaction execution support.",
    companyVerification: "Company careers page checked before adding.",
    applicationLink: "https://www.williamblair.com/Careers",
    verifiedDate: "May 10, 2026",
    skills: ["valuation", "financial modeling", "m&a", "powerpoint", "financial statements"],
    experienceSignals: ["winter analyst", "private placement", "investor presentations", "capital raising"],
    majors: ["finance", "accounting", "economics"]
  },
  {
    company: "CME Group",
    role: "Finance & Risk Summer Analyst",
    location: "Chicago, IL",
    sourceBoard: "LinkedIn",
    sourceDescription: "Analyst internship supporting financial markets, risk, clearing, and data-driven business analysis.",
    companyVerification: "Company careers page checked before adding.",
    applicationLink: "https://www.cmegroup.com/careers.html",
    verifiedDate: "May 10, 2026",
    skills: ["capital markets", "sql", "finance", "risk analysis", "financial statements"],
    experienceSignals: ["investment fund analyst", "market research", "technical coursework"],
    majors: ["finance", "economics", "information systems"]
  },
  {
    company: "Bank of America",
    role: "Global Markets Summer Analyst",
    location: "Chicago, IL",
    sourceBoard: "Indeed",
    sourceDescription: "Markets internship involving capital markets, client analysis, financial products, and presentation work.",
    companyVerification: "Company careers page checked before adding.",
    applicationLink: "https://careers.bankofamerica.com/",
    verifiedDate: "May 10, 2026",
    skills: ["capital markets", "excel", "powerpoint", "investment research", "financial modeling"],
    experienceSignals: ["investor presentations", "investment fund analyst", "market research"],
    majors: ["finance", "economics", "accounting"]
  },
  {
    company: "JPMorgan Chase",
    role: "Corporate & Investment Bank Summer Analyst",
    location: "Chicago, IL",
    sourceBoard: "Handshake",
    sourceDescription: "Finance internship supporting client analysis, transaction materials, valuation, and banking execution.",
    companyVerification: "Company careers page checked before adding.",
    applicationLink: "https://careers.jpmorgan.com/",
    verifiedDate: "May 10, 2026",
    skills: ["valuation", "financial modeling", "m&a", "capital markets", "excel"],
    experienceSignals: ["winter analyst", "capital raising", "private placement", "investor presentations"],
    majors: ["finance", "accounting", "economics"]
  },
  {
    company: "RSM",
    role: "Transaction Advisory Intern",
    location: "Chicago, IL",
    sourceBoard: "Company Careers",
    sourceDescription: "Internship focused on diligence, financial analysis, accounting quality, and transaction advisory support.",
    companyVerification: "Company careers page checked before adding.",
    applicationLink: "https://rsmus.com/careers.html",
    verifiedDate: "May 10, 2026",
    skills: ["due diligence", "accounting", "financial statements", "excel", "valuation"],
    experienceSignals: ["search fund intern", "ownership structures", "preliminary diligence"],
    majors: ["accounting", "finance", "economics"]
  },
  {
    company: "Deloitte",
    role: "Discovery Intern - Financial Advisory",
    location: "Chicago, IL",
    sourceBoard: "LinkedIn",
    sourceDescription: "Internship introducing advisory work across finance, accounting, business analysis, and client service.",
    companyVerification: "Company careers page checked before adding.",
    applicationLink: "https://www.deloitte.com/us/en/careers.html",
    verifiedDate: "May 10, 2026",
    skills: ["accounting", "financial statements", "excel", "powerpoint", "due diligence"],
    experienceSignals: ["treasurer", "business writing", "investment fund analyst"],
    majors: ["accounting", "finance", "business"]
  }
];

const skillDictionary = [
  "python",
  "java",
  "sql",
  "excel",
  "powerpoint",
  "refinitiv eikon",
  "grata",
  "data analysis",
  "statistics",
  "research",
  "presentation",
  "communication",
  "product",
  "operations",
  "finance",
  "market research",
  "project management",
  "data visualization",
  "user research",
  "data structures",
  "apis",
  "testing",
  "storytelling",
  "business writing",
  "technology",
  "valuation",
  "financial modeling",
  "3-statement modeling",
  "capital markets",
  "treasury",
  "investment research",
  "private placement",
  "m&a",
  "due diligence",
  "market mapping",
  "financial statements",
  "accounting",
  "risk analysis",
  "finance"
];

const experienceDictionary = [
  "analytics project",
  "coding project",
  "campus project",
  "research project",
  "leadership",
  "presentation",
  "business problem solving",
  "customer research",
  "technical coursework",
  "software project",
  "cross-functional project",
  "market research",
  "campus leadership"
  ,"finance intern",
  "winter analyst",
  "real estate private equity",
  "search fund intern",
  "investment fund analyst",
  "capital raising",
  "investor presentations",
  "acquisition sourcing",
  "treasurer",
  "ownership structures",
  "preliminary diligence",
  "financial analysis",
  "technical coursework"
];

const majorDictionary = [
  "business analytics",
  "computer science",
  "economics",
  "finance",
  "marketing",
  "business",
  "management",
  "communication",
  "information systems",
  "software engineering",
  "accounting",
  "environmental economics",
  "sustainability"
];

const statusClass: Record<Application["status"], string> = {
  Applied: "blue",
  Interview: "green",
  Drafting: "amber",
  "Follow-up": "purple",
  "Offer prep": "green"
};

const advisorModes: Record<AdvisorTask, { label: string; detail: string; prompt: string }> = {
  intelligence_brief: {
    label: "Intelligence brief",
    detail: "Trends, developments, industry impact, and investment angles.",
    prompt: "Renewable energy investment trends, project finance, grid constraints, policy, and M&A themes Eric should understand this week."
  },
  assignment_checkin: {
    label: "Assignment check-in",
    detail: "Ask what changed across classes and surface study priorities.",
    prompt: "Review Eric’s saved courses and ask what assignments, exams, readings, or projects changed this week. Help him prioritize next steps."
  },
  research_advisor: {
    label: "Research advisor",
    detail: "Turn an assignment question into a research plan and source strategy.",
    prompt: "Help Eric scope a class assignment or research question. Ask clarifying questions if needed, then propose a research plan, keywords, and credible source types."
  }
};

const pageTitles: Record<Page, string> = {
  dashboard: "Eric’s Dashboard",
  "available-listings": "Available Listings",
  applications: "Applications",
  school: "School",
  calendar: "Due Calendar",
  agents: "Agents",
  advisor: "Advisor",
  social: "Network",
  resume: "Resume"
};

const defaultReminderSettings: ReminderSettings = {
  enabled: true,
  cadence: "weekdays",
  checkInTime: "19:00",
  email: "",
  phone: "",
  channels: {
    email: true,
    sms: false,
    push: true
  }
};

const defaultStudyPlanState: StudyPlanState = {
  status: "none",
  approvedAt: "",
  sourceSignature: ""
};

function getPageFromHash(): Page {
  const page = window.location.hash.replace("#", "") as Page;
  return pageTitles[page] ? page : "dashboard";
}

function App() {
  const applicationPacketRef = useRef<HTMLDivElement | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>(() => getPageFromHash());
  const [courseList, setCourseList] = useState<Lesson[]>(initialCourses);
  const [courseForm, setCourseForm] = useState<Lesson>({
    course: "",
    time: "",
    task: "",
    intensity: "Medium",
    professor: "",
    location: "",
    textbook: ""
  });
  const [resumeProfile, setResumeProfile] = useState<ResumeProfile>(() => loadResumeProfile());
  const [baselineResume, setBaselineResume] = useState<BaselineResume>(() => loadBaselineResume());
  const [keywordInput, setKeywordInput] = useState("Chicago, internship");
  const [navigateText, setNavigateText] = useState("");
  const [navigateItems, setNavigateItems] = useState<NavigateItem[]>([]);
  const [applicationList, setApplicationList] = useState<Application[]>(() => loadApplicationList());
  const [applicationPacket, setApplicationPacket] = useState<ApplicationPacket | null>(null);
  const [packetStatus, setPacketStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [applicationSyncStatus, setApplicationSyncStatus] = useState<"loading" | "database" | "local" | "error">("loading");
  const [schoolSyncStatus, setSchoolSyncStatus] = useState<"loading" | "database" | "local" | "error">("loading");
  const [resumeSyncStatus, setResumeSyncStatus] = useState<"loading" | "database" | "local" | "error">("loading");
  const [agentSyncStatus, setAgentSyncStatus] = useState<"loading" | "database" | "local" | "error">("loading");
  const [agentActions, setAgentActions] = useState<AgentAction[]>([]);
  const [generatingAgentId, setGeneratingAgentId] = useState<string>("");
  const [advisorTask, setAdvisorTask] = useState<AdvisorTask>("intelligence_brief");
  const [advisorPrompt, setAdvisorPrompt] = useState("Renewable energy investment trends, project finance, grid constraints, policy, and M&A themes Eric should understand this week.");
  const [advisorResult, setAdvisorResult] = useState<AdvisorResult | null>(null);
  const [advisorStatus, setAdvisorStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [notebookPacket, setNotebookPacket] = useState("");
  const [assignmentTasks, setAssignmentTasks] = useState<AssignmentTask[]>([]);
  const [calendarEntries, setCalendarEntries] = useState<CalendarEntry[]>([]);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>(() => loadReminderSettings());
  const [studyPlanState, setStudyPlanState] = useState<StudyPlanState>(() => loadStudyPlanState());
  const [classNotes, setClassNotes] = useState<ClassNote[]>([]);
  const [assignmentForm, setAssignmentForm] = useState<AssignmentTask>({
    courseName: "",
    title: "",
    dueAt: "",
    textbook: "",
    assignedPages: "",
    details: "",
    status: "open",
    priority: "medium"
  });
  const [classNoteForm, setClassNoteForm] = useState<ClassNote>({
    courseName: "",
    title: "",
    noteType: "notes",
    content: "",
    tags: []
  });
  const [calendarEntryForm, setCalendarEntryForm] = useState<CalendarEntry>({
    title: "",
    courseName: "",
    startsAt: "",
    endsAt: "",
    location: "",
    notes: "",
    eventType: "study_block",
    source: "manual"
  });
  const [jobSearchState, setJobSearchState] = useState<JobSearchState>(() => loadJobSearchState());

  const enrolledCourseOptions = getSemesterCourseOptions(courseList, navigateAcademicPlan);
  const activeTermLabel = getActiveTermLabel(courseList, navigateAcademicPlan);
  const highPriorityCourses = enrolledCourseOptions.filter((course) => course.intensity === "High").length;
  const weeklyProgress = Math.min(96, 42 + enrolledCourseOptions.length * 9);
  const hasLiveListings = jobSearchState.listings.length > 0;
  const matchedListings = getMatchedListings(resumeProfile, hasLiveListings ? jobSearchState.listings : listings);
  const strongestMatch = matchedListings[0];
  const highPriorityTasks = navigateTasks.filter((task) => task.priority === "High");
  const nextClass = enrolledCourseOptions[0];
  const savedSignalCount = resumeProfile.skills.length + resumeProfile.experience.length + resumeProfile.keywords.length;
  const registeredCourseCount = enrolledCourseOptions.length;
  const plannedCourseCount = navigateAcademicPlan.reduce((total, term) => total + term.courses.length, 0);
  const completedCourseCount = academicStanding.completedCourses.length;
  const totalKnownProgramCourses = completedCourseCount + plannedCourseCount;
  const coursesLeftAfterCurrentTerm = Math.max(0, plannedCourseCount - registeredCourseCount);
  const upcomingAssignments = getUpcomingAssignments(assignmentTasks);
  const upcomingCalendarEntries = getUpcomingCalendarEntries(calendarEntries);
  const approvedStudyBlocks = getApprovedStudyBlocks(calendarEntries);
  const studyPlanSignature = getStudyPlanSignature(assignmentTasks);
  const studyPlanNeedsRefresh = studyPlanState.status === "approved" && studyPlanState.sourceSignature !== studyPlanSignature;
  const hasAiStudyPlanBlocks = Boolean(advisorResult?.studyPlanBlocks?.length);
  const assignmentFreshness = getAssignmentFreshness(assignmentTasks, reminderSettings.lastCheckedAt);
  const calendarDays = buildDueCalendar(calendarMonth, assignmentTasks, calendarEntries);
  const calendarMonthLabel = calendarMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const dueThisMonth = assignmentTasks.filter((assignment) => {
    const dueDate = parseAssignmentDueDate(assignment);
    return dueDate
      && dueDate.getMonth() === calendarMonth.getMonth()
      && dueDate.getFullYear() === calendarMonth.getFullYear()
      && assignment.status !== "done"
      && assignment.status !== "archived";
  });

  useEffect(() => {
    const syncPage = () => setCurrentPage(getPageFromHash());
    window.addEventListener("hashchange", syncPage);
    syncPage();
    return () => window.removeEventListener("hashchange", syncPage);
  }, []);

  useEffect(() => {
    setKeywordInput(resumeProfile.keywords.join(", "));
  }, [resumeProfile.fileName]);

  useEffect(() => {
    window.localStorage.setItem("student-life.resume-profile", JSON.stringify(resumeProfile));
  }, [resumeProfile]);

  useEffect(() => {
    window.localStorage.setItem("student-life.baseline-resume", JSON.stringify(baselineResume));
  }, [baselineResume]);

  useEffect(() => {
    if (jobSearchState.status === "success") {
      window.localStorage.setItem("student-life.job-search", JSON.stringify(jobSearchState));
    }
  }, [jobSearchState]);

  useEffect(() => {
    window.localStorage.setItem("student-life.assignment-reminders", JSON.stringify(reminderSettings));
  }, [reminderSettings]);

  useEffect(() => {
    window.localStorage.setItem("student-life.study-plan", JSON.stringify(studyPlanState));
  }, [studyPlanState]);

  useEffect(() => {
    let isMounted = true;

    async function syncAdvisorContext() {
      try {
        const [assignmentResponse, noteResponse, calendarResponse] = await Promise.all([
          fetch("http://localhost:8787/api/assignments"),
          fetch("http://localhost:8787/api/class-notes"),
          fetch("http://localhost:8787/api/calendar-events")
        ]);
        const assignmentPayload = assignmentResponse.ok ? await assignmentResponse.json() : { assignments: [] };
        const notePayload = noteResponse.ok ? await noteResponse.json() : { notes: [] };
        const calendarPayload = calendarResponse.ok ? await calendarResponse.json() : { events: [] };

        if (!isMounted) return;
        if (Array.isArray(assignmentPayload.assignments)) {
          setAssignmentTasks(assignmentPayload.assignments);
        }
        if (Array.isArray(notePayload.notes)) {
          setClassNotes(notePayload.notes);
        }
        if (Array.isArray(calendarPayload.events)) {
          setCalendarEntries(calendarPayload.events);
        }
      } catch {
        // Advisor context remains local-only if Supabase is unavailable.
      }
    }

    void syncAdvisorContext();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function syncAgentActionsFromDatabase() {
      try {
        const response = await fetch("http://localhost:8787/api/agent-actions");
        if (!response.ok) {
          setAgentSyncStatus("error");
          return;
        }

        const payload = await response.json();
        if (!isMounted || !Array.isArray(payload.actions)) {
          setAgentSyncStatus("error");
          return;
        }

        setAgentActions(payload.actions);
        setAgentSyncStatus(payload.database ? "database" : "local");
      } catch {
        setAgentSyncStatus("local");
      }
    }

    void syncAgentActionsFromDatabase();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function syncApplicationsFromDatabase() {
      try {
        const response = await fetch("http://localhost:8787/api/applications");
        if (!response.ok) {
          setApplicationSyncStatus("error");
          return;
        }

        const payload = await response.json();
        if (!isMounted || !Array.isArray(payload.applications)) {
          setApplicationSyncStatus("error");
          return;
        }

        setApplicationList(payload.applications);
        setApplicationSyncStatus(payload.database ? "database" : "local");
      } catch {
        setApplicationSyncStatus("local");
        // Local storage remains the startup fallback when Supabase is offline.
      }
    }

    void syncApplicationsFromDatabase();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function syncCoursesFromDatabase() {
      try {
        const response = await fetch("http://localhost:8787/api/courses");
        if (!response.ok) {
          setSchoolSyncStatus("error");
          return;
        }

        const payload = await response.json();
        if (!isMounted || !Array.isArray(payload.courses)) {
          setSchoolSyncStatus("error");
          return;
        }

        setCourseList(payload.courses.length ? payload.courses : getNextPlannedTermCourses(navigateAcademicPlan));
        setSchoolSyncStatus(payload.database ? "database" : "local");
      } catch {
        setSchoolSyncStatus("local");
        // Local course data remains the fallback when Supabase is offline.
      }
    }

    void syncCoursesFromDatabase();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function syncJobListingsFromDatabase() {
      try {
        const response = await fetch("http://localhost:8787/api/job-listings");
        if (!response.ok) return;

        const payload = await response.json();
        if (!isMounted || !Array.isArray(payload.listings) || payload.listings.length === 0) {
          return;
        }

        setJobSearchState({
          status: "success",
          listings: payload.listings,
          checkedAt: payload.checkedAt || new Date().toISOString(),
          query: "Saved database listings",
          providerStatus: [{
            provider: "Supabase",
            status: "ok",
            message: "Loaded saved listings from database.",
            count: payload.listings.length
          }]
        });
      } catch {
        // Local storage remains the listing fallback when Supabase is offline.
      }
    }

    void syncJobListingsFromDatabase();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function syncResumeFromDatabase() {
      try {
        const response = await fetch("http://localhost:8787/api/resume-version");
        if (!response.ok) {
          setResumeSyncStatus("error");
          return;
        }

        const payload = await response.json();
        const resumeVersion = payload.resumeVersion;
        if (!isMounted || !resumeVersion) {
          setResumeSyncStatus(payload.database ? "database" : "local");
          return;
        }

        const baseline = resumeVersion.baseline_resume || initialBaselineResume;
        const profile: ResumeProfile = {
          fileName: resumeVersion.file_name || defaultResumeProfile.fileName,
          text: resumeVersion.raw_text || defaultResumeProfile.text,
          skills: Array.isArray(resumeVersion.skills) ? resumeVersion.skills : defaultResumeProfile.skills,
          experience: parseResume(resumeVersion.raw_text || "", resumeVersion.file_name || "", []).experience,
          major: parseResume(resumeVersion.raw_text || "", resumeVersion.file_name || "", []).major,
          keywords: Array.isArray(resumeVersion.keywords) ? resumeVersion.keywords : []
        };

        setResumeProfile(profile);
        setBaselineResume({ ...initialBaselineResume, ...baseline });
        setResumeSyncStatus(payload.database ? "database" : "local");
      } catch {
        setResumeSyncStatus("local");
        // Local storage remains the resume fallback when Supabase is offline.
      }
    }

    void syncResumeFromDatabase();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    window.localStorage.setItem("student-life.applications", JSON.stringify(applicationList));
  }, [applicationList]);

  useEffect(() => {
    if (applicationPacket && currentPage === "available-listings") {
      applicationPacketRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [applicationPacket, currentPage]);

  function addCourse(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!courseForm.course.trim() || !courseForm.time.trim()) {
      return;
    }

    const course = {
      ...courseForm,
      task: courseForm.task.trim() || "No assignment added yet",
      textbook: courseForm.textbook?.trim() || ""
    };

    setCourseList((currentCourses) => [...currentCourses, course]);
    void persistCourse(course);

    setCourseForm({
      course: "",
      time: "",
      task: "",
      intensity: "Medium",
      professor: "",
      location: "",
      textbook: ""
    });
  }

  async function persistCourse(course: Lesson) {
    try {
      await fetch("http://localhost:8787/api/courses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ course })
      });
    } catch {
      // Local course data remains the fallback when the watcher/database is unavailable.
    }
  }

  async function removeCourse(lesson: Lesson) {
    setCourseList((currentCourses) =>
      currentCourses.filter((course) =>
        lesson.id ? course.id !== lesson.id : course.course !== lesson.course
      )
    );

    try {
      await fetch("http://localhost:8787/api/courses", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          id: lesson.id,
          course: lesson.course
        })
      });
    } catch {
      // Local removal remains the fallback when the watcher/database is unavailable.
    }
  }

  async function handleResumeUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const text = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
      ? await extractPdfText(file)
      : await file.text();
    const parsed = parseResume(text, file.name, resumeProfile.keywords);
    const baseline = createBaselineResume(parsed);
    setResumeProfile(parsed);
    setBaselineResume(baseline);
    void persistResumeVersion(parsed, baseline);
  }

  function saveKeywords() {
    const keywords = normalizeTerms(keywordInput);
    setResumeProfile((currentProfile) => {
      const updatedProfile = {
        ...currentProfile,
        keywords
      };
      void persistResumeVersion(updatedProfile, baselineResume);
      return updatedProfile;
    });
  }

  function approveBaselineResume() {
    const approvedBaseline: BaselineResume = {
      ...baselineResume,
      status: "Approved",
      updatedAt: "May 11, 2026"
    };
    setBaselineResume(approvedBaseline);
    void persistResumeVersion(resumeProfile, approvedBaseline);
  }

  function regenerateBaselineResume() {
    const draftBaseline = createBaselineResume(resumeProfile);
    setBaselineResume(draftBaseline);
    void persistResumeVersion(resumeProfile, draftBaseline);
  }

  async function persistResumeVersion(profile: ResumeProfile, baseline: BaselineResume) {
    try {
      await fetch("http://localhost:8787/api/resume-version", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          resumeProfile: profile,
          baselineResume: baseline
        })
      });
      setResumeSyncStatus("database");
    } catch {
      setResumeSyncStatus("local");
      // Local storage remains the resume fallback when the watcher/database is unavailable.
    }
  }

  async function createAgentAction(action: Pick<AgentAction, "actionType" | "subject" | "body">) {
    const temporaryAction: AgentAction = {
      id: `local-${Date.now()}`,
      status: "draft",
      ...action
    };
    setAgentActions((currentActions) => [temporaryAction, ...currentActions]);

    try {
      const response = await fetch("http://localhost:8787/api/agent-actions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ action })
      });
      if (!response.ok) throw new Error(`Agent endpoint returned ${response.status}`);

      const payload = await response.json();
      if (payload.action) {
        setAgentActions((currentActions) =>
          currentActions.map((currentAction) =>
            currentAction.id === temporaryAction.id ? payload.action : currentAction
          )
        );
        setAgentSyncStatus("database");
        void generateAgentActionDraft(payload.action);
      }
    } catch {
      setAgentSyncStatus("local");
    }
  }

  async function updateAgentActionStatus(action: AgentAction, status: AgentAction["status"]) {
    const updatedAction = { ...action, status };
    setAgentActions((currentActions) =>
      currentActions.map((currentAction) =>
        currentAction.id === action.id ? updatedAction : currentAction
      )
    );

    try {
      const response = await fetch("http://localhost:8787/api/agent-actions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ action: updatedAction })
      });
      if (!response.ok) throw new Error(`Agent endpoint returned ${response.status}`);

      const payload = await response.json();
      if (payload.action) {
        setAgentActions((currentActions) =>
          currentActions.map((currentAction) =>
            currentAction.id === action.id ? payload.action : currentAction
          )
        );
      }
      setAgentSyncStatus("database");
    } catch {
      setAgentSyncStatus("local");
    }
  }

  async function generateAgentActionDraft(action: AgentAction) {
    setGeneratingAgentId(action.id);

    try {
      const response = await fetch("http://localhost:8787/api/agent-action-generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action,
          resumeProfile,
          baselineResume,
          courses: enrolledCourseOptions,
          assignments: assignmentTasks,
          classNotes
        })
      });

      if (!response.ok) {
        throw new Error(`Agent AI endpoint returned ${response.status}`);
      }

      const payload = await response.json();
      const checklist = Array.isArray(payload.draft?.approvalChecklist) ? payload.draft.approvalChecklist : [];
      const risks = Array.isArray(payload.draft?.riskNotes) ? payload.draft.riskNotes : [];
      const trendThemes = Array.isArray(payload.draft?.trendThemes) ? payload.draft.trendThemes : [];
      const importantDevelopments = Array.isArray(payload.draft?.importantDevelopments) ? payload.draft.importantDevelopments : [];
      const industryImpacts = Array.isArray(payload.draft?.industryImpacts) ? payload.draft.industryImpacts : [];
      const investmentAngles = Array.isArray(payload.draft?.investmentAngles) ? payload.draft.investmentAngles : [];
      const sourceNotes = Array.isArray(payload.draft?.sourceNotes) ? payload.draft.sourceNotes : [];
      const generatedBody = [
        payload.draft?.body || action.body,
        trendThemes.length ? `\nTrend themes:\n- ${trendThemes.join("\n- ")}` : "",
        importantDevelopments.length ? `\nImportant developments:\n- ${importantDevelopments.join("\n- ")}` : "",
        industryImpacts.length ? `\nIndustry impact:\n- ${industryImpacts.join("\n- ")}` : "",
        investmentAngles.length ? `\nInvestment angles:\n- ${investmentAngles.join("\n- ")}` : "",
        sourceNotes.length ? `\nSource notes:\n- ${sourceNotes.join("\n- ")}` : "",
        checklist.length ? `\nApproval checklist:\n- ${checklist.join("\n- ")}` : "",
        risks.length ? `\nRisk notes:\n- ${risks.join("\n- ")}` : ""
      ].filter(Boolean).join("\n");
      const updatedAction: AgentAction = {
        ...action,
        subject: payload.draft?.subject || action.subject,
        body: generatedBody,
        status: "draft"
      };

      setAgentActions((currentActions) =>
        currentActions.map((currentAction) =>
          currentAction.id === action.id ? updatedAction : currentAction
        )
      );
      await updateAgentActionStatus(updatedAction, "draft");
    } catch {
      setAgentSyncStatus("local");
    } finally {
      setGeneratingAgentId("");
    }
  }

  function queueNetworkAction(actionType: string, subject: string, body: string) {
    void createAgentAction({ actionType, subject, body });
    setCurrentPage("agents");
    window.location.hash = "agents";
  }

  function selectAdvisorTask(task: AdvisorTask) {
    setAdvisorTask(task);
    setAdvisorPrompt(advisorModes[task].prompt);
    setAdvisorResult(null);
    setAdvisorStatus("idle");
  }

  async function runAdvisorTask() {
    setAdvisorStatus("loading");

    try {
      const response = await fetch("http://localhost:8787/api/advisor-generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          taskType: advisorTask,
          topic: advisorTask === "intelligence_brief"
            ? "Renewable energy investing intelligence brief"
            : advisorTask === "assignment_checkin"
              ? "Assignment check-in"
              : "Assignment research advisor",
          prompt: advisorPrompt,
          resumeProfile,
          baselineResume,
          courses: enrolledCourseOptions,
          assignments: assignmentTasks,
          classNotes
        })
      });

      if (!response.ok) {
        throw new Error(`Advisor endpoint returned ${response.status}`);
      }

      const payload = await response.json();
      setAdvisorResult(payload.result || null);
      setAdvisorStatus("ready");
    } catch {
      setAdvisorStatus("error");
    }
  }

  async function saveAssignmentTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!assignmentForm.title.trim()) return;

    const assignment = {
      ...assignmentForm,
      courseName: assignmentForm.courseName.trim() || "General",
      title: assignmentForm.title.trim(),
      textbook: assignmentForm.textbook?.trim() || getCourseTextbook(assignmentForm.courseName, enrolledCourseOptions),
      assignedPages: assignmentForm.assignedPages?.trim() || ""
    };
    setAssignmentTasks((currentTasks) => [assignment, ...currentTasks]);

    try {
      const response = await fetch("http://localhost:8787/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignment })
      });
      const payload = response.ok ? await response.json() : null;
      if (payload?.assignment) {
        setAssignmentTasks((currentTasks) =>
          currentTasks.map((task) => task === assignment ? payload.assignment : task)
        );
      }
    } catch {
      // Keep local assignment context available for the current session.
    }

    setAssignmentForm({
      courseName: "",
      title: "",
      dueAt: "",
      textbook: "",
      assignedPages: "",
      details: "",
      status: "open",
      priority: "medium"
    });
  }

  async function saveClassNote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!classNoteForm.content.trim()) return;

    const note = {
      ...classNoteForm,
      courseName: classNoteForm.courseName.trim() || "General",
      title: classNoteForm.title.trim() || "Class note",
      tags: classNoteForm.tags
    };
    setClassNotes((currentNotes) => [note, ...currentNotes]);

    try {
      const response = await fetch("http://localhost:8787/api/class-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note })
      });
      const payload = response.ok ? await response.json() : null;
      if (payload?.note) {
        setClassNotes((currentNotes) =>
          currentNotes.map((currentNote) => currentNote === note ? payload.note : currentNote)
        );
      }
    } catch {
      // Keep local note context available for the current session.
    }

    setClassNoteForm({
      courseName: "",
      title: "",
      noteType: "notes",
      content: "",
      tags: []
    });
  }

  async function saveCalendarEntry(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!calendarEntryForm.title.trim() || !calendarEntryForm.startsAt) return;

    const entry = {
      ...calendarEntryForm,
      title: calendarEntryForm.title.trim(),
      courseName: calendarEntryForm.courseName.trim(),
      endsAt: calendarEntryForm.endsAt || calendarEntryForm.startsAt,
      source: "manual" as const,
      googleEventUrl: buildGoogleCalendarUrl(calendarEntryForm)
    };
    setCalendarEntries((currentEntries) => [entry, ...currentEntries]);

    try {
      const response = await fetch("http://localhost:8787/api/calendar-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: entry })
      });
      const payload = response.ok ? await response.json() : null;
      if (payload?.event) {
        setCalendarEntries((currentEntries) =>
          currentEntries.map((currentEntry) => currentEntry === entry ? payload.event : currentEntry)
        );
      }
    } catch {
      // Keep local calendar entries available for the current session.
    }

    setCalendarEntryForm({
      title: "",
      courseName: "",
      startsAt: "",
      endsAt: "",
      location: "",
      notes: "",
      eventType: "study_block",
      source: "manual"
    });
  }

  async function updateAssignmentStatus(assignment: AssignmentTask, status: AssignmentTask["status"]) {
    const updatedAssignment = { ...assignment, status, updatedAt: new Date().toISOString() };
    setAssignmentTasks((currentAssignments) =>
      currentAssignments.map((currentAssignment) =>
        currentAssignment === assignment || (assignment.id && currentAssignment.id === assignment.id)
          ? updatedAssignment
          : currentAssignment
      )
    );

    try {
      const response = await fetch("http://localhost:8787/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignment: updatedAssignment })
      });
      const payload = response.ok ? await response.json() : null;
      if (payload?.assignment) {
        setAssignmentTasks((currentAssignments) =>
          currentAssignments.map((currentAssignment) =>
            currentAssignment.id === payload.assignment.id ? payload.assignment : currentAssignment
          )
        );
      }
    } catch {
      // Local status update remains visible for this session.
    }
  }

  async function approveAdvisorStudyPlan() {
    if (!advisorResult?.studyPlanBlocks?.length) return;

    const studyBlocks = buildStudyPlanEntries(assignmentTasks, advisorResult, enrolledCourseOptions);
    if (studyBlocks.length === 0) return;

    const manualEntries = calendarEntries.filter((entry) => entry.source !== "advisor_study_plan");
    setCalendarEntries([...studyBlocks, ...manualEntries]);
    setStudyPlanState({
      status: "approved",
      approvedAt: new Date().toISOString(),
      sourceSignature: studyPlanSignature
    });

    try {
      await fetch("http://localhost:8787/api/calendar-events", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "advisor_study_plan" })
      });
      await Promise.all(studyBlocks.map((entry) =>
        fetch("http://localhost:8787/api/calendar-events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event: entry })
        })
      ));
      const response = await fetch("http://localhost:8787/api/calendar-events");
      const payload = response.ok ? await response.json() : null;
      if (Array.isArray(payload?.events)) {
        setCalendarEntries(payload.events);
      }
    } catch {
      // Local approved study plan remains available when the watcher/database is unavailable.
    }
  }

  function createNotebookLmPacket() {
    const sections = [
      "# Eric Onyango Advisor Source Packet",
      "",
      `Generated: ${new Date().toLocaleString()}`,
      "",
      "## Advisor Mode",
      advisorModes[advisorTask].label,
      "",
      "## Current Question",
      advisorPrompt,
      "",
      "## Resume Context",
      `Major: ${resumeProfile.major || "Not detected"}`,
      `Skills: ${resumeProfile.skills.join(", ") || "None saved"}`,
      `Baseline status: ${baselineResume.status} (${baselineResume.updatedAt})`,
      "",
      "## Assignments",
      assignmentTasks.length
        ? assignmentTasks.map((assignment) =>
          `- ${assignment.courseName}: ${assignment.title}${assignment.dueAt ? ` due ${new Date(assignment.dueAt).toLocaleString()}` : ""}\n  Priority: ${assignment.priority}\n  Textbook: ${assignment.textbook || getCourseTextbook(assignment.courseName, enrolledCourseOptions) || "Not saved"}\n  Assigned pages: ${assignment.assignedPages || "Not saved"}\n  Details: ${assignment.details || "None"}`
        ).join("\n")
        : "No assignments saved yet.",
      "",
      "## Class Notes And Transcripts",
      classNotes.length
        ? classNotes.map((note) =>
          `### ${note.courseName}: ${note.title}\nType: ${note.noteType.replace("_", " ")}\n\n${note.content}`
        ).join("\n\n")
        : "No class notes saved yet.",
      "",
      "## Advisor Output",
      advisorResult
        ? [
          advisorResult.subject ? `### ${advisorResult.subject}` : "",
          advisorResult.body || "",
          formatNotebookSection("Trend themes", advisorResult.trendThemes),
          formatNotebookSection("Important developments", advisorResult.importantDevelopments),
          formatNotebookSection("Industry impact", advisorResult.industryImpacts),
          formatNotebookSection("Investment angles", advisorResult.investmentAngles),
          formatNotebookSection("Source notes", advisorResult.sourceNotes),
          formatNotebookSection("Action plan", advisorResult.actionPlan),
          formatNotebookSection("Schedule blocks", advisorResult.scheduleBlocks),
          formatNotebookSection("AI study blocks", advisorResult.studyPlanBlocks?.map((block) =>
            `${block.courseName || "Course"}: ${block.title || block.assignmentTitle || "Study block"} · ${block.focus || "Focused work"} · ${block.daysBeforeDue ?? 1} day(s) before due · ${block.preferredStartTime || "6:00 PM"} · ${block.durationMinutes || 75} minutes`
          )),
          formatNotebookSection("Research plan", advisorResult.researchPlan),
          formatNotebookSection("Suggested sources", advisorResult.suggestedSources),
          formatNotebookSection("Search keywords", advisorResult.searchKeywords),
          formatNotebookSection("Clarifying questions", advisorResult.clarifyingQuestions)
        ].filter(Boolean).join("\n\n")
        : "Run the Advisor first to include generated analysis."
    ];

    setNotebookPacket(sections.join("\n"));
  }

  async function copyNotebookLmPacket() {
    if (!notebookPacket) return;

    try {
      await navigator.clipboard.writeText(notebookPacket);
    } catch {
      // The packet remains visible for manual copying when clipboard access is blocked.
    }
  }

  async function runLiveJobSearch() {
    setJobSearchState((current) => ({ ...current, status: "loading", error: undefined }));

    try {
      const response = await fetch("http://localhost:8787/api/job-search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          skills: resumeProfile.skills,
          experience: resumeProfile.experience,
          keywords: resumeProfile.keywords,
          major: resumeProfile.major
        })
      });

      if (!response.ok) {
        throw new Error(`Job watcher returned ${response.status}`);
      }

      const payload = await response.json();
      setJobSearchState({
        status: "success",
        listings: Array.isArray(payload.listings) ? payload.listings : [],
        checkedAt: payload.checkedAt || new Date().toISOString(),
        query: payload.query || "",
        providerStatus: Array.isArray(payload.providerStatus) ? payload.providerStatus : []
      });
    } catch (error) {
      setJobSearchState((current) => ({
        ...current,
        status: "error",
        error: error instanceof Error ? error.message : "Unable to reach the local job watcher."
      }));
    }
  }

  function importNavigateText() {
    setNavigateItems(parseNavigate360Text(navigateText));
  }

  async function prepareApplication(listing: MatchedListing) {
    setPacketStatus("loading");
    setApplicationPacket(createApplicationPacket(listing, baselineResume, {
      aiStatus: "fallback",
      generatedBy: "Preparing AI packet",
      model: "deepseek-v4-flash",
      aiMessage: "Calling DeepSeek packet generator..."
    }));

    try {
      const response = await fetch("http://localhost:8787/api/application-packet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          task: "application_packet",
          listing,
          baselineResume,
          resumeProfile
        })
      });

      if (!response.ok) {
        throw new Error(`AI packet endpoint returned ${response.status}`);
      }

      const payload = await response.json();
      setApplicationPacket(createApplicationPacket(listing, baselineResume, {
        aiStatus: payload.status || "fallback",
        generatedBy: payload.generatedBy || "DeepSeek",
        model: payload.model || "deepseek-v4-flash",
        aiMessage: payload.message || "AI packet ready.",
        packet: payload.packet
      }));
      setPacketStatus("ready");
    } catch (error) {
      setApplicationPacket(createApplicationPacket(listing, baselineResume, {
        aiStatus: "error",
        generatedBy: "Template fallback",
        model: "deepseek-v4-flash",
        aiMessage: error instanceof Error ? error.message : "Unable to reach DeepSeek packet endpoint."
      }));
      setPacketStatus("error");
    }
  }

  function upsertApplication(application: Application) {
    setApplicationList((currentApplications) => {
      const existingIndex = currentApplications.findIndex(
        (currentApplication) =>
          currentApplication.company === application.company && currentApplication.role === application.role
      );

      if (existingIndex === -1) {
        return [application, ...currentApplications];
      }

      return currentApplications.map((currentApplication, index) =>
        index === existingIndex ? { ...currentApplication, ...application } : currentApplication
      );
    });
  }

  async function persistApplication(application: Application) {
    try {
      await fetch("http://localhost:8787/api/applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ application })
      });
    } catch {
      // Local storage remains the offline fallback when the watcher/database is unavailable.
    }
  }

  function updateApplicationWorkflow(application: Application, status: Application["status"]) {
    const nextByStatus: Record<Application["status"], string> = {
      Drafting: "Review tailored packet, verify application link, then decide whether to apply.",
      Applied: "Create a 7-day follow-up reminder and watch email for recruiter replies.",
      "Follow-up": "AI follow-up draft queued for approval; check email replies before sending.",
      Interview: "Prepare interview notes, schedule the meeting, and rehearse fit/technical answers.",
      "Offer prep": "Compare offer details, deadlines, compensation, and school schedule fit."
    };
    const updatedApplication: Application = {
      ...application,
      status,
      next: nextByStatus[status]
    };

    upsertApplication(updatedApplication);
    void persistApplication(updatedApplication);
  }

  function openSavedApplicationUrl(application: Application) {
    const rawUrl = application.applicationLink?.trim();
    if (!rawUrl) return;

    const url = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
    const openedWindow = window.open(url, "_blank", "noopener,noreferrer");

    if (!openedWindow) {
      window.location.href = url;
    }
  }

  function saveApplicationDraft() {
    if (!applicationPacket) return;

    const application: Application = {
      company: applicationPacket.listing.company,
      role: applicationPacket.listing.role,
      status: "Drafting",
      next: "Review tailored packet, verify application link, then decide whether to apply.",
      fit: applicationPacket.listing.fit,
      source: applicationPacket.listing.sourceBoard,
      applicationLink: applicationPacket.listing.applicationLink,
      resumeVersion: `${baselineResume.status} baseline · ${baselineResume.updatedAt}`,
      packet: applicationPacket
    };
    upsertApplication(application);
    void persistApplication(application);
    setCurrentPage("applications");
    window.location.hash = "applications";
  }

  function markApplicationApplied() {
    if (!applicationPacket) return;

    const application: Application = {
      company: applicationPacket.listing.company,
      role: applicationPacket.listing.role,
      status: "Applied",
      next: "Create a 7-day follow-up reminder and watch email for recruiter replies.",
      fit: applicationPacket.listing.fit,
      source: applicationPacket.listing.sourceBoard,
      applicationLink: applicationPacket.listing.applicationLink,
      resumeVersion: `${baselineResume.status} baseline · ${baselineResume.updatedAt}`,
      packet: applicationPacket
    };
    upsertApplication(application);
    void persistApplication(application);
    setCurrentPage("applications");
    window.location.hash = "applications";
  }

  function openApplicationUrl() {
    const rawUrl = applicationPacket?.listing.applicationLink?.trim();
    if (!rawUrl) return;

    const url = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
    const openedWindow = window.open(url, "_blank", "noopener,noreferrer");

    if (!openedWindow) {
      window.location.href = url;
    }
  }

  function viewSavedPacket(application: Application) {
    if (!application.packet) return;

    setApplicationPacket(application.packet);
    setPacketStatus("ready");
    setCurrentPage("available-listings");
    window.location.hash = "available-listings";
  }

  function startNewApplication() {
    setApplicationPacket(null);
    setCurrentPage("available-listings");
    window.location.hash = "available-listings";
  }

  function moveCalendarMonth(direction: -1 | 1) {
    setCalendarMonth((currentMonth) => new Date(currentMonth.getFullYear(), currentMonth.getMonth() + direction, 1));
  }

  function markAssignmentReminderChecked() {
    setReminderSettings((currentSettings) => ({
      ...currentSettings,
      lastCheckedAt: new Date().toISOString()
    }));
  }

  async function queueAssignmentDataReminder() {
    const channels = formatReminderChannels(reminderSettings);
    await createAgentAction({
      actionType: "assignment_data_reminder",
      subject: "Remind Eric to update assignment data",
      body: `Draft an approval-required reminder asking Eric to enter new assignments, due dates, assigned pages, and textbook readings. Preferred channels: ${channels || "browser dashboard only"}. Current freshness: ${assignmentFreshness.label}.`
    });
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <GraduationCap size={24} />
          </div>
          <div>
            <strong>Eric Onyango OS</strong>
            <span>Finance · Loyola Chicago</span>
          </div>
        </div>

        <nav className="nav-list" aria-label="Primary">
          <a className={currentPage === "dashboard" ? "active" : ""} href="#dashboard">
            <Target size={18} /> <span>Dashboard</span>
          </a>
          <a className={currentPage === "available-listings" ? "active" : ""} href="#available-listings">
            <Search size={18} /> <span>Available listings</span>
          </a>
          <a className={currentPage === "applications" ? "active" : ""} href="#applications">
            <BriefcaseBusiness size={18} /> <span>Applications</span>
          </a>
          <a className={currentPage === "school" ? "active" : ""} href="#school">
            <CalendarDays size={18} /> <span>School</span>
          </a>
          <a className={currentPage === "calendar" ? "active" : ""} href="#calendar">
            <Clock3 size={18} /> <span>Calendar</span>
          </a>
          <a className={currentPage === "agents" ? "active" : ""} href="#agents">
            <Bot size={18} /> <span>Agents</span>
          </a>
          <a className={currentPage === "advisor" ? "active" : ""} href="#advisor">
            <Sparkles size={18} /> <span>Advisor</span>
          </a>
          <a className={currentPage === "social" ? "active" : ""} href="#social">
            <Network size={18} /> <span>Network</span>
          </a>
          <a className={currentPage === "resume" ? "active" : ""} href="#resume">
            <FileText size={18} /> <span>Resume</span>
          </a>
        </nav>

        <section className="trust-box">
          <ShieldCheck size={18} />
          <div>
            <strong>Approval first</strong>
            <span>Agents draft replies, events, and posts before anything is sent.</span>
          </div>
        </section>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Monday, May 11</p>
            <h1>{pageTitles[currentPage]}</h1>
          </div>
          <div className="topbar-actions">
            <button className="icon-button" title="Sync connected accounts">
              <RefreshCw size={18} />
            </button>
            <button className="primary-button">
              <Plus size={18} /> New application
            </button>
          </div>
        </header>

        <section className={`dashboard-redesign ${currentPage === "dashboard" ? "" : "hidden-page"}`} id="dashboard">
          <article className="dashboard-focus-card">
            <div>
              <p className="eyebrow">Today’s command center</p>
              <h2>
                {upcomingAssignments[0]
                  ? `Next academic move: ${upcomingAssignments[0].title}`
                  : strongestMatch
                    ? `Next career move: prepare ${strongestMatch.company}`
                    : "Keep Eric’s calendar, coursework, and recruiting pipeline current."}
              </h2>
              <p>
                {upcomingAssignments[0]
                  ? `${upcomingAssignments[0].courseName} is due ${formatAssignmentDue(upcomingAssignments[0])}. ${formatAssignmentReading(upcomingAssignments[0], enrolledCourseOptions) || "Use the Advisor to turn it into a timed work plan."}`
                  : strongestMatch
                    ? `${strongestMatch.role} is the strongest current resume match at ${strongestMatch.fit}%.`
                    : "Add assignments, calendar entries, and live job results so the dashboard can prioritize the day."}
              </p>
            </div>
            <div className="focus-actions">
              <a className="primary-button" href="#calendar">
                <CalendarDays size={16} /> Calendar
              </a>
              <a className="ghost-button" href="#advisor" onClick={() => setAdvisorTask("assignment_checkin")}>
                <Sparkles size={16} /> Assignment plan
              </a>
            </div>
          </article>

          <div className="dashboard-pulse" aria-label="Dashboard pulse">
            <div>
              <span>Due soon</span>
              <strong>{upcomingAssignments.length}</strong>
              <em>assignments</em>
            </div>
            <div>
              <span>Events</span>
              <strong>{upcomingCalendarEntries.length}</strong>
              <em>calendar entries</em>
            </div>
            <div className={studyPlanNeedsRefresh ? "needs-attention" : ""}>
              <span>Study plan</span>
              <strong>{studyPlanState.status === "approved" ? approvedStudyBlocks.length : "Draft"}</strong>
              <em>{studyPlanNeedsRefresh ? "refresh needed" : studyPlanState.status}</em>
            </div>
            <div>
              <span>Pipeline</span>
              <strong>{applicationList.length}</strong>
              <em>applications</em>
            </div>
            <div>
              <span>Academic</span>
              <strong>{academicStanding.gpa}</strong>
              <em>{coursesLeftAfterCurrentTerm} courses left</em>
            </div>
            <div className={assignmentFreshness.isStale ? "needs-attention" : ""}>
              <span>Data check</span>
              <strong>{assignmentFreshness.isStale ? "Check" : "Current"}</strong>
              <em>{assignmentFreshness.label}</em>
            </div>
          </div>

          <section className="dashboard-main-grid">
            <article className="overview-panel workload-panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Calendar</p>
                  <h3>Workload and schedule</h3>
                </div>
                <a className="text-link" href="#calendar">Open calendar</a>
              </div>
              <div className="workload-columns">
                <div>
                  <div className="section-kicker">
                    <strong>Due dates</strong>
                    <span>{upcomingAssignments.length} upcoming</span>
                  </div>
                  <div className="dashboard-due-list">
                    {upcomingAssignments.slice(0, 4).map((assignment) => (
                      <article className="dashboard-due-row" key={`dashboard-due-${assignment.id || assignment.courseName}-${assignment.title}`}>
                        <div className="due-date-block">
                          <strong>{formatAssignmentDueDay(assignment)}</strong>
                          <span>{formatAssignmentDueTime(assignment)}</span>
                        </div>
                        <div>
                          <strong>{assignment.title}</strong>
                          <span>{assignment.courseName}</span>
                          {formatAssignmentReading(assignment, enrolledCourseOptions) ? <em>{formatAssignmentReading(assignment, enrolledCourseOptions)}</em> : null}
                        </div>
                        <span className={`due-chip ${assignment.priority}`}>{assignment.priority}</span>
                      </article>
                    ))}
                  </div>
                  {upcomingAssignments.length === 0 ? (
                    <div className="empty-state">
                      <strong>No due dates yet.</strong>
                      <span>Add assignments in Calendar or Advisor.</span>
                    </div>
                  ) : null}
                </div>
                <div>
                  <div className="section-kicker">
                    <strong>Events</strong>
                    <span>{upcomingCalendarEntries.length} upcoming</span>
                  </div>
                  <div className="mini-list">
                    {upcomingCalendarEntries.slice(0, 4).map((entry) => (
                      <div key={`dashboard-event-${entry.id || entry.title}`}>
                        <strong>{entry.title}</strong>
                        <span>{entry.courseName || entry.eventType.replace("_", " ")} · {formatCalendarEntryTime(entry)}</span>
                        {entry.source === "advisor_study_plan" ? <em>Approved study plan</em> : null}
                        {entry.googleEventUrl ? (
                          <a className="text-link" href={entry.googleEventUrl} target="_blank" rel="noreferrer">
                            Add to Google Calendar
                          </a>
                        ) : null}
                      </div>
                    ))}
                  </div>
                  {upcomingCalendarEntries.length === 0 ? (
                    <div className="empty-state">
                      <strong>No calendar entries.</strong>
                      <span>Add study blocks, interviews, and reminders from Calendar.</span>
                    </div>
                  ) : null}
                </div>
              </div>
            </article>

            <aside className="dashboard-side-stack">
              <article className={`overview-panel study-plan-panel ${studyPlanNeedsRefresh ? "needs-attention" : ""}`}>
                <div className="panel-header">
                  <div>
                    <p className="eyebrow">Advisor plan</p>
                    <h3>Approved study blocks</h3>
                  </div>
                  <span className={`provider-pill ${studyPlanState.status === "approved" ? "ok" : "missing_key"}`}>
                    {studyPlanNeedsRefresh ? "Update needed" : studyPlanState.status}
                  </span>
                </div>
                <strong className="panel-lead">{approvedStudyBlocks.length} blocks on calendar</strong>
                <p className="panel-note">
                  {studyPlanNeedsRefresh
                    ? "Assignments changed since approval. Refresh from Advisor to keep the calendar current."
                    : studyPlanState.status === "approved"
                      ? `Approved ${formatStudyPlanApprovedAt(studyPlanState.approvedAt)}.`
                      : "Run Assignment check-in in Advisor, then approve the plan."}
                </p>
                <div className="packet-actions">
                  <a className="ghost-button" href="#advisor" onClick={() => setAdvisorTask("assignment_checkin")}>
                    Generate with AI
                  </a>
                  <button className="ghost-button" type="button" onClick={approveAdvisorStudyPlan} disabled={!hasAiStudyPlanBlocks}>
                    Refresh plan
                  </button>
                </div>
              </article>

              <article className="overview-panel">
                <div className="panel-header">
                  <div>
                    <p className="eyebrow">Recruiting</p>
                    <h3>Next application</h3>
                  </div>
                  <a className="text-link" href="#available-listings">Listings</a>
                </div>
                <strong className="panel-lead">{strongestMatch ? strongestMatch.role : "No live match yet"}</strong>
                <p className="panel-note">
                  {strongestMatch ? `${strongestMatch.company} · ${strongestMatch.fit}% resume match` : "Run live APIs or refine resume keywords."}
                </p>
              </article>

              <article className="overview-panel reminder-panel compact-reminder">
                <div className="panel-header">
                  <div>
                    <p className="eyebrow">Reminder</p>
                    <h3>Assignment data</h3>
                  </div>
                  <span className={`provider-pill ${assignmentFreshness.isStale ? "error" : "ok"}`}>
                    {assignmentFreshness.isStale ? "Needs check" : "Fresh"}
                  </span>
                </div>
                <div className="reminder-status">
                  <Clock3 size={18} />
                  <div>
                    <strong>{assignmentFreshness.label}</strong>
                    <span>{assignmentFreshness.detail}</span>
                  </div>
                </div>
                <div className="packet-actions">
                  <button className="ghost-button" type="button" onClick={markAssignmentReminderChecked}>
                    Checked today
                  </button>
                  <button className="ghost-button" type="button" onClick={queueAssignmentDataReminder}>
                    Queue draft
                  </button>
                </div>
              </article>

              <article className="overview-panel">
                <div className="panel-header">
                  <div>
                    <p className="eyebrow">Academic record</p>
                    <h3>Standing</h3>
                  </div>
                  <a className="text-link" href="#school">School</a>
                </div>
                <div className="academic-snapshot">
                  <div>
                    <span>{academicStanding.gpaLabel}</span>
                    <strong>{academicStanding.gpa}</strong>
                  </div>
                  <div>
                    <span>Completed</span>
                    <strong>{completedCourseCount}</strong>
                  </div>
                  <div>
                    <span>Left</span>
                    <strong>{coursesLeftAfterCurrentTerm}</strong>
                  </div>
                </div>
              </article>
            </aside>
          </section>

          <section className="dashboard-context-grid">
            <article className="overview-panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Courses</p>
                  <h3>{activeTermLabel}</h3>
                </div>
                <span className="progress-pill">{enrolledCourseOptions.length} courses</span>
              </div>
              <div className="mini-list">
                {enrolledCourseOptions.slice(0, 4).map((course) => (
                  <div key={`overview-${course.course}`}>
                    <strong>{course.course}</strong>
                    <span>{course.time}</span>
                    <em>{course.location}</em>
                  </div>
                ))}
              </div>
            </article>

            <article className="overview-panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Navigate360</p>
                  <h3>Action queue</h3>
                </div>
                <span className="progress-pill">{highPriorityTasks.length} high priority</span>
              </div>
              <div className="mini-list">
                {navigateTasks.slice(0, 3).map((task) => (
                  <div key={`overview-${task.title}`}>
                    <strong>{task.title}</strong>
                    <span>{task.type} · {task.priority}</span>
                    <em>{task.date}</em>
                  </div>
                ))}
              </div>
            </article>
          </section>
        </section>

        <section className={`panel due-calendar-page ${currentPage === "calendar" ? "" : "hidden-page"}`} id="calendar">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Calendar</p>
              <h3>Assignment and deadline calendar</h3>
            </div>
            <div className="panel-actions">
              <span className="progress-pill">{upcomingAssignments.length} upcoming</span>
              <a className="text-link" href="#advisor" onClick={() => setAdvisorTask("assignment_checkin")}>Assignment check-in</a>
            </div>
          </div>
          <div className="calendar-layout">
            <div className="calendar-board">
              <div className="calendar-toolbar">
                <button className="icon-button" type="button" title="Previous month" onClick={() => moveCalendarMonth(-1)}>
                  <ChevronRight className="rotate-left" size={18} />
                </button>
                <strong>{calendarMonthLabel}</strong>
                <button className="icon-button" type="button" title="Next month" onClick={() => moveCalendarMonth(1)}>
                  <ChevronRight size={18} />
                </button>
              </div>
              <div className="calendar-weekdays" aria-hidden="true">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <span key={day}>{day}</span>
                ))}
              </div>
              <div className="calendar-grid">
                {calendarDays.map((day) => (
                  <article className={`calendar-day ${day.inMonth ? "" : "muted"} ${day.assignments.length ? "has-due" : ""}`} key={day.dateKey}>
                    <span>{day.date.getDate()}</span>
                    <div>
                      {day.assignments.slice(0, 3).map((assignment) => (
                        <em className={`due-chip ${assignment.priority}`} key={`${day.dateKey}-${assignment.id || assignment.title}`}>
                          {assignment.courseName}: {assignment.title}
                        </em>
                      ))}
                      {day.assignments.length > 3 ? <em className="due-chip more">+{day.assignments.length - 3} more</em> : null}
                      {day.events.slice(0, 3).map((entry) => (
                        <em className="due-chip event" key={`${day.dateKey}-${entry.id || entry.title}`}>
                          {entry.title}
                        </em>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </div>
            <aside className="calendar-sidebar">
              <form className="advisor-subform" onSubmit={saveAssignmentTask}>
                <strong>Add due item</strong>
                <select
                  value={assignmentForm.courseName}
                  onChange={(event) => {
                    const courseName = event.target.value;
                    setAssignmentForm({
                      ...assignmentForm,
                      courseName,
                      textbook: getCourseTextbook(courseName, enrolledCourseOptions)
                    });
                  }}
                >
                  <option value="">Select enrolled course</option>
                  {enrolledCourseOptions.map((course) => (
                    <option value={course.course} key={`calendar-course-${course.id || course.course}`}>
                      {course.course}
                    </option>
                  ))}
                </select>
                <input
                  value={assignmentForm.title}
                  onChange={(event) => setAssignmentForm({ ...assignmentForm, title: event.target.value })}
                  placeholder="Assignment, exam, reading, or project"
                />
                <input
                  type="datetime-local"
                  value={assignmentForm.dueAt}
                  onChange={(event) => setAssignmentForm({ ...assignmentForm, dueAt: event.target.value })}
                />
                <select
                  value={assignmentForm.priority}
                  onChange={(event) => setAssignmentForm({ ...assignmentForm, priority: event.target.value as AssignmentTask["priority"] })}
                >
                  <option value="low">Low priority</option>
                  <option value="medium">Medium priority</option>
                  <option value="high">High priority</option>
                </select>
                <input
                  value={assignmentForm.textbook || ""}
                  onChange={(event) => setAssignmentForm({ ...assignmentForm, textbook: event.target.value })}
                  placeholder="Textbook in use"
                />
                <input
                  value={assignmentForm.assignedPages || ""}
                  onChange={(event) => setAssignmentForm({ ...assignmentForm, assignedPages: event.target.value })}
                  placeholder="Assigned pages, chapters, or sections"
                />
                <textarea
                  value={assignmentForm.details}
                  onChange={(event) => setAssignmentForm({ ...assignmentForm, details: event.target.value })}
                  placeholder="Requirements, grading criteria, blockers, or estimated work"
                />
                <button className="primary-button" type="submit">
                  <Save size={16} /> Save due item
                </button>
              </form>
              <form className="advisor-subform" onSubmit={saveCalendarEntry}>
                <strong>Add calendar entry</strong>
                <select
                  value={calendarEntryForm.eventType}
                  onChange={(event) => setCalendarEntryForm({ ...calendarEntryForm, eventType: event.target.value as CalendarEntry["eventType"] })}
                >
                  <option value="study_block">Study block</option>
                  <option value="class_event">Class event</option>
                  <option value="interview">Interview</option>
                  <option value="deadline">Deadline</option>
                  <option value="personal">Personal</option>
                </select>
                <select
                  value={calendarEntryForm.courseName}
                  onChange={(event) => setCalendarEntryForm({ ...calendarEntryForm, courseName: event.target.value })}
                >
                  <option value="">No course / general</option>
                  {enrolledCourseOptions.map((course) => (
                    <option value={course.course} key={`event-course-${course.id || course.course}`}>
                      {course.course}
                    </option>
                  ))}
                </select>
                <input
                  value={calendarEntryForm.title}
                  onChange={(event) => setCalendarEntryForm({ ...calendarEntryForm, title: event.target.value })}
                  placeholder="Event title"
                />
                <input
                  type="datetime-local"
                  value={calendarEntryForm.startsAt}
                  onChange={(event) => setCalendarEntryForm({ ...calendarEntryForm, startsAt: event.target.value })}
                />
                <input
                  type="datetime-local"
                  value={calendarEntryForm.endsAt}
                  onChange={(event) => setCalendarEntryForm({ ...calendarEntryForm, endsAt: event.target.value })}
                />
                <input
                  value={calendarEntryForm.location}
                  onChange={(event) => setCalendarEntryForm({ ...calendarEntryForm, location: event.target.value })}
                  placeholder="Location or video link"
                />
                <textarea
                  value={calendarEntryForm.notes}
                  onChange={(event) => setCalendarEntryForm({ ...calendarEntryForm, notes: event.target.value })}
                  placeholder="Notes, prep items, or agenda"
                />
                <button className="primary-button" type="submit">
                  <Save size={16} /> Save event
                </button>
              </form>
              <div className="due-list">
                <div className="panel-header compact">
                  <div>
                    <p className="eyebrow">Upcoming</p>
                    <h4>Next due items</h4>
                  </div>
                  <span className="progress-pill">{dueThisMonth.length} this month</span>
                </div>
                {upcomingAssignments.slice(0, 8).map((assignment) => (
                  <article className="due-row" key={`due-${assignment.id || assignment.courseName}-${assignment.title}`}>
                    <div>
                      <strong>{assignment.title}</strong>
                      <span>{assignment.courseName} · {formatAssignmentDue(assignment)}</span>
                      <small>{formatAssignmentReading(assignment, enrolledCourseOptions)}</small>
                    </div>
                    <div className="due-actions">
                      <em className={`due-chip ${assignment.priority}`}>{assignment.priority}</em>
                      <button className="ghost-button" type="button" onClick={() => void updateAssignmentStatus(assignment, "done")}>
                        Done
                      </button>
                    </div>
                  </article>
                ))}
                {upcomingAssignments.length === 0 ? (
                  <div className="empty-state">
                    <strong>No upcoming due dates.</strong>
                    <span>Add assignments, exams, readings, or projects so Eric can see what is coming up.</span>
                  </div>
                ) : null}
              </div>
              <div className="due-list">
                <div className="panel-header compact">
                  <div>
                    <p className="eyebrow">Calendar</p>
                    <h4>Upcoming entries</h4>
                  </div>
                  <span className="progress-pill">{upcomingCalendarEntries.length} events</span>
                </div>
                {upcomingCalendarEntries.slice(0, 8).map((entry) => (
                  <article className="due-row" key={`event-${entry.id || entry.title}`}>
                    <div>
                      <strong>{entry.title}</strong>
                      <span>{entry.courseName || entry.eventType.replace("_", " ")} · {formatCalendarEntryTime(entry)}</span>
                      {entry.source === "advisor_study_plan" ? <small>Approved study plan</small> : null}
                      {entry.location ? <small>{entry.location}</small> : null}
                    </div>
                    {entry.googleEventUrl ? (
                      <a className="text-link" href={entry.googleEventUrl} target="_blank" rel="noreferrer">
                        Google
                      </a>
                    ) : null}
                  </article>
                ))}
              </div>
            </aside>
          </div>
        </section>

        <section className={`panel resume-intake ${currentPage === "resume" ? "" : "hidden-page"}`} id="resume">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Resume workspace</p>
              <h3>Eric’s current and baseline resumes</h3>
            </div>
            <div className="panel-actions">
              <span className={`provider-pill ${resumeSyncStatus === "database" ? "ok" : resumeSyncStatus === "error" ? "error" : "missing_key"}`}>
                {resumeSyncStatus === "database"
                  ? "Supabase synced"
                  : resumeSyncStatus === "loading"
                    ? "Syncing"
                    : resumeSyncStatus === "error"
                      ? "Sync issue"
                      : "Local fallback"}
              </span>
              <span className="progress-pill">{resumeProfile.skills.length} saved skills</span>
            </div>
          </div>
          <div className="resume-maintenance">
            <div>
              <strong>Resume updates</strong>
              <span>Use this only when Eric has a newer resume. The approved baseline remains the operating resume until he approves a replacement.</span>
            </div>
            <label className="compact-upload">
              <RefreshCw size={16} />
              Replace resume
              <input type="file" accept=".pdf,.txt,.md,.text" onChange={handleResumeUpload} />
            </label>
          </div>
          <div className="resume-grid">
            <div className="resume-summary">
              <span>Current resume</span>
              <strong>{resumeProfile.fileName}</strong>
              <p>Major or field: {resumeProfile.major || "Not detected yet"}</p>
              <p>Experience signals: {resumeProfile.experience.join(", ") || "None detected yet"}</p>
              <div className="tag-list">
                {resumeProfile.skills.slice(0, 10).map((skill) => (
                  <span key={skill}>{skill}</span>
                ))}
              </div>
            </div>
            <div className="resume-document">
              <div className="document-topline">
                <span>Uploaded resume</span>
                <strong>Full text</strong>
              </div>
              <pre>{resumeProfile.text}</pre>
            </div>
            <div className="baseline-card">
              <div className="baseline-topline">
                <span>AI baseline resume</span>
                <strong className={baselineResume.status === "Approved" ? "approved" : ""}>
                  {baselineResume.status}
                </strong>
              </div>
              <ResumeDocument resume={baselineResume} />
              <div className="baseline-actions">
                <button
                  className="primary-button"
                  type="button"
                  onClick={approveBaselineResume}
                >
                  <CheckCircle2 size={16} /> Approve baseline
                </button>
                <button
                  className="ghost-button"
                  type="button"
                  onClick={regenerateBaselineResume}
                >
                  <Sparkles size={16} /> Regenerate draft
                </button>
              </div>
            </div>
            <div className="keyword-box">
              <label>
                Additional keywords
                <textarea
                  value={keywordInput}
                  onChange={(event) => setKeywordInput(event.target.value)}
                placeholder="Chicago, investment banking, treasury, capital markets"
                />
              </label>
              <button className="primary-button" type="button" onClick={saveKeywords}>
                <Save size={16} /> Save keywords
              </button>
            </div>
          </div>
        </section>

        <section className={`panel listings-panel ${currentPage === "available-listings" ? "" : "hidden-page"}`} id="available-listings">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Available listings</p>
              <h3>Resume-matched internship leads</h3>
            </div>
            <div className="panel-actions">
              <button className="primary-button" type="button" onClick={runLiveJobSearch} disabled={jobSearchState.status === "loading"}>
                <Search size={16} /> {jobSearchState.status === "loading" ? "Checking APIs" : "Check live APIs"}
              </button>
              <span className="progress-pill">{matchedListings.length} of 500 max</span>
            </div>
          </div>
          <div className="verification-note">
            <CheckCircle2 size={18} />
            <span>
              Listings appear only when at least two resume skills, experience points, major terms,
              or saved keywords correlate with the role. The list is capped at 500.
            </span>
          </div>
          <div className="job-watcher-panel">
            <div>
              <strong>{hasLiveListings ? "Live API results" : "Sample listings showing matcher behavior"}</strong>
              <span>
                {jobSearchState.checkedAt
                  ? `Last checked ${formatCheckedAt(jobSearchState.checkedAt)} with query: ${jobSearchState.query}`
                  : "Start the local watcher, add provider keys, then run a live check."}
              </span>
            </div>
            <div className="provider-grid">
              {jobSearchState.providerStatus.length > 0 ? (
                jobSearchState.providerStatus.map((provider) => (
                  <span className={`provider-pill ${provider.status}`} key={provider.provider}>
                    {provider.provider}: {provider.status === "ok" ? `${provider.count} jobs` : provider.status.replace("_", " ")}
                  </span>
                ))
              ) : (
                <>
                  <span className="provider-pill missing_key">TheirStack: not checked</span>
                  <span className="provider-pill missing_key">SerpApi: not checked</span>
                  <span className="provider-pill missing_key">RapidAPI: not checked</span>
                </>
              )}
            </div>
            {jobSearchState.error ? <p className="watcher-error">{jobSearchState.error}</p> : null}
            {jobSearchState.providerStatus.some((provider) => provider.status === "missing_key") ? (
              <p className="watcher-error">Add keys to a local .env or shell environment, then run npm run job-watcher.</p>
            ) : null}
          </div>
          {applicationPacket ? (
            <div
              className="application-packet-overlay"
              role="dialog"
              aria-modal="true"
              aria-labelledby="application-packet-title"
              ref={applicationPacketRef}
            >
              <div className="application-packet" id="application-packet">
                <div className="panel-header">
                  <div>
                    <p className="eyebrow">Application packet</p>
                    <h3 id="application-packet-title">{applicationPacket.listing.role}</h3>
                    <span>{applicationPacket.listing.company} · {applicationPacket.listing.location}</span>
                  </div>
                  <span className="progress-pill">{applicationPacket.listing.fit}% match</span>
                </div>
                <div className={`ai-status ${applicationPacket.aiStatus}`}>
                  <Sparkles size={17} />
                  <span>
                    {packetStatus === "loading" ? "Generating with DeepSeek..." : `${applicationPacket.generatedBy} · ${applicationPacket.model}`}
                    {" "}— {applicationPacket.aiMessage}
                  </span>
                </div>
                <div className="packet-grid">
                  <article>
                    <strong>Verification</strong>
                    <span>{applicationPacket.listing.companyVerification}</span>
                    <span>Source: {applicationPacket.listing.sourceBoard}</span>
                    <span>Checked: {applicationPacket.listing.verifiedDate}</span>
                  </article>
                  <article>
                    <strong>Resume tailoring focus</strong>
                    <ul>
                      {applicationPacket.resumeFocus.map((item) => (
                        <li key={`focus-${item}`}>{item}</li>
                      ))}
                    </ul>
                  </article>
                  <article>
                    <strong>Talking points</strong>
                    <ul>
                      {applicationPacket.talkingPoints.map((item) => (
                        <li key={`talk-${item}`}>{item}</li>
                      ))}
                    </ul>
                  </article>
                  <article>
                    <strong>Fit summary</strong>
                    <span>{applicationPacket.fitSummary}</span>
                  </article>
                  <article>
                    <strong>Approval warnings</strong>
                    <ul>
                      {applicationPacket.reviewWarnings.map((item) => (
                        <li key={`warning-${item}`}>{item}</li>
                      ))}
                    </ul>
                  </article>
                  <article>
                    <strong>Common application answers</strong>
                    <ul>
                      {applicationPacket.commonAnswers.map((item) => (
                        <li key={`answer-${item}`}>{item}</li>
                      ))}
                    </ul>
                  </article>
                </div>
                <div className="cover-note">
                  <strong>Draft cover note</strong>
                  <p>{applicationPacket.coverNote}</p>
                </div>
                <div className="packet-actions">
                  <button className="primary-button" type="button" onClick={saveApplicationDraft}>
                    <Save size={16} /> Save draft
                  </button>
                  <button className="ghost-button" type="button" onClick={markApplicationApplied}>
                    <CheckCircle2 size={16} /> Mark applied
                  </button>
                  <button
                    className="application-link secondary"
                    type="button"
                    onClick={openApplicationUrl}
                    disabled={!applicationPacket.listing.applicationLink}
                  >
                    Open application <ExternalLink size={16} />
                  </button>
                  <button className="ghost-button" type="button" onClick={() => setApplicationPacket(null)}>
                    Close packet
                  </button>
                </div>
              </div>
            </div>
          ) : null}
          <div className="listing-grid">
            {matchedListings.map((listing) => (
              <article className="listing-card" key={`${listing.company}-${listing.role}`}>
                <div className="listing-topline">
                  <span>{listing.sourceBoard}</span>
                  <strong>{listing.fit}% match</strong>
                </div>
                <h4>{listing.role}</h4>
                <p className="listing-company">
                  {listing.company} · {listing.location}
                </p>
                <p>{listing.sourceDescription}</p>
                <p className="tailoring-note">
                  AI will tailor Eric’s approved baseline resume toward {listing.role} before application submission.
                </p>
                <div className="verified-line">
                  <ShieldCheck size={16} />
                  <span>{listing.companyVerification} · {listing.verifiedDate}</span>
                </div>
                <div className="match-tags">
                  {listing.matchedTerms.slice(0, 6).map((term) => (
                    <span key={`${listing.company}-${term}`}>{term}</span>
                  ))}
                </div>
                <button className="application-link" type="button" onClick={() => prepareApplication(listing)}>
                  Prepare application <Sparkles size={16} />
                </button>
              </article>
            ))}
          </div>
          {matchedListings.length === 0 ? (
            <div className="empty-state">
              <strong>No listings matched yet.</strong>
              <span>Upload a resume or add keywords so the matcher can find at least two correlations per role.</span>
            </div>
          ) : null}
        </section>

        <section className={`panel applications-page ${currentPage === "applications" ? "" : "hidden-page"}`} id="applications">
          <div className="campus-ribbon">
            <span>Loyola Chicago</span>
            <strong>Internship pipeline</strong>
            <span>Chicago-ready</span>
          </div>
          <div className="panel-header">
            <div>
              <p className="eyebrow">Pipeline</p>
              <h3>Eric’s internship applications</h3>
            </div>
            <div className="panel-actions">
              <span className={`provider-pill ${applicationSyncStatus === "database" ? "ok" : applicationSyncStatus === "error" ? "error" : "missing_key"}`}>
                {applicationSyncStatus === "database"
                  ? "Supabase synced"
                  : applicationSyncStatus === "loading"
                    ? "Syncing"
                    : applicationSyncStatus === "error"
                      ? "Sync issue"
                      : "Local fallback"}
              </span>
              <button className="ghost-button" type="button" onClick={startNewApplication}>New application</button>
            </div>
          </div>
          <div className="application-list">
            {applicationList.map((application) => (
              <article className="application-row" key={`${application.company}-${application.role}`}>
                <div>
                  <strong>{application.company}</strong>
                  <span>{application.role}</span>
                  {application.source ? <em>{application.source} · {application.resumeVersion}</em> : null}
                </div>
                <span className={`status ${statusClass[application.status]}`}>
                  {application.status}
                </span>
                <div className="fit-score" aria-label={`${application.fit}% fit`}>
                  <span style={{ width: `${application.fit}%` }} />
                </div>
                <p>{application.next}</p>
                <div className="application-actions">
                  {application.packet ? (
                    <button className="ghost-button" type="button" onClick={() => viewSavedPacket(application)}>
                      View packet
                    </button>
                  ) : null}
                  {application.applicationLink ? (
                    <button className="ghost-button" type="button" onClick={() => openSavedApplicationUrl(application)}>
                      Open link
                    </button>
                  ) : null}
                  {application.status !== "Applied" && application.status !== "Interview" ? (
                    <button className="ghost-button" type="button" onClick={() => updateApplicationWorkflow(application, "Applied")}>
                      Mark applied
                    </button>
                  ) : null}
                  {application.status === "Applied" ? (
                    <button className="ghost-button" type="button" onClick={() => updateApplicationWorkflow(application, "Follow-up")}>
                      Queue follow-up
                    </button>
                  ) : null}
                  {application.status === "Applied" || application.status === "Follow-up" ? (
                    <button className="ghost-button" type="button" onClick={() => updateApplicationWorkflow(application, "Interview")}>
                      Log interview
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
          {applicationList.length === 0 ? (
            <div className="empty-state">
              <strong>No saved applications yet.</strong>
              <span>Use Available Listings to prepare an AI packet, then save the draft into Eric’s pipeline.</span>
            </div>
          ) : null}
        </section>

        <section className={`panel school-editor ${currentPage === "school" ? "" : "hidden-page"}`} id="school">
          <div className="panel-header">
            <div>
              <p className="eyebrow">School</p>
              <h3>Eric’s registered courses</h3>
            </div>
            <div className="panel-actions">
              <span className={`provider-pill ${schoolSyncStatus === "database" ? "ok" : schoolSyncStatus === "error" ? "error" : "missing_key"}`}>
                {schoolSyncStatus === "database"
                  ? "Supabase synced"
                  : schoolSyncStatus === "loading"
                    ? "Syncing"
                    : schoolSyncStatus === "error"
                      ? "Sync issue"
                      : "Local fallback"}
              </span>
              <span className="progress-pill">{enrolledCourseOptions.length} courses</span>
            </div>
          </div>
          <form className="course-form" onSubmit={addCourse}>
            <label>
              Course
              <input
                value={courseForm.course}
                onChange={(event) => setCourseForm({ ...courseForm, course: event.target.value })}
                placeholder="MATH 212: Calculus"
              />
            </label>
            <label>
              Time
              <input
                value={courseForm.time}
                onChange={(event) => setCourseForm({ ...courseForm, time: event.target.value })}
                placeholder="Mon/Wed 10:25 AM"
              />
            </label>
            <label>
              Professor
              <input
                value={courseForm.professor}
                onChange={(event) => setCourseForm({ ...courseForm, professor: event.target.value })}
                placeholder="Professor name"
              />
            </label>
            <label>
              Location
              <input
                value={courseForm.location}
                onChange={(event) => setCourseForm({ ...courseForm, location: event.target.value })}
                placeholder="Cudahy Hall 204"
              />
            </label>
            <label className="wide-field">
              Textbook in use
              <input
                value={courseForm.textbook || ""}
                onChange={(event) => setCourseForm({ ...courseForm, textbook: event.target.value })}
                placeholder="Textbook title, edition, author, or ISBN"
              />
            </label>
            <label className="wide-field">
              Current assignment or note
              <input
                value={courseForm.task}
                onChange={(event) => setCourseForm({ ...courseForm, task: event.target.value })}
                placeholder="Reading, project, exam, office hours"
              />
            </label>
            <label>
              Priority
              <select
                value={courseForm.intensity}
                onChange={(event) =>
                  setCourseForm({ ...courseForm, intensity: event.target.value as Lesson["intensity"] })
                }
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </label>
            <button className="primary-button" type="submit">
              <Save size={16} /> Add course
            </button>
          </form>
          <div className="lesson-list editable-lessons">
            {enrolledCourseOptions.map((lesson) => (
              <article className="lesson-row" key={`school-${lesson.course}`}>
                <div className={`lesson-dot ${lesson.intensity.toLowerCase()}`} />
                <div>
                  <strong>{lesson.course}</strong>
                  <span>
                    {lesson.time} · {lesson.task}
                    {lesson.professor ? ` · ${lesson.professor}` : ""}
                    {lesson.location ? ` · ${lesson.location}` : ""}
                    {lesson.textbook ? ` · Textbook: ${lesson.textbook}` : ""}
                  </span>
                </div>
                <button
                  className="delete-button"
                  title={`Remove ${lesson.course}`}
                  onClick={() => void removeCourse(lesson)}
                >
                  <Trash2 size={16} />
                </button>
              </article>
            ))}
          </div>
          {enrolledCourseOptions.length === 0 ? (
            <div className="empty-state">
              <strong>No registered courses saved yet.</strong>
              <span>Add Eric’s current courses or import approved Navigate360/LOCUS schedule text.</span>
            </div>
          ) : null}
          <div className="planner-card">
            <BookOpen size={18} />
            <span>Registered/planned courses are loaded from Supabase when available and feed Eric’s Dashboard.</span>
          </div>
        </section>

        <section className={`three-column ${currentPage === "agents" || currentPage === "social" ? "" : "hidden-page"}`}>
          <div className={`panel ${currentPage === "agents" ? "" : "hidden-page"}`} id="agents">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Autopilot</p>
                <h3>Eric’s agents</h3>
              </div>
              <span className={`provider-pill ${agentSyncStatus === "database" ? "ok" : agentSyncStatus === "error" ? "error" : "missing_key"}`}>
                {agentSyncStatus === "database"
                  ? "Supabase synced"
                  : agentSyncStatus === "loading"
                    ? "Syncing"
                    : agentSyncStatus === "error"
                      ? "Sync issue"
                      : "Local fallback"}
              </span>
            </div>
            <div className="agent-list">
              {agents.map((agent) => (
                <article className="agent-row" key={agent.name}>
                  <div className="agent-icon">{agent.icon}</div>
                  <div>
                    <strong>{agent.name}</strong>
                    <span>{agent.detail}</span>
                  </div>
                  <em>{agent.state}</em>
                </article>
              ))}
            </div>
            <div className="packet-actions">
              <button
                className="primary-button"
                type="button"
                onClick={() =>
                  void createAgentAction({
                    actionType: "next_best_action",
                    subject: "Suggest Eric’s next best career action",
                    body: "Use Eric’s resume, applications, school load, and finance recruiting goals to draft the next approval-required action."
                  })
                }
              >
                <Sparkles size={16} /> Ask DeepSeek for next action
              </button>
              <button
                className="ghost-button"
                type="button"
                onClick={() => {
                  setAdvisorTask("intelligence_brief");
                  setCurrentPage("advisor");
                  window.location.hash = "advisor";
                }}
              >
                Renewable investing brief
              </button>
              <button
                className="ghost-button"
                type="button"
                onClick={() => {
                  setAdvisorTask("assignment_checkin");
                  setCurrentPage("advisor");
                  window.location.hash = "advisor";
                }}
              >
                Assignment check-in
              </button>
              <button
                className="ghost-button"
                type="button"
                onClick={() => {
                  setAdvisorTask("research_advisor");
                  setCurrentPage("advisor");
                  window.location.hash = "advisor";
                }}
              >
                Research advisor
              </button>
            </div>
            <div className="agent-list">
              {agentActions.map((action) => (
                <article className="agent-row" key={action.id}>
                  <div className="agent-icon">
                    <Bot size={17} />
                  </div>
                  <div>
                    <strong>{action.subject}</strong>
                    <span>{action.body || action.actionType.replace(/_/g, " ")}</span>
                  </div>
                  <em>{action.status}</em>
                  <div className="application-actions">
                    <button
                      className="ghost-button"
                      type="button"
                      onClick={() => void generateAgentActionDraft(action)}
                      disabled={generatingAgentId === action.id}
                    >
                      {generatingAgentId === action.id ? "Generating" : "Generate with AI"}
                    </button>
                    {action.status === "draft" ? (
                      <button className="ghost-button" type="button" onClick={() => void updateAgentActionStatus(action, "approved")}>
                        Approve
                      </button>
                    ) : null}
                    {action.status !== "skipped" && action.status !== "sent" ? (
                      <button className="ghost-button" type="button" onClick={() => void updateAgentActionStatus(action, "skipped")}>
                        Skip
                      </button>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
            {agentActions.length === 0 ? (
              <div className="empty-state">
                <strong>No agent drafts queued.</strong>
                <span>Use Network actions or application follow-ups to create approval-required drafts.</span>
              </div>
            ) : null}
          </div>

          <div className="panel hidden-page">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Resume</p>
                <h3>Finance profile</h3>
              </div>
              <FileText size={20} />
            </div>
            <div className="resume-card">
              <strong>{resumeProfile.fileName}</strong>
              <span>{resumeProfile.major || "Field not detected"}</span>
              <p>{resumeProfile.experience.slice(0, 3).join(", ") || "Add experience through the resume upload."}</p>
            </div>
            <button className="wide-action">
              Generate job-specific version <ChevronRight size={18} />
            </button>
          </div>

          <div className={`panel ${currentPage === "social" ? "" : "hidden-page"}`} id="social">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Presence</p>
                <h3>Eric’s network</h3>
              </div>
              <Linkedin size={20} />
            </div>
            <div className="social-list">
              <SocialItem icon={<UserRoundCheck size={17} />} label="LinkedIn profile" value="Finance analyst positioning" />
              <SocialItem icon={<MessageSquareText size={17} />} label="Post draft" value="Rambler Investment Fund insight" />
              <SocialItem icon={<MailCheck size={17} />} label="Outreach" value="Banking and capital markets contacts" />
            </div>
            <div className="packet-actions">
              <button
                className="primary-button"
                type="button"
                onClick={() =>
                  queueNetworkAction(
                    "linkedin_profile_review",
                    "Review Eric’s LinkedIn positioning",
                    "Draft suggested LinkedIn headline/about edits aligned to finance internships and Eric’s approved baseline resume."
                  )
                }
              >
                <Sparkles size={16} /> Queue profile review
              </button>
              <button
                className="ghost-button"
                type="button"
                onClick={() =>
                  queueNetworkAction(
                    "social_post",
                    "Draft LinkedIn post",
                    "Draft an approval-required LinkedIn post about Eric’s finance learning, Rambler Investment Fund work, or internship search progress."
                  )
                }
              >
                Draft post
              </button>
              <button
                className="ghost-button"
                type="button"
                onClick={() =>
                  queueNetworkAction(
                    "network_outreach",
                    "Draft networking outreach",
                    "Draft a concise outreach message for finance, banking, treasury, or capital markets contacts."
                  )
                }
              >
                Draft outreach
              </button>
            </div>
          </div>
        </section>

        <section className={`panel advisor-page ${currentPage === "advisor" ? "" : "hidden-page"}`} id="advisor">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Advisor</p>
              <h3>Research, assignments, and intelligence briefs</h3>
            </div>
            <span className={`provider-pill ${advisorStatus === "error" ? "error" : advisorStatus === "ready" ? "ok" : "missing_key"}`}>
              {advisorStatus === "loading" ? "Generating" : advisorStatus === "ready" ? "Ready" : advisorStatus === "error" ? "Error" : "DeepSeek"}
            </span>
          </div>
          <div className="advisor-grid">
            <div className="advisor-controls">
              <div className="advisor-mode-grid" role="tablist" aria-label="Advisor mode">
                {(Object.entries(advisorModes) as Array<[AdvisorTask, typeof advisorModes[AdvisorTask]]>).map(([mode, config]) => (
                  <button
                    className={`advisor-mode ${advisorTask === mode ? "active" : ""}`}
                    type="button"
                    role="tab"
                    aria-selected={advisorTask === mode}
                    key={mode}
                    onClick={() => selectAdvisorTask(mode)}
                  >
                    <strong>{config.label}</strong>
                    <span>{config.detail}</span>
                  </button>
                ))}
              </div>
              <label className="advisor-prompt">
                <span>Topic or question</span>
                <textarea
                  value={advisorPrompt}
                  onChange={(event) => setAdvisorPrompt(event.target.value)}
                  placeholder={advisorModes[advisorTask].prompt}
                />
              </label>
              {advisorTask === "assignment_checkin" ? (
                <form className="advisor-subform" onSubmit={saveAssignmentTask}>
                  <strong>Add assignment</strong>
                  <select
                    value={assignmentForm.courseName}
                    onChange={(event) => {
                      const courseName = event.target.value;
                      setAssignmentForm({
                        ...assignmentForm,
                        courseName,
                        textbook: getCourseTextbook(courseName, enrolledCourseOptions)
                      });
                    }}
                  >
                    <option value="">Select enrolled course</option>
                    {enrolledCourseOptions.map((course) => (
                      <option value={course.course} key={`advisor-course-${course.id || course.course}`}>
                        {course.course}
                      </option>
                    ))}
                  </select>
                  <input
                    value={assignmentForm.title}
                    onChange={(event) => setAssignmentForm({ ...assignmentForm, title: event.target.value })}
                    placeholder="Assignment"
                  />
                  <input
                    type="datetime-local"
                    value={assignmentForm.dueAt}
                    onChange={(event) => setAssignmentForm({ ...assignmentForm, dueAt: event.target.value })}
                  />
                  <input
                    value={assignmentForm.textbook || ""}
                    onChange={(event) => setAssignmentForm({ ...assignmentForm, textbook: event.target.value })}
                    placeholder="Textbook in use"
                  />
                  <input
                    value={assignmentForm.assignedPages || ""}
                    onChange={(event) => setAssignmentForm({ ...assignmentForm, assignedPages: event.target.value })}
                    placeholder="Assigned pages, chapters, or sections"
                  />
                  <textarea
                    value={assignmentForm.details}
                    onChange={(event) => setAssignmentForm({ ...assignmentForm, details: event.target.value })}
                    placeholder="Requirements, grading criteria, blockers, or estimated work"
                  />
                  <button className="ghost-button" type="submit">Save assignment</button>
                </form>
              ) : null}
              {advisorTask === "research_advisor" ? (
                <form className="advisor-subform" onSubmit={saveClassNote}>
                  <strong>Save class notes or transcript</strong>
                  <input
                    value={classNoteForm.courseName}
                    onChange={(event) => setClassNoteForm({ ...classNoteForm, courseName: event.target.value })}
                    placeholder="Course"
                  />
                  <input
                    value={classNoteForm.title}
                    onChange={(event) => setClassNoteForm({ ...classNoteForm, title: event.target.value })}
                    placeholder="Note title"
                  />
                  <select
                    value={classNoteForm.noteType}
                    onChange={(event) => setClassNoteForm({ ...classNoteForm, noteType: event.target.value as ClassNote["noteType"] })}
                  >
                    <option value="notes">Class notes</option>
                    <option value="lecture_transcript">Lecture transcript</option>
                    <option value="reading">Reading notes</option>
                    <option value="research">Research notes</option>
                  </select>
                  <textarea
                    value={classNoteForm.content}
                    onChange={(event) => setClassNoteForm({ ...classNoteForm, content: event.target.value })}
                    placeholder="Paste lecture notes, transcript, readings, or assignment context"
                  />
                  <button className="ghost-button" type="submit">Save notes</button>
                </form>
              ) : null}
              <button className="primary-button" type="button" onClick={runAdvisorTask} disabled={advisorStatus === "loading"}>
                <Sparkles size={16} /> {advisorStatus === "loading" ? "Generating" : "Run advisor"}
              </button>
              {advisorTask === "assignment_checkin" ? (
                <div className="planner-card advisor-planner-note">
                  <Sparkles size={18} />
                  <span>Run Advisor after assignments are entered to generate AI study blocks. Eric approves them before they are added to Calendar.</span>
                </div>
              ) : null}
            </div>
            <div className="advisor-output">
              <div className="advisor-context">
                <strong>Saved context</strong>
                <span>{assignmentTasks.length} assignments · {classNotes.length} notes</span>
              </div>
              {advisorResult ? (
                <>
                  <strong>{advisorResult.subject || "Advisor response"}</strong>
                  <p>{advisorResult.body}</p>
                  <AdvisorList title="Trend themes" items={advisorResult.trendThemes} />
                  <AdvisorList title="Important developments" items={advisorResult.importantDevelopments} />
                  <AdvisorList title="Industry impact" items={advisorResult.industryImpacts} />
                  <AdvisorList title="Investment angles" items={advisorResult.investmentAngles} />
                  <AdvisorList title="Source notes" items={advisorResult.sourceNotes} />
                  <AdvisorList title="Action plan" items={advisorResult.actionPlan} />
                  <AdvisorList title="Schedule blocks" items={advisorResult.scheduleBlocks} />
                  <AdvisorList
                    title="AI study blocks"
                    items={advisorResult.studyPlanBlocks?.map((block) =>
                      `${block.courseName || "Course"}: ${block.title || block.assignmentTitle || "Study block"} · ${block.focus || "Focused work"} · ${block.daysBeforeDue ?? 1} day(s) before due · ${block.preferredStartTime || "6:00 PM"}`
                    )}
                  />
                  <AdvisorList title="Research plan" items={advisorResult.researchPlan} />
                  <AdvisorList title="Suggested sources" items={advisorResult.suggestedSources} />
                  <AdvisorList title="Search keywords" items={advisorResult.searchKeywords} />
                  <AdvisorList title="Clarifying questions" items={advisorResult.clarifyingQuestions} />
                  <AdvisorList title="Approval checklist" items={advisorResult.approvalChecklist} />
                  <AdvisorList title="Risk notes" items={advisorResult.riskNotes} />
                  {advisorTask === "assignment_checkin" ? (
                    <div className={`study-plan-approval ${studyPlanNeedsRefresh ? "needs-attention" : ""}`}>
                      <div>
                        <strong>Advisor study plan</strong>
                        <span>
                          {studyPlanState.status === "approved"
                            ? `${approvedStudyBlocks.length} approved study blocks are on the calendar.`
                            : hasAiStudyPlanBlocks
                              ? "Approve the AI-generated study plan to add study blocks to the calendar."
                              : "Run the Advisor to generate AI study blocks before approval."}
                        </span>
                      </div>
                      <button className="primary-button" type="button" onClick={approveAdvisorStudyPlan} disabled={!hasAiStudyPlanBlocks}>
                        <CheckCircle2 size={16} /> {studyPlanState.status === "approved" ? "Update approved plan" : "Approve study plan"}
                      </button>
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="empty-state">
                  <strong>Choose a mode and run the advisor.</strong>
                  <span>Use this page for direct help. It does not create an agent draft unless Eric asks to turn the output into one.</span>
                </div>
              )}
              {assignmentTasks.length > 0 && advisorTask === "assignment_checkin" ? (
                <AdvisorList
                  title="Saved assignments"
                  items={assignmentTasks.slice(0, 6).map((assignment) =>
                    `${assignment.courseName}: ${assignment.title}${assignment.dueAt ? ` due ${new Date(assignment.dueAt).toLocaleString()}` : ""}${formatAssignmentReading(assignment, enrolledCourseOptions) ? ` · ${formatAssignmentReading(assignment, enrolledCourseOptions)}` : ""}`
                  )}
                />
              ) : null}
              {classNotes.length > 0 && advisorTask === "research_advisor" ? (
                <AdvisorList
                  title="Saved notes"
                  items={classNotes.slice(0, 6).map((note) => `${note.courseName}: ${note.title} (${note.noteType.replace("_", " ")})`)}
                />
              ) : null}
              <div className="notebooklm-bridge">
                <div>
                  <strong>NotebookLM handoff</strong>
                  <span>Package the current question, assignments, class notes, and Advisor output as one source.</span>
                </div>
                <div className="packet-actions">
                  <button className="ghost-button" type="button" onClick={createNotebookLmPacket}>
                    Create source packet
                  </button>
                  <button className="ghost-button" type="button" onClick={copyNotebookLmPacket} disabled={!notebookPacket}>
                    Copy packet
                  </button>
                  <a className="application-link secondary" href="https://notebooklm.google.com/" target="_blank" rel="noreferrer">
                    Open NotebookLM <ExternalLink size={16} />
                  </a>
                </div>
                {notebookPacket ? <textarea readOnly value={notebookPacket} /> : null}
              </div>
            </div>
          </div>
        </section>

        <section className={`panel class-integration ${currentPage === "school" ? "" : "hidden-page"}`}>
          <div className="panel-header">
            <div>
              <p className="eyebrow">Academic standing</p>
              <h3>Progress, plan, and import tools</h3>
            </div>
            <span className="progress-pill">{academicStanding.gpaLabel} {academicStanding.gpa}</span>
          </div>
          <div className="completed-course-history">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Completed coursework</p>
                <h4>GPA and prior course history</h4>
              </div>
            </div>
            <div className="academic-snapshot wide">
              <div>
                <span>Completed courses</span>
                <strong>{completedCourseCount}</strong>
              </div>
              <div>
                <span>Current registered</span>
                <strong>{registeredCourseCount}</strong>
              </div>
              <div>
                <span>Remaining after current term</span>
                <strong>{coursesLeftAfterCurrentTerm}</strong>
              </div>
              <div>
                <span>Known program courses</span>
                <strong>{totalKnownProgramCourses}</strong>
              </div>
            </div>
            <div className="schedule-table completed-table">
              {academicStanding.completedCourses.map((course) => (
                <article key={`completed-${course.code}`}>
                  <strong>{course.code}</strong>
                  <span>{course.title}</span>
                  <span>{course.area}</span>
                  <em>Source: {course.source}</em>
                </article>
              ))}
            </div>
          </div>
          <div className="academic-plan">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Planner</p>
                <h4>Academic plan from Navigate360</h4>
              </div>
              <span className="progress-pill">
                {navigateAcademicPlan.reduce((total, term) => total + term.credits, 0)} planned credits
              </span>
            </div>
            <div className="plan-grid">
              {navigateAcademicPlan.map((term) => (
                <article key={term.term}>
                  <div>
                    <strong>{term.term}</strong>
                    <span>Starts {term.starts} · {term.credits} credits</span>
                  </div>
                  <ul>
                    {term.courses.map((course) => (
                      <li key={`${term.term}-${course}`}>{course}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
          <div className="navigate-action-center">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Checklist and alerts</p>
                <h4>Navigate360 action center</h4>
              </div>
              <span className="progress-pill">
                {navigateTasks.filter((task) => task.priority === "High").length} high priority
              </span>
            </div>
            <div className="task-grid">
              {navigateTasks.map((task) => (
                <article className={`task-card ${task.priority.toLowerCase()}`} key={`${task.title}-${task.date}`}>
                  <span>{task.type}</span>
                  <strong>{task.title}</strong>
                  <p>{task.date}</p>
                </article>
              ))}
            </div>
          </div>
          <div className="navigate-resources">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Resources</p>
                <h4>Useful Navigate360 contacts and places</h4>
              </div>
            </div>
            <div className="resource-grid">
              {navigateResources.map((resource) => (
                <article key={`${resource.category}-${resource.name}`}>
                  <span>{resource.category}</span>
                  <strong>{resource.name}</strong>
                  <p>{resource.detail}</p>
                </article>
              ))}
            </div>
          </div>
          <div className="navigate-import">
            <div>
              <p className="eyebrow">Authorized Navigate360 import</p>
              <h4>Paste exported or visible Navigate360 text</h4>
              <p>
                Eric should log in himself, then paste schedule, appointment, task, or advising text here.
                This avoids storing credentials while still letting the dashboard parse useful items.
              </p>
            </div>
            <textarea
              value={navigateText}
              onChange={(event) => setNavigateText(event.target.value)}
              placeholder="Paste Navigate360 appointments, tasks, reminders, or advising notes..."
            />
            <button className="primary-button" type="button" onClick={importNavigateText}>
              <Save size={16} /> Import Navigate360 text
            </button>
            {navigateItems.length > 0 ? (
              <div className="navigate-results">
                {navigateItems.map((item) => (
                  <article key={`${item.title}-${item.detail}`}>
                    <strong>{item.title}</strong>
                    <span>{item.detail}</span>
                  </article>
                ))}
              </div>
            ) : null}
          </div>
          <div className="planner-card">
            <ShieldCheck size={18} />
            <span>
              LOCUS, Sakai, and Navigate360 are protected student systems. Eric should authorize access or paste/export records before they are stored.
            </span>
          </div>
        </section>
      </section>
    </main>
  );
}

function loadResumeProfile(): ResumeProfile {
  try {
    const storedProfile = window.localStorage.getItem("student-life.resume-profile");
    if (!storedProfile) {
      return defaultResumeProfile;
    }

    const parsedProfile = { ...defaultResumeProfile, ...JSON.parse(storedProfile) };
    return parsedProfile.fileName === "Sample resume profile" ? defaultResumeProfile : parsedProfile;
  } catch {
    return defaultResumeProfile;
  }
}

function loadBaselineResume(): BaselineResume {
  try {
    const storedBaseline = window.localStorage.getItem("student-life.baseline-resume");
    return storedBaseline ? { ...initialBaselineResume, ...JSON.parse(storedBaseline) } : initialBaselineResume;
  } catch {
    return initialBaselineResume;
  }
}

function loadJobSearchState(): JobSearchState {
  const emptyState: JobSearchState = {
    status: "idle",
    listings: [],
    checkedAt: "",
    query: "",
    providerStatus: []
  };

  try {
    const storedSearch = window.localStorage.getItem("student-life.job-search");
    if (!storedSearch) {
      return emptyState;
    }

    const parsedSearch = JSON.parse(storedSearch);
    return {
      ...emptyState,
      ...parsedSearch,
      status: parsedSearch.listings?.length ? "success" : "idle",
      listings: Array.isArray(parsedSearch.listings) ? parsedSearch.listings : [],
      providerStatus: Array.isArray(parsedSearch.providerStatus) ? parsedSearch.providerStatus : []
    };
  } catch {
    return emptyState;
  }
}

function loadReminderSettings(): ReminderSettings {
  try {
    const storedSettings = window.localStorage.getItem("student-life.assignment-reminders");
    if (!storedSettings) {
      return defaultReminderSettings;
    }

    const parsedSettings = JSON.parse(storedSettings) as Partial<ReminderSettings>;
    return {
      ...defaultReminderSettings,
      ...parsedSettings,
      channels: {
        ...defaultReminderSettings.channels,
        ...(parsedSettings.channels || {})
      }
    };
  } catch {
    return defaultReminderSettings;
  }
}

function loadStudyPlanState(): StudyPlanState {
  try {
    const storedState = window.localStorage.getItem("student-life.study-plan");
    return storedState ? { ...defaultStudyPlanState, ...JSON.parse(storedState) } : defaultStudyPlanState;
  } catch {
    return defaultStudyPlanState;
  }
}

function loadApplicationList(): Application[] {
  try {
    const storedApplications = window.localStorage.getItem("student-life.applications");
    if (!storedApplications) {
      return initialApplications;
    }

    const parsedApplications = JSON.parse(storedApplications);
    return Array.isArray(parsedApplications) ? parsedApplications : initialApplications;
  } catch {
    return initialApplications;
  }
}

function createBaselineResume(profile: ResumeProfile): BaselineResume {
  return {
    ...initialBaselineResume,
    status: "Draft",
    updatedAt: "May 11, 2026",
    skills: profile.skills.length
      ? profile.skills.map((skill) => capitalizeWords(skill))
      : initialBaselineResume.skills
  };
}

function parseNavigate360Text(text: string): NavigateItem[] {
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 6)
    .slice(0, 25)
    .map((line) => {
      const [title, ...rest] = line.split(/[:|-]/);
      return {
        title: title.trim() || "Navigate360 item",
        detail: rest.join(" - ").trim() || line,
        source: "Navigate360" as const
      };
    });
}

async function extractPdfText(file: File) {
  const data = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const pages = await Promise.all(
    Array.from({ length: pdf.numPages }, async (_, index) => {
      const page = await pdf.getPage(index + 1);
      const content = await page.getTextContent();
      return content.items.map((item) => ("str" in item ? item.str : "")).join(" ");
    })
  );

  return pages.join("\n");
}

function parseResume(text: string, fileName: string, keywords: string[]): ResumeProfile {
  const normalizedText = text.toLowerCase();
  const skills = skillDictionary.filter((skill) => normalizedText.includes(skill));
  const experience = experienceDictionary.filter((signal) => normalizedText.includes(signal));
  const major = majorDictionary.find((field) => normalizedText.includes(field)) || "";

  return {
    fileName,
    text,
    skills,
    experience,
    major,
    keywords
  };
}

function capitalizeWords(value: string) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function normalizeTerms(value: string) {
  return value
    .split(/[,;\n]/)
    .map((term) => term.trim().toLowerCase())
    .filter(Boolean);
}

function getMatchedListings(profile: ResumeProfile, sourceListings: Listing[] = listings): MatchedListing[] {
  const profileTerms = [
    ...profile.skills,
    ...profile.experience,
    ...profile.keywords,
    profile.major
  ].filter(Boolean);

  return sourceListings
    .map((listing) => {
      const listingTerms = [
        ...listing.skills,
        ...listing.experienceSignals,
        ...listing.majors,
        listing.company.toLowerCase(),
        listing.role.toLowerCase(),
        listing.location.toLowerCase(),
        listing.sourceDescription.toLowerCase()
      ];
      const matchedTerms = Array.from(
        new Set(
          profileTerms.filter((term) =>
            listingTerms.some((listingTerm) => listingTerm.includes(term) || term.includes(listingTerm))
          )
        )
      );

      return {
        ...listing,
        matchCount: matchedTerms.length,
        matchedTerms,
        fit: Math.min(98, 54 + matchedTerms.length * 7)
      };
    })
    .filter((listing) => listing.matchCount >= 2)
    .sort((a, b) => b.matchCount - a.matchCount || b.fit - a.fit)
    .slice(0, 500);
}

function createApplicationPacket(
  listing: MatchedListing,
  baseline: BaselineResume,
  aiResult?: {
    aiStatus?: "ok" | "missing_key" | "fallback" | "error";
    generatedBy?: string;
    model?: string;
    aiMessage?: string;
    packet?: Partial<Pick<ApplicationPacket, "resumeFocus" | "coverNote" | "talkingPoints" | "commonAnswers" | "reviewWarnings" | "fitSummary">>;
  }
): ApplicationPacket {
  const matchedTerms = listing.matchedTerms.slice(0, 5);
  const resumeFocus = matchedTerms.length > 0
    ? matchedTerms.map((term) => `Emphasize ${term} in the role summary and bullets.`)
    : ["Emphasize finance analysis, Excel, communication, and investment research experience."];
  const strongestExperience = baseline.experience.slice(0, 3).map((experience) => experience.role);
  const talkingPoints = [
    `${baseline.name}'s ${baseline.education[0]} aligns with ${listing.role}.`,
    `Connect ${strongestExperience.join(", ")} to ${listing.company}'s internship needs.`,
    `Use the ${listing.fit}% match score to explain why this role belongs in the priority pipeline.`
  ];
  const commonAnswers = [
    `Why this company: reference ${listing.company}'s role description and Eric's finance, markets, and analytical background.`,
    "Availability: confirm semester workload, interview windows, and start-date flexibility before submission.",
    "Work authorization: answer only with Eric's reviewed and approved wording."
  ];

  const fallbackPacket = {
    listing,
    resumeFocus,
    talkingPoints,
    commonAnswers,
    coverNote: `I am interested in the ${listing.role} opportunity at ${listing.company}. My finance coursework, investment research work, and experience with ${matchedTerms.slice(0, 3).join(", ") || "financial analysis"} position me to contribute quickly while continuing to grow through a rigorous internship experience.`,
    reviewWarnings: [
      "Student approval required before submitting anything.",
      "Verify the application link and company career page before applying."
    ],
    fitSummary: `${listing.company} matches Eric through ${matchedTerms.slice(0, 4).join(", ") || "finance internship signals"}.`
  };
  const packet = aiResult?.packet || {};

  return {
    listing,
    resumeFocus: Array.isArray(packet.resumeFocus) ? packet.resumeFocus : fallbackPacket.resumeFocus,
    talkingPoints: Array.isArray(packet.talkingPoints) ? packet.talkingPoints : fallbackPacket.talkingPoints,
    commonAnswers: Array.isArray(packet.commonAnswers) ? packet.commonAnswers : fallbackPacket.commonAnswers,
    reviewWarnings: Array.isArray(packet.reviewWarnings) ? packet.reviewWarnings : fallbackPacket.reviewWarnings,
    fitSummary: typeof packet.fitSummary === "string" ? packet.fitSummary : fallbackPacket.fitSummary,
    coverNote: typeof packet.coverNote === "string" ? packet.coverNote : fallbackPacket.coverNote,
    generatedBy: aiResult?.generatedBy || "Template fallback",
    model: aiResult?.model || "deepseek-v4-flash",
    aiStatus: aiResult?.aiStatus || "missing_key",
    aiMessage: aiResult?.aiMessage || "Add DEEPSEEK_API_KEY to enable live AI generation."
  };
}

function formatCheckedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  );
}

function SocialItem({
  icon,
  label,
  value
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <article className="social-item">
      <div>{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function AdvisorList({ title, items }: { title: string; items?: string[] }) {
  if (!items?.length) return null;

  return (
    <div className="advisor-section">
      <strong>{title}</strong>
      <ul>
        {items.map((item) => (
          <li key={`${title}-${item}`}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function formatNotebookSection(title: string, items?: string[]) {
  if (!items?.length) return "";
  return [`### ${title}`, ...items.map((item) => `- ${item}`)].join("\n");
}

function parseAssignmentDueDate(assignment: AssignmentTask) {
  if (!assignment.dueAt) return null;
  const dueDate = new Date(assignment.dueAt);
  return Number.isNaN(dueDate.getTime()) ? null : dueDate;
}

function getDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getUpcomingAssignments(assignments: AssignmentTask[]) {
  const now = new Date();
  return assignments
    .filter((assignment) => assignment.status !== "done" && assignment.status !== "archived")
    .map((assignment) => ({ assignment, dueDate: parseAssignmentDueDate(assignment) }))
    .filter((entry): entry is { assignment: AssignmentTask; dueDate: Date } => entry.dueDate !== null && entry.dueDate >= now)
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
    .map((entry) => entry.assignment);
}

function getUpcomingCalendarEntries(entries: CalendarEntry[]) {
  const now = new Date();
  return entries
    .map((entry) => ({ entry, startDate: parseCalendarEntryDate(entry.startsAt) }))
    .filter((item): item is { entry: CalendarEntry; startDate: Date } => item.startDate !== null && item.startDate >= now)
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
    .map((item) => ({
      ...item.entry,
      googleEventUrl: item.entry.googleEventUrl || buildGoogleCalendarUrl(item.entry)
    }));
}

function getApprovedStudyBlocks(entries: CalendarEntry[]) {
  return getUpcomingCalendarEntries(entries).filter((entry) => entry.source === "advisor_study_plan");
}

function getStudyPlanSignature(assignments: AssignmentTask[]) {
  return assignments
    .filter((assignment) => assignment.status !== "done" && assignment.status !== "archived")
    .map((assignment) => [
      assignment.id || assignment.title,
      assignment.courseName,
      assignment.dueAt,
      assignment.status,
      assignment.updatedAt || "",
      assignment.assignedPages || ""
    ].join("|"))
    .sort()
    .join("::");
}

function buildStudyPlanEntries(assignments: AssignmentTask[], advisorResult: AdvisorResult | null, courses: Lesson[]): CalendarEntry[] {
  const openAssignments = getUpcomingAssignments(assignments).slice(0, 8);
  const aiBlocks = advisorResult?.studyPlanBlocks || [];

  if (!aiBlocks.length) return [];

  return aiBlocks.flatMap((block, blockIndex) => {
    const assignment = findAssignmentForStudyBlock(block, openAssignments);
    if (!assignment) return [];
    const dueDate = parseAssignmentDueDate(assignment);
    if (!dueDate) return [];

    const daysBeforeDue = clampNumber(block.daysBeforeDue, 0, 14, assignment.priority === "high" ? 2 : 1);
    const durationMinutes = clampNumber(block.durationMinutes, 30, 180, 75);
    const startsAt = new Date(dueDate);
    startsAt.setDate(dueDate.getDate() - daysBeforeDue);
    const preferredTime = parsePreferredStudyTime(block.preferredStartTime, blockIndex);
    startsAt.setHours(preferredTime.hours, preferredTime.minutes, 0, 0);
    const endsAt = new Date(startsAt.getTime() + durationMinutes * 60 * 1000);
    const title = `${assignment.courseName}: ${block.title || block.focus || "AI study block"} - ${assignment.title}`;
    const notes = [
      "Approved AI-generated advisor study plan.",
      block.focus,
      formatAssignmentReading(assignment, courses),
      assignment.details
    ].filter(Boolean).join("\n\n");

    const entry: CalendarEntry = {
      assignmentId: assignment.id,
      title,
      courseName: assignment.courseName,
      startsAt: toDateTimeLocalValue(startsAt),
      endsAt: toDateTimeLocalValue(endsAt),
      location: "AI study plan",
      notes,
      eventType: "study_block",
      source: "advisor_study_plan"
    };

    return {
      ...entry,
      googleEventUrl: buildGoogleCalendarUrl(entry)
    };
  });
}

function findAssignmentForStudyBlock(block: StudyPlanBlock, assignments: AssignmentTask[]) {
  const courseName = (block.courseName || "").toLowerCase();
  const assignmentTitle = (block.assignmentTitle || block.title || "").toLowerCase();

  return assignments.find((assignment) =>
    (courseName && assignment.courseName.toLowerCase().includes(courseName))
    || (assignmentTitle && assignment.title.toLowerCase().includes(assignmentTitle))
  ) || assignments[0];
}

function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  const numberValue = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(numberValue)) return fallback;
  return Math.min(max, Math.max(min, Math.round(numberValue)));
}

function parsePreferredStudyTime(value: string | undefined, index: number) {
  const match = value?.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (!match) return { hours: index % 2 === 0 ? 18 : 19, minutes: 0 };
  let hours = Number(match[1]);
  const minutes = Number(match[2] || 0);
  const meridiem = match[3]?.toLowerCase();
  if (meridiem === "pm" && hours < 12) hours += 12;
  if (meridiem === "am" && hours === 12) hours = 0;
  return { hours: Math.min(23, Math.max(6, hours)), minutes: Math.min(59, Math.max(0, minutes)) };
}

function getAssignmentFreshness(assignments: AssignmentTask[], lastCheckedAt?: string) {
  const timestamps = [
    ...assignments.map((assignment) => assignment.updatedAt || assignment.createdAt || assignment.dueAt).filter(Boolean),
    lastCheckedAt || ""
  ].filter(Boolean);
  const latestTimestamp = timestamps
    .map((timestamp) => new Date(timestamp).getTime())
    .filter((time) => !Number.isNaN(time))
    .sort((a, b) => b - a)[0];

  if (!latestTimestamp) {
    return {
      isStale: true,
      label: "Assignment data needed",
      detail: "No assignment entries have been saved yet. Ask Eric to enter current coursework, readings, and due dates."
    };
  }

  const daysOld = Math.floor((Date.now() - latestTimestamp) / 86400000);
  if (daysOld >= 3) {
    return {
      isStale: true,
      label: `${daysOld} days since update`,
      detail: "Ask Eric to confirm whether new assignments, readings, or exam dates were announced."
    };
  }

  return {
    isStale: false,
    label: daysOld === 0 ? "Updated today" : `Updated ${daysOld} day${daysOld === 1 ? "" : "s"} ago`,
    detail: "Calendar data is fresh enough for dashboard planning."
  };
}

function formatReminderChannels(settings: ReminderSettings) {
  return [
    settings.channels.email && settings.email ? `email ${settings.email}` : "",
    settings.channels.sms && settings.phone ? `SMS ${settings.phone}` : "",
    settings.channels.push ? "browser push" : ""
  ].filter(Boolean).join(", ");
}

function buildDueCalendar(monthDate: Date, assignments: AssignmentTask[], events: CalendarEntry[]): CalendarDueDay[] {
  const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const gridStart = new Date(monthStart);
  gridStart.setDate(monthStart.getDate() - monthStart.getDay());

  const assignmentsByDate = assignments.reduce<Record<string, AssignmentTask[]>>((grouped, assignment) => {
    if (assignment.status === "done" || assignment.status === "archived") return grouped;
    const dueDate = parseAssignmentDueDate(assignment);
    if (!dueDate) return grouped;
    const key = getDateKey(dueDate);
    grouped[key] = [...(grouped[key] || []), assignment];
    return grouped;
  }, {});

  const eventsByDate = events.reduce<Record<string, CalendarEntry[]>>((grouped, entry) => {
    const startDate = parseCalendarEntryDate(entry.startsAt);
    if (!startDate) return grouped;
    const key = getDateKey(startDate);
    grouped[key] = [...(grouped[key] || []), entry];
    return grouped;
  }, {});

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    const dateKey = getDateKey(date);
    return {
      date,
      dateKey,
      inMonth: date.getMonth() === monthDate.getMonth(),
      assignments: assignmentsByDate[dateKey] || [],
      events: eventsByDate[dateKey] || []
    };
  });
}

function parseCalendarEntryDate(value: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatCalendarEntryTime(entry: CalendarEntry) {
  const startsAt = parseCalendarEntryDate(entry.startsAt);
  if (!startsAt) return "Time TBD";
  const endsAt = parseCalendarEntryDate(entry.endsAt);
  const startLabel = startsAt.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
  if (!endsAt || endsAt.getTime() === startsAt.getTime()) return startLabel;
  return `${startLabel} - ${endsAt.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`;
}

function buildGoogleCalendarUrl(entry: Pick<CalendarEntry, "title" | "startsAt" | "endsAt" | "location" | "notes" | "courseName">) {
  if (!entry.title || !entry.startsAt) return "";
  const startsAt = parseCalendarEntryDate(entry.startsAt);
  if (!startsAt) return "";
  const endsAt = parseCalendarEntryDate(entry.endsAt) || new Date(startsAt.getTime() + 60 * 60 * 1000);
  const formatGoogleDate = (date: Date) => date.toISOString().replace(/[-:]|\.\d{3}/g, "");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: entry.title,
    dates: `${formatGoogleDate(startsAt)}/${formatGoogleDate(endsAt)}`,
    details: [entry.courseName ? `Course: ${entry.courseName}` : "", entry.notes || ""].filter(Boolean).join("\n\n"),
    location: entry.location || ""
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function toDateTimeLocalValue(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatStudyPlanApprovedAt(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatAssignmentDue(assignment: AssignmentTask) {
  const dueDate = parseAssignmentDueDate(assignment);
  if (!dueDate) return "No due date";
  return dueDate.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function formatAssignmentDueDay(assignment: AssignmentTask) {
  const dueDate = parseAssignmentDueDate(assignment);
  if (!dueDate) return "TBD";
  return dueDate.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatAssignmentDueTime(assignment: AssignmentTask) {
  const dueDate = parseAssignmentDueDate(assignment);
  if (!dueDate) return "";
  return dueDate.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function getCourseTextbook(courseName: string, courses: Lesson[]) {
  return courses.find((course) => course.course === courseName)?.textbook || "";
}

function getSemesterCourseOptions(courses: Lesson[], plan: AcademicPlanTerm[]): Lesson[] {
  return courses.length ? courses : getNextPlannedTermCourses(plan);
}

function getActiveTermLabel(courses: Lesson[], plan: AcademicPlanTerm[]) {
  const options = getSemesterCourseOptions(courses, plan);
  return options[0]?.term ? `${options[0].term} courses` : "Current semester";
}

function getNextPlannedTermCourses(plan: AcademicPlanTerm[]): Lesson[] {
  const now = new Date();
  const sortedTerms = [...plan].sort((a, b) => new Date(a.starts).getTime() - new Date(b.starts).getTime());
  const activeOrNextTerm = sortedTerms.find((term) => {
    const startsAt = new Date(term.starts);
    const endsAt = new Date(startsAt);
    endsAt.setDate(startsAt.getDate() + 120);
    return now <= endsAt;
  }) || sortedTerms[sortedTerms.length - 1];

  if (!activeOrNextTerm) return initialCourses;

  return activeOrNextTerm.courses.map((course, index) => ({
    course: course.replace(" - ", ": "),
    time: activeOrNextTerm.starts ? `Starts ${activeOrNextTerm.starts}` : "Time TBD",
    task: `${activeOrNextTerm.term} · planned from Navigate360`,
    intensity: index < 2 ? "High" : "Medium",
    professor: "",
    location: "",
    textbook: "",
    term: activeOrNextTerm.term
  } satisfies Lesson));
}

function formatAssignmentReading(assignment: AssignmentTask, courses: Lesson[]) {
  const textbook = assignment.textbook || getCourseTextbook(assignment.courseName, courses);
  const reading = [
    textbook ? `Textbook: ${textbook}` : "",
    assignment.assignedPages ? `Pages: ${assignment.assignedPages}` : ""
  ].filter(Boolean);

  return reading.join(" · ");
}

function ResumeDocument({ resume }: { resume: BaselineResume }) {
  return (
    <article className="baseline-document">
      <header>
        <h4>{resume.name}</h4>
        <p>{resume.contact}</p>
      </header>

      <section>
        <h5>Education</h5>
        {resume.education.map((item) => (
          <p key={item}>{item}</p>
        ))}
      </section>

      <section>
        <h5>Professional Experience</h5>
        {resume.experience.map((role) => (
          <div className="resume-role" key={`${role.company}-${role.role}`}>
            <div>
              <strong>{role.company}</strong>
              <span>{role.location} · {role.dates}</span>
            </div>
            <em>{role.role}</em>
            <ul>
              {role.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section>
        <h5>Activities & Involvement</h5>
        {resume.activities.map((activity) => (
          <div className="resume-role" key={activity.name}>
            <strong>{activity.name}</strong>
            <em>{activity.role}</em>
            <ul>
              {activity.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section>
        <h5>Skills</h5>
        <p>{resume.skills.join(", ")}</p>
      </section>
    </article>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
