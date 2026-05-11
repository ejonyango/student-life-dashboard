import React, { useState } from "react";
import ReactDOM from "react-dom/client";
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

type MatchedListing = Listing & {
  matchCount: number;
  matchedTerms: string[];
  fit: number;
};

const applications: Application[] = [
  {
    company: "Morningstar",
    role: "Data Analyst Intern",
    status: "Interview",
    next: "Prep behavioral answers by Tuesday",
    fit: 92
  },
  {
    company: "Abbott",
    role: "Product Operations Intern",
    status: "Applied",
    next: "Follow up with campus recruiter",
    fit: 86
  },
  {
    company: "United Airlines",
    role: "Digital Strategy Intern",
    status: "Drafting",
    next: "Tailor resume for analytics projects",
    fit: 79
  },
  {
    company: "CME Group",
    role: "Technology Summer Analyst",
    status: "Follow-up",
    next: "Send short note after info session",
    fit: 84
  }
];

const initialCourses: Lesson[] = [
  {
    course: "ECON 304: Econometrics",
    time: "9:30 AM",
    task: "Problem set due tonight",
    intensity: "High",
    professor: "Dr. Keller",
    location: "Schreiber Center"
  },
  {
    course: "COMP 271: Data Structures",
    time: "12:10 PM",
    task: "Review graph traversal notes",
    intensity: "Medium",
    professor: "Prof. Nair",
    location: "Cudahy Science Hall"
  },
  {
    course: "COMM 215: Business Writing",
    time: "2:45 PM",
    task: "Resume workshop reflection",
    intensity: "Low",
    professor: "Prof. Alvarez",
    location: "Damen Student Center"
  }
];

const agents: Agent[] = [
  {
    name: "Email Agent",
    state: "Needs approval",
    detail: "Drafted 2 recruiter replies and found 1 interview request.",
    icon: <Inbox size={18} />
  },
  {
    name: "Calendar Agent",
    state: "Synced",
    detail: "Balanced classes, assignments, and interview prep blocks.",
    icon: <CalendarDays size={18} />
  },
  {
    name: "Resume Agent",
    state: "Ready",
    detail: "Suggested 3 bullets for analytics roles from recent coursework.",
    icon: <FileText size={18} />
  },
  {
    name: "Social Agent",
    state: "Drafting",
    detail: "Prepared a LinkedIn update about the campus data project.",
    icon: <Linkedin size={18} />
  }
];

