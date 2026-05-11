import React, { useEffect, useState } from "react";
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
  company: string;
  role: string;
  status: "Applied" | "Interview" | "Drafting" | "Follow-up" | "Offer prep";
  next: string;
  fit: number;
};

type Lesson = {
  course: string;
  time: string;
  task: string;
  intensity: "Low" | "Medium" | "High";
  professor?: string;
  location?: string;
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
  sourceBoard: "LinkedIn" | "Handshake" | "Indeed" | "Company Careers";
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

type Page =
  | "dashboard"
  | "available-listings"
  | "applications"
  | "school"
  | "agents"
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

const applications: Application[] = [
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
    location: "School of Communication 014"
  },
  {
    course: "ENGL 210: Business Writing",
    time: "Thu 7:00 PM - 9:30 PM",
    task: "Section 02W · Writing Intensive",
    intensity: "Medium",
    location: "Corboy Law Center 0426"
  },
  {
    course: "FINC 334: Principles of Corporate Finance",
    time: "Tue | Thu 10:00 AM - 11:15 AM",
    task: "Section 101 · Registered",
    intensity: "High",
    location: "Corboy Law Center 0206"
  },
  {
    course: "INFS 343: Business Analytics",
    time: "Tue 4:15 PM - 6:45 PM",
    task: "Section 105 · Registered",
    intensity: "Medium",
    location: "Schreiber Center 302"
  },
  {
    course: "INFS 347: Systems Analysis & Design",
    time: "Tue | Thu 8:30 AM - 9:45 AM",
    task: "Section 10E · Engaged Learning · Undergraduate Research",
    intensity: "Medium",
    location: "Schreiber Center 405"
  },
  {
    course: "THEO 231: Hebrew Bible/Old Testament",
    time: "Tue | Thu 1:00 PM - 2:15 PM",
    task: "Section 001 · Tier 2 Theological Knowledge",
    intensity: "Low",
    location: "Corboy Law Center L08"
  }
];

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

const pageTitles: Record<Page, string> = {
  dashboard: "Eric’s Dashboard",
  "available-listings": "Available Listings",
  applications: "Applications",
  school: "School",
  agents: "Agents",
  social: "Network",
  resume: "Resume"
};

function getPageFromHash(): Page {
  const page = window.location.hash.replace("#", "") as Page;
  return pageTitles[page] ? page : "dashboard";
}

