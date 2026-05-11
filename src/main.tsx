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
  headline: string;
  summary: string;
  bullets: string[];
};

type MatchedListing = Listing & {
  matchCount: number;
  matchedTerms: string[];
  fit: number;
};

const defaultResumeProfile: ResumeProfile = {
  fileName: "Eric Onyango Resume.pdf",
  text:
    "Eric Onyango is a Loyola University Chicago Quinlan School of Business student pursuing a BBA in Finance with minors in Accounting, Information Systems, and Environmental Economics and Sustainability. Skills include Excel, PowerPoint, SQL, Refinitiv Eikon, Grata, valuation, financial modeling, capital markets, treasury, investment research, private placement, M&A, due diligence, market mapping, and financial statements. Experience includes Incoming Finance Intern on Exelon Business Services Treasury and Capital Markets Team, Renewable Advisors Winter Analyst, Project Destined Real Estate Private Equity Intern, Hevesta Capital Search Fund Intern, Rambler Investment Fund analyst, and NABA Treasurer.",
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
  headline: "Finance student focused on capital markets, valuation, and investment research",
  summary:
    "Loyola University Chicago BBA Finance student with accounting and information systems depth, hands-on investment research, private placement support, real estate private equity underwriting, search fund sourcing, and capital markets preparation.",
  bullets: [
    "Supported capital raising materials and investor presentation workstreams for sustainability-focused private placement mandates.",
    "Researched private placement and M&A transactions across climate, infrastructure, and energy transition sectors.",
    "Underwrote multifamily investments and analyzed ownership structures, valuation benchmarks, and acquisition leads.",
    "Evaluated public equities using valuation, catalysts, macro trends, filings, financial statements, cash flow models, and Refinitiv Eikon."
  ]
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
    course: "ECON 303: Intermediate Microeconomics",
    time: "9:30 AM",
    task: "Review market structure and elasticity notes",
    intensity: "High",
    professor: "Dr. Keller",
    location: "Schreiber Center"
  },
  {
    course: "ACCT 303: Intermediate Accounting I",
    time: "12:10 PM",
    task: "Practice financial statement adjustments",
    intensity: "Medium",
    professor: "Prof. Nair",
    location: "Cudahy Science Hall"
  },
  {
    course: "INFS 346: Database Systems",
    time: "2:45 PM",
    task: "SQL schema assignment",
    intensity: "Low",
    professor: "Prof. Alvarez",
    location: "Damen Student Center"
  },
  {
    course: "ISSCM 241: Business Statistics",
    time: "4:15 PM",
    task: "Regression and probability review",
    intensity: "Medium",
    professor: "Prof. Chen",
    location: "Quinlan School of Business"
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

function App() {
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

  const highPriorityCourses = courseList.filter((course) => course.intensity === "High").length;
  const weeklyProgress = Math.min(96, 42 + courseList.length * 9);
  const matchedListings = getMatchedListings(resumeProfile);
  const strongestMatch = matchedListings[0];
  const savedSignalCount = resumeProfile.skills.length + resumeProfile.experience.length + resumeProfile.keywords.length;

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
          <a className="active" href="#dashboard">
            <Target size={18} /> <span>Dashboard</span>
          </a>
          <a href="#available-listings">
            <Search size={18} /> <span>Available listings</span>
          </a>
          <a href="#applications">
            <BriefcaseBusiness size={18} /> <span>Applications</span>
          </a>
          <a href="#school">
            <CalendarDays size={18} /> <span>School</span>
          </a>
          <a href="#agents">
            <Bot size={18} /> <span>Agents</span>
          </a>
          <a href="#social">
            <Network size={18} /> <span>Network</span>
          </a>
          <a href="#resume">
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
            <h1>Eric’s Dashboard</h1>
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

        <section className="hero-panel" id="dashboard">
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

        <section className="metric-grid" aria-label="Student life metrics">
          <Metric label="Resume skills" value={String(resumeProfile.skills.length)} detail="Saved from upload" />
          <Metric label="Matched listings" value={String(matchedListings.length)} detail="500 result cap" />
          <Metric label="Baseline resume" value={baselineResume.status} detail="Student approval required" />
          <Metric label="Profile signals" value={String(savedSignalCount)} detail="Skills + experience + keywords" />
          <Metric
            label="Courses tracked"
            value={String(courseList.length)}
            detail={`${highPriorityCourses} high priority`}
          />
        </section>

        <section className="panel resume-intake" id="resume">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Resume inbox</p>
              <h3>Eric’s resume memory</h3>
            </div>
            <span className="progress-pill">{resumeProfile.skills.length} saved skills</span>
          </div>
          <div className="resume-grid">
            <label className="upload-box">
              <FileText size={22} />
              <strong>Upload Eric’s latest resume</strong>
              <span>Upload a PDF, text, or markdown resume.</span>
              <input type="file" accept=".pdf,.txt,.md,.text" onChange={handleResumeUpload} />
            </label>
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
            <div className="baseline-card">
              <div className="baseline-topline">
                <span>AI baseline resume</span>
                <strong className={baselineResume.status === "Approved" ? "approved" : ""}>
                  {baselineResume.status}
                </strong>
              </div>
              <h4>{baselineResume.headline}</h4>
              <p>{baselineResume.summary}</p>
              <ul>
                {baselineResume.bullets.slice(0, 4).map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
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

        <section className="panel listings-panel" id="available-listings">
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

        <section className="two-column">
          <div className="panel" id="applications">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Pipeline</p>
              <h3>Eric’s internship pipeline</h3>
              </div>
              <button className="ghost-button">View all</button>
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
          </div>

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

        <section className="panel school-editor" id="school">
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

        <section className="three-column">
          <div className="panel" id="agents">
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

          <div className="panel">
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

          <div className="panel" id="social">
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

        <section className="panel class-integration">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Registered classes</p>
              <h3>LOCUS and Sakai connection</h3>
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
          </div>
          <div className="planner-card">
            <ShieldCheck size={18} />
            <span>
              Because registration records are protected student data, Eric should authorize access.
              We can connect through official login/export options first, then automate sync where allowed.
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
  const skills = profile.skills.slice(0, 6).join(", ");
  const experience = profile.experience.slice(0, 4);

  return {
    status: "Draft",
    updatedAt: "May 11, 2026",
    headline: `${capitalizeWords(profile.major || "Finance")} student focused on ${skills || "career-aligned internship roles"}`,
    summary:
      "AI-assisted baseline drafted from Eric's current resume. It is intended to be reviewed and approved before any automated application or job-specific tailoring workflow uses it.",
    bullets: experience.length
      ? experience.map((signal) => `Position experience around ${signal} for finance, advisory, and capital markets internship applications.`)
      : initialBaselineResume.bullets
  };
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

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