const listings: Listing[] = [
  {
    company: "Morningstar",
    role: "Summer Intern - Data & Analytics",
    location: "Chicago, IL",
    sourceBoard: "LinkedIn",
    sourceDescription: "Internship focused on research, data analysis, and business problem solving.",
    companyVerification: "Company careers page checked before adding.",
    applicationLink: "https://www.morningstar.com/company/careers",
    verifiedDate: "May 10, 2026",
    skills: ["data analysis", "excel", "python", "statistics", "research"],
    experienceSignals: ["analytics project", "business problem solving", "presentation"],
    majors: ["business analytics", "economics", "computer science", "finance"]
  },
  {
    company: "Abbott",
    role: "Commercial Leadership Intern",
    location: "Abbott Park, IL",
    sourceBoard: "Indeed",
    sourceDescription: "Cross-functional internship supporting business projects, analysis, and presentation work.",
    companyVerification: "Company careers page checked before adding.",
    applicationLink: "https://www.jobs.abbott/us/en/internships",
    verifiedDate: "May 10, 2026",
    skills: ["excel", "presentation", "operations", "market research", "project management"],
    experienceSignals: ["leadership", "cross-functional project", "business writing"],
    majors: ["business", "marketing", "economics", "management"]
  },
  {
    company: "United Airlines",
    role: "Digital Technology Intern",
    location: "Chicago, IL",
    sourceBoard: "Handshake",
    sourceDescription: "Technology internship for students interested in product, systems, and analytics work.",
    companyVerification: "Company careers page checked before adding.",
    applicationLink: "https://careers.united.com/us/en/student-and-graduate-opportunities",
    verifiedDate: "May 10, 2026",
    skills: ["data analysis", "product", "systems", "sql", "technology"],
    experienceSignals: ["digital project", "analytics project", "customer research"],
    majors: ["computer science", "information systems", "business analytics"]
  },
  {
    company: "CME Group",
    role: "Technology Summer Analyst",
    location: "Chicago, IL",
    sourceBoard: "LinkedIn",
    sourceDescription: "Internship supporting financial technology teams through software, data, and market systems work.",
    companyVerification: "Company careers page checked before adding.",
    applicationLink: "https://www.cmegroup.com/careers.html",
    verifiedDate: "May 10, 2026",
    skills: ["python", "sql", "finance", "data structures", "problem solving"],
    experienceSignals: ["coding project", "market research", "technical coursework"],
    majors: ["computer science", "finance", "economics"]
  },
  {
    company: "NielsenIQ",
    role: "Consumer Insights Intern",
    location: "Chicago, IL",
    sourceBoard: "Indeed",
    sourceDescription: "Research internship involving consumer data, storytelling, and client-facing insight development.",
    companyVerification: "Company careers page checked before adding.",
    applicationLink: "https://nielseniq.com/global/en/careers/",
    verifiedDate: "May 10, 2026",
    skills: ["research", "data visualization", "excel", "presentation", "statistics"],
    experienceSignals: ["research project", "business writing", "client presentation"],
    majors: ["marketing", "business analytics", "economics", "communication"]
  },
  {
    company: "Relativity",
    role: "Product Management Intern",
    location: "Chicago, IL",
    sourceBoard: "Handshake",
    sourceDescription: "Internship focused on product discovery, user problems, technical teams, and launch support.",
    companyVerification: "Company careers page checked before adding.",
    applicationLink: "https://www.relativity.com/company/careers/",
    verifiedDate: "May 10, 2026",
    skills: ["product", "user research", "communication", "data analysis", "project management"],
    experienceSignals: ["campus project", "customer research", "technical collaboration"],
    majors: ["business", "computer science", "information systems", "communication"]
  },
  {
    company: "Motorola Solutions",
    role: "Software Engineering Intern",
    location: "Chicago, IL",
    sourceBoard: "Company Careers",
    sourceDescription: "Engineering internship for students building software, APIs, and reliable technology products.",
    companyVerification: "Company careers page checked before adding.",
    applicationLink: "https://motorolasolutions.wd5.myworkdayjobs.com/Careers",
    verifiedDate: "May 10, 2026",
    skills: ["java", "python", "data structures", "apis", "testing"],
    experienceSignals: ["coding project", "technical coursework", "software project"],
    majors: ["computer science", "software engineering", "information systems"]
  },
  {
    company: "Kraft Heinz",
    role: "Marketing Analytics Intern",
    location: "Chicago, IL",
    sourceBoard: "LinkedIn",
    sourceDescription: "Internship using data, market research, and communication skills to support brand decisions.",
    companyVerification: "Company careers page checked before adding.",
    applicationLink: "https://careers.kraftheinz.com/",
    verifiedDate: "May 10, 2026",
    skills: ["market research", "excel", "data analysis", "presentation", "storytelling"],
    experienceSignals: ["business writing", "research project", "campus leadership"],
    majors: ["marketing", "business analytics", "business", "communication"]
  }
];