function App() {
  const [currentPage, setCurrentPage] = useState<Page>(() => getPageFromHash());
  const [courseList, setCourseList] = useState<Lesson[]>(initialCourses);
  const [courseForm, setCourseForm] = useState<Lesson>({
    course: "",
    time: "",
    task: "",
    intensity: "Medium",
    professor: "",
    location: ""
  });
  const [resumeProfile, setResumeProfile] = useState<ResumeProfile>(() => loadResumeProfile());
  const [baselineResume, setBaselineResume] = useState<BaselineResume>(() => loadBaselineResume());
  const [keywordInput, setKeywordInput] = useState("Chicago, internship");
  const [navigateText, setNavigateText] = useState("");
  const [navigateItems, setNavigateItems] = useState<NavigateItem[]>([]);

  const highPriorityCourses = courseList.filter((course) => course.intensity === "High").length;
  const weeklyProgress = Math.min(96, 42 + courseList.length * 9);
  const matchedListings = getMatchedListings(resumeProfile);
  const strongestMatch = matchedListings[0];
  const highPriorityTasks = navigateTasks.filter((task) => task.priority === "High");
  const nextClass = courseList[0];
  const savedSignalCount = resumeProfile.skills.length + resumeProfile.experience.length + resumeProfile.keywords.length;
  const registeredCourseCount = courseList.length;
  const plannedCourseCount = navigateAcademicPlan.reduce((total, term) => total + term.courses.length, 0);
  const coursesLeftAfterCurrentTerm = Math.max(0, plannedCourseCount - registeredCourseCount);

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

  function addCourse(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!courseForm.course.trim() || !courseForm.time.trim()) {
      return;
    }

    setCourseList((currentCourses) => [
      ...currentCourses,
      {
        ...courseForm,
        task: courseForm.task.trim() || "No assignment added yet"
      }
    ]);

    setCourseForm({
      course: "",
      time: "",
      task: "",
      intensity: "Medium",
      professor: "",
      location: ""
    });
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
    setResumeProfile(parsed);
    setBaselineResume(createBaselineResume(parsed));
  }

  function saveKeywords() {
    const keywords = normalizeTerms(keywordInput);
    setResumeProfile((currentProfile) => ({
      ...currentProfile,
      keywords
    }));
  }

  function importNavigateText() {
    setNavigateItems(parseNavigate360Text(navigateText));
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
          <a className={currentPage === "agents" ? "active" : ""} href="#agents">
            <Bot size={18} /> <span>Agents</span>
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

        <section className={`hero-panel dashboard-hero ${currentPage === "dashboard" ? "" : "hidden-page"}`} id="dashboard">
          <div>
              <p className="eyebrow">Eric Onyango profile</p>
            <h2>
              {resumeProfile.major
                ? `${capitalizeWords(resumeProfile.major)} resume is driving every internship recommendation.`
                : "Upload the student resume to drive every internship recommendation."}
            </h2>
            <p>
              Eric’s BBA Finance profile, accounting and information systems minors, capital
              markets experience, and investment research signals drive every listing and task.
            </p>
          </div>
          <div className="briefing-stack">
            <div>
              <Sparkles size={18} />
              <span>Top resume match</span>
              <strong>{strongestMatch ? `${strongestMatch.company}: ${strongestMatch.role}` : "No role matched yet"}</strong>
            </div>
            <div>
              <Clock3 size={18} />
              <span>Finance focus</span>
              <strong>At least 2 resume correlations per listing</strong>
            </div>
          </div>
        </section>

        <section className={`dashboard-command ${currentPage === "dashboard" ? "" : "hidden-page"}`} aria-label="Eric dashboard command center">
          <article className="command-primary">
            <p className="eyebrow">Today’s focus</p>
            <h3>Keep finance recruiting, Fall registration, and Navigate360 tasks moving together.</h3>
            <p>
              Best next move: schedule Career Services and Academic Advisor appointments, then use the
              approved baseline resume to prepare applications for the strongest finance matches.
            </p>
            <div className="command-strip">
              <span>{baselineResume.status} baseline</span>
              <span>{matchedListings.length} matched listings</span>
              <span>{highPriorityTasks.length} high-priority tasks</span>
            </div>
          </article>

          <article className="command-card">
            <span>Top application target</span>
            <strong>{strongestMatch ? strongestMatch.role : "No match yet"}</strong>
            <p>{strongestMatch ? `${strongestMatch.company} · ${strongestMatch.fit}% resume match` : "Upload or approve a baseline resume."}</p>
          </article>

          <article className="command-card">
            <span>Next class signal</span>
            <strong>{nextClass.course}</strong>
            <p>{nextClass.time} · {nextClass.location}</p>
          </article>

          <article className="command-card alert">
            <span>Navigate360 action</span>
            <strong>{highPriorityTasks[0]?.title ?? "No urgent task"}</strong>
            <p>{highPriorityTasks[0]?.date ?? "All clear"}</p>
          </article>
        </section>

        <section className={`metric-grid compact-metrics ${currentPage === "dashboard" ? "" : "hidden-page"}`} aria-label="Student life metrics">
          <Metric label="Resume skills" value={String(resumeProfile.skills.length)} detail="Saved from upload" />
          <Metric label="Matched listings" value={String(matchedListings.length)} detail="500 result cap" />
          <Metric label="Baseline resume" value={baselineResume.status} detail="Student approval required" />
          <Metric label="Profile signals" value={String(savedSignalCount)} detail="Skills + experience + keywords" />
          <Metric label="Navigate tasks" value={String(navigateTasks.length)} detail="Checklist + alerts" />
          <Metric
            label="Courses tracked"
            value={String(courseList.length)}
            detail={`${highPriorityCourses} high priority`}
          />
          <Metric
            label="Courses left"
            value={String(coursesLeftAfterCurrentTerm)}
            detail={`${plannedCourseCount} planned total`}
          />
        </section>

        <section className={`dashboard-overview-grid ${currentPage === "dashboard" ? "" : "hidden-page"}`}>
          <article className="overview-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Recruiting</p>
                <h3>Priority pipeline</h3>
              </div>
              <a className="text-link" href="#available-listings">Available listings</a>
            </div>
            <div className="mini-list">
              {applications.slice(0, 3).map((application) => (
                <div key={`overview-${application.company}`}>
                  <strong>{application.company}</strong>
                  <span>{application.role}</span>
                  <em>{application.next}</em>
                </div>
              ))}
            </div>
          </article>

          <article className="overview-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">School</p>
                <h3>Fall 2026 schedule</h3>
              </div>
              <a className="text-link" href="#school">Edit courses</a>
            </div>
            <div className="mini-list">
              {courseList.slice(0, 4).map((course) => (
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
              <span className="progress-pill">{navigateTasks.length} items</span>
            </div>
            <div className="mini-list">
              {navigateTasks.slice(0, 4).map((task) => (
                <div key={`overview-${task.title}`}>
                  <strong>{task.title}</strong>
                  <span>{task.type} · {task.priority}</span>
                  <em>{task.date}</em>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className={`panel resume-intake ${currentPage === "resume" ? "" : "hidden-page"}`} id="resume">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Resume workspace</p>
              <h3>Eric’s current and baseline resumes</h3>
            </div>
            <span className="progress-pill">{resumeProfile.skills.length} saved skills</span>
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
                  onClick={() =>
                    setBaselineResume((currentBaseline) => ({
                      ...currentBaseline,
                      status: "Approved",
                      updatedAt: "May 11, 2026"
                    }))
                  }
                >
                  <CheckCircle2 size={16} /> Approve baseline
                </button>
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() => setBaselineResume(createBaselineResume(resumeProfile))}
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
            <span className="progress-pill">{matchedListings.length} of 500 max</span>
          </div>
          <div className="verification-note">
            <CheckCircle2 size={18} />
            <span>
              Listings appear only when at least two resume skills, experience points, major terms,
              or saved keywords correlate with the role. The list is capped at 500.
            </span>
          </div>
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
                <a className="application-link" href={listing.applicationLink} target="_blank" rel="noreferrer">
                  Prepare application <ExternalLink size={16} />
                </a>
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
          <div className="panel-header">
            <div>
              <p className="eyebrow">Pipeline</p>
              <h3>Eric’s internship applications</h3>
            </div>
            <button className="ghost-button">New application</button>
          </div>
          <div className="application-list">
            {applications.map((application) => (
              <article className="application-row" key={`${application.company}-${application.role}`}>
                <div>
                  <strong>{application.company}</strong>
                  <span>{application.role}</span>
                </div>
                <span className={`status ${statusClass[application.status]}`}>
                  {application.status}
                </span>
                <div className="fit-score" aria-label={`${application.fit}% fit`}>
                  <span style={{ width: `${application.fit}%` }} />
                </div>
                <p>{application.next}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={`two-column ${currentPage === "school" ? "" : "hidden-page"}`}>
          <div className="panel dashboard-courses">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Quinlan courses</p>
                <h3>Finance coursework</h3>
              </div>
              <span className="progress-pill">{weeklyProgress}% planned</span>
            </div>
            <div className="lesson-list">
              {courseList.map((lesson) => (
                <article className="lesson-row" key={`dashboard-${lesson.course}`}>
                  <div className={`lesson-dot ${lesson.intensity.toLowerCase()}`} />
                  <div>
                    <strong>{lesson.course}</strong>
                    <span>{lesson.time} · {lesson.task}</span>
                  </div>
                </article>
              ))}
            </div>
            <div className="planner-card">
              <CheckCircle2 size={18} />
              <span>Courses added in School appear here immediately.</span>
            </div>
          </div>
        </section>

        <section className={`panel school-editor ${currentPage === "school" ? "" : "hidden-page"}`} id="school">
          <div className="panel-header">
            <div>
              <p className="eyebrow">School</p>
              <h3>Eric’s course planner</h3>
            </div>
            <span className="progress-pill">{courseList.length} courses</span>
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
            {courseList.map((lesson) => (
              <article className="lesson-row" key={`school-${lesson.course}`}>
                <div className={`lesson-dot ${lesson.intensity.toLowerCase()}`} />
                <div>
                  <strong>{lesson.course}</strong>
                  <span>
                    {lesson.time} · {lesson.task}
                    {lesson.professor ? ` · ${lesson.professor}` : ""}
                    {lesson.location ? ` · ${lesson.location}` : ""}
                  </span>
                </div>
                <button
                  className="delete-button"
                  title={`Remove ${lesson.course}`}
                  onClick={() =>
                    setCourseList((currentCourses) =>
                      currentCourses.filter((course) => course.course !== lesson.course)
                    )
                  }
                >
                  <Trash2 size={16} />
                </button>
              </article>
            ))}
          </div>
          <div className="planner-card">
            <BookOpen size={18} />
            <span>Use this section to maintain the school schedule that feeds the Dashboard.</span>
          </div>
        </section>

        <section className={`three-column ${currentPage === "agents" || currentPage === "social" ? "" : "hidden-page"}`}>
          <div className={`panel ${currentPage === "agents" ? "" : "hidden-page"}`} id="agents">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Autopilot</p>
                <h3>Eric’s agents</h3>
              </div>
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
          </div>
        </section>

        <section className={`panel class-integration ${currentPage === "school" ? "" : "hidden-page"}`}>
          <div className="panel-header">
            <div>
              <p className="eyebrow">Registered classes</p>
              <h3>LOCUS, Sakai, and Navigate360 connection</h3>
            </div>
            <span className="progress-pill">Authorization needed</span>
          </div>
          <div className="integration-grid">
            <article>
              <strong>LOCUS schedule</strong>
              <span>Authoritative source for Eric’s registered semester classes.</span>
            </article>
            <article>
              <strong>Sakai course sites</strong>
              <span>LMS source for assignments, syllabi, announcements, and course materials.</span>
            </article>
            <article>
              <strong>Fallback import</strong>
              <span>Eric can upload/export his class schedule while direct access is being configured.</span>
            </article>
            <article>
              <strong>Navigate360</strong>
              <span>Authorized session used to extract Fall 2026 schedule and academic plan terms.</span>
            </article>
          </div>
          <div className="navigate-schedule">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Navigate360 extract</p>
                <h4>Fall 2026 registered classes</h4>
              </div>
              <span className="progress-pill">6 courses</span>
            </div>
            <div className="schedule-table">
              {courseList.map((course) => (
                <article key={`nav-${course.course}`}>
                  <strong>{course.course}</strong>
                  <span>{course.time}</span>
                  <span>{course.location}</span>
                  <em>{course.task}</em>
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
              Because registration and advising records are protected student data, Eric should authorize access.
              We can use official export/API options first, then automate sync where allowed.
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

function getMatchedListings(profile: ResumeProfile): MatchedListing[] {
  const profileTerms = [
    ...profile.skills,
    ...profile.experience,
    ...profile.keywords,
    profile.major
  ].filter(Boolean);

  return listings
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