const skillDictionary = [
  "python",
  "java",
  "sql",
  "excel",
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
  "technology"
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
  "software engineering"
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
  const [resumeProfile, setResumeProfile] = useState<ResumeProfile>({
    fileName: "Sample resume profile",
    text:
      "Business Analytics major with coursework in Econometrics and Data Structures. Skills include Python, Excel, SQL, data analysis, research, presentation, business writing, and project management. Experience includes analytics project, campus project, customer research, and leadership.",
    skills: ["python", "excel", "sql", "data analysis", "research", "presentation", "business writing", "project management"],
    experience: ["analytics project", "campus project", "customer research", "leadership"],
    major: "business analytics",
    keywords: ["Chicago", "internship"]
  });
  const [keywordInput, setKeywordInput] = useState("Chicago, internship");

  const highPriorityCourses = courseList.filter((course) => course.intensity === "High").length;
  const weeklyProgress = Math.min(96, 42 + courseList.length * 9);
  const matchedListings = getMatchedListings(resumeProfile);

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

    const text = await file.text();
    const parsed = parseResume(text, file.name, resumeProfile.keywords);
    setResumeProfile(parsed);
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
            <strong>Student Life OS</strong>
            <span>Loyola Chicago</span>
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
            <p className="eyebrow">Sunday, May 10</p>
            <h1>Today’s command center</h1>
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
            <p className="eyebrow">AI briefing</p>
            <h2>Two internship replies need review before tomorrow’s classes.</h2>
            <p>
              The system is prioritizing recruiter communication, coursework,
              and one resume update for analytics-focused applications.
            </p>
          </div>
          <div className="briefing-stack">
            <div>
              <Sparkles size={18} />
              <span>Best next action</span>
              <strong>Approve Morningstar interview reply</strong>
            </div>
            <div>
              <Clock3 size={18} />
              <span>Deep work window</span>
              <strong>7:00 PM - 8:30 PM</strong>
            </div>
          </div>
        </section>

        <section className="metric-grid" aria-label="Student life metrics">
          <Metric label="Active applications" value="18" detail="+4 this week" />
          <Metric label="Matched listings" value={String(matchedListings.length)} detail="500 result cap" />
          <Metric
            label="Courses tracked"
            value={String(courseList.length)}
            detail={`${highPriorityCourses} high priority`}
          />
          <Metric label="Network follow-ups" value="7" detail="3 alumni contacts" />
        </section>

        <section className="panel resume-intake" id="resume">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Resume inbox</p>
              <h3>Resume-driven matching</h3>
            </div>
            <span className="progress-pill">{resumeProfile.skills.length} saved skills</span>
          </div>
          <div className="resume-grid">
            <label className="upload-box">
              <FileText size={22} />
              <strong>Upload resume text</strong>
              <span>Upload a text or markdown resume for this MVP.</span>
              <input type="file" accept=".txt,.md,.text" onChange={handleResumeUpload} />
            </label>
            <div className="resume-summary">
              <span>Current resume</span>
              <strong>{resumeProfile.fileName}</strong>
              <p>Major or field: {resumeProfile.major || "Not detected yet"}</p>
              <div className="tag-list">
                {resumeProfile.skills.slice(0, 10).map((skill) => (
                  <span key={skill}>{skill}</span>
                ))}
              </div>
            </div>
            <div className="keyword-box">
              <label>
                Additional keywords
                <textarea
                  value={keywordInput}
                  onChange={(event) => setKeywordInput(event.target.value)}
                  placeholder="Chicago, product analytics, healthcare, fintech"
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
                  Open application <ExternalLink size={16} />
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
                <h3>Internship applications</h3>
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
                <p className="eyebrow">Dashboard courses</p>
                <h3>Lessons and assignments</h3>
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
              <h3>Editable course planner</h3>
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
                <h3>Agents</h3>
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
                <h3>Saved profile</h3>
              </div>
              <FileText size={20} />
            </div>
            <div className="resume-card">
              <strong>{resumeProfile.fileName}</strong>
              <span>{resumeProfile.major || "Field not detected"}</span>
              <p>{resumeProfile.experience.slice(0, 3).join(", ") || "Add experience through the resume upload."}</p>
            </div>
            <button className="wide-action">
              Generate targeted version <ChevronRight size={18} />
            </button>
          </div>

          <div className="panel" id="social">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Presence</p>
                <h3>Social and network</h3>
              </div>
              <Linkedin size={20} />
            </div>
            <div className="social-list">
              <SocialItem icon={<UserRoundCheck size={17} />} label="LinkedIn profile" value="82% complete" />
              <SocialItem icon={<MessageSquareText size={17} />} label="Post draft" value="Campus project update" />
              <SocialItem icon={<MailCheck size={17} />} label="Outreach" value="3 follow-ups queued" />
            </div>
          </div>
        </section>
      </section>
    </main>
  );
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
