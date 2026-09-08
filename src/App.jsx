import { useMemo, useState } from "react";
import "./App.css";

/*
  CareerLens
  ----------
  Frontend architecture prepared for:

  Authentication
  Candidate Profile
  Resume Upload
  Resume Analysis
  Job Aggregation
  AI Job Matching
  Skill Gap Analysis
  Course Recommendations
  Resume Improvement
  Application Tracking
  Notifications
  Settings

  IMPORTANT:
  Real API keys must NEVER be placed in this React frontend.
  Authorized job-provider APIs should be connected through the backend.
*/

// ============================================================
// API CONFIGURATION
// ============================================================

const API_BASE_URL = "/api";

async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json();
}

// Future job API call
async function fetchJobs(filters = {}) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.append(key, value);
  });

  return apiRequest(`/jobs?${params.toString()}`);
}

// ============================================================
// DEVELOPMENT DATA
// ============================================================
// These are ONLY frontend development examples.
// They are NOT presented as live jobs.
// Backend provider APIs will replace these later.

const developmentJobs = [
  {
    id: "dev-001",
    source: "Development Mock",
    externalJobId: "DEV-001",
    title: "Machine Learning Engineer",
    company: "Example Technology Company",
    location: "Bengaluru, India",
    employmentType: "Full-time",
    experience: "0-2 years",
    salary: "Salary not provided",
    description:
      "Example development listing for testing CareerLens job matching.",
    requiredSkills: [
      "Python",
      "Machine Learning",
      "SQL",
      "TensorFlow",
    ],
    preferredSkills: ["Docker", "AWS"],
    educationRequirements: ["B.Tech", "B.E."],
    postedAt: "Development data",
    applicationUrl: "#",
    apiSource: "mock",
    matchScore: 91,
  },
  {
    id: "dev-002",
    source: "Development Mock",
    externalJobId: "DEV-002",
    title: "Data Analyst",
    company: "Example Analytics Company",
    location: "Pune, India",
    employmentType: "Full-time",
    experience: "0-2 years",
    salary: "Salary not provided",
    description:
      "Example development listing for testing CareerLens matching.",
    requiredSkills: ["Python", "SQL", "Excel", "Power BI"],
    preferredSkills: ["Statistics", "Tableau"],
    educationRequirements: ["B.Tech", "B.Sc", "B.E."],
    postedAt: "Development data",
    applicationUrl: "#",
    apiSource: "mock",
    matchScore: 84,
  },
  {
    id: "dev-003",
    source: "Development Mock",
    externalJobId: "DEV-003",
    title: "Frontend Developer",
    company: "Example Software Company",
    location: "Hyderabad, India",
    employmentType: "Full-time",
    experience: "0-2 years",
    salary: "Salary not provided",
    description:
      "Example development listing for testing CareerLens job matching.",
    requiredSkills: [
      "JavaScript",
      "React",
      "HTML",
      "CSS",
    ],
    preferredSkills: ["TypeScript", "Git"],
    educationRequirements: ["B.Tech", "B.E."],
    postedAt: "Development data",
    applicationUrl: "#",
    apiSource: "mock",
    matchScore: 78,
  },
];

// ============================================================
// ICON COMPONENT
// ============================================================

function Icon({ name }) {
  const icons = {
    dashboard: "⌂",
    resume: "▤",
    jobs: "⌕",
    skills: "◆",
    courses: "◈",
    applications: "✓",
    notifications: "●",
    settings: "⚙",
    profile: "◎",
    logout: "↪",
    upload: "↑",
    arrow: "→",
    back: "←",
    check: "✓",
    warning: "!",
    search: "⌕",
    menu: "☰",
    close: "×",
    spark: "✦",
  };

  return <span className="icon">{icons[name] || "•"}</span>;
}

// ============================================================
// LOGO
// ============================================================

function Logo({ dark = false }) {
  return (
    <div className={`logo ${dark ? "logo-dark" : ""}`}>
      <div className="logo-mark">C</div>
      <div>
        <div className="logo-name">CareerLens</div>
        <div className="logo-tagline">AI Career Intelligence</div>
      </div>
    </div>
  );
}

// ============================================================
// AUTH SCREEN
// ============================================================

function AuthScreen({ mode, setMode, onAuthenticated }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");

  function updateField(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  function submit(e) {
    e.preventDefault();
    setError("");

    if (!form.email || !form.password) {
      setError("Please enter your email and password.");
      return;
    }

    if (mode === "register") {
      if (!form.name) {
        setError("Please enter your name.");
        return;
      }

      if (form.password !== form.confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
    }

    /*
      Backend integration later:

      await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify(form)
      });

      or

      await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify(form)
      });
    */

    onAuthenticated({
      name: mode === "register" ? form.name : "Candidate",
      email: form.email,
    });
  }

  return (
    <div className="auth-page">
      <div className="auth-left">
        <Logo dark />

        <div className="auth-hero">
          <div className="eyebrow">
            <Icon name="spark" /> AI-POWERED CAREER PLATFORM
          </div>

          <h1>
            Build your career
            <br />
            <span>with intelligence.</span>
          </h1>

          <p>
            Analyze your resume, discover your skill gaps, find better-matched
            opportunities, and continuously improve your career profile.
          </p>

          <div className="auth-features">
            <div>
              <strong>01</strong>
              <span>AI Resume Intelligence</span>
            </div>

            <div>
              <strong>02</strong>
              <span>Personalized Job Matching</span>
            </div>

            <div>
              <strong>03</strong>
              <span>Skill Gap Analysis</span>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <div className="mobile-logo">
            <Logo />
          </div>

          <div className="auth-heading">
            <h2>
              {mode === "register"
                ? "Create your CareerLens account"
                : "Welcome back"}
            </h2>

            <p>
              {mode === "register"
                ? "Start building your AI-powered career profile."
                : "Sign in to continue your career journey."}
            </p>
          </div>

          {error && <div className="form-error">{error}</div>}

          <form onSubmit={submit}>
            {mode === "register" && (
              <div className="form-group">
                <label>Full name</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={updateField}
                  placeholder="Enter your full name"
                />
              </div>
            )}

            <div className="form-group">
              <label>Email address</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={updateField}
                placeholder="you@example.com"
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={updateField}
                placeholder="Enter your password"
              />
            </div>

            {mode === "register" && (
              <div className="form-group">
                <label>Confirm password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={updateField}
                  placeholder="Confirm your password"
                />
              </div>
            )}

            <button className="primary-button full-width">
              {mode === "register"
                ? "Create account"
                : "Sign in"}
              <Icon name="arrow" />
            </button>
          </form>

          <div className="auth-switch">
            {mode === "register"
              ? "Already have an account?"
              : "Don't have an account?"}

            <button
              type="button"
              onClick={() =>
                setMode(mode === "register" ? "login" : "register")
              }
            >
              {mode === "register" ? "Sign in" : "Create account"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SIDEBAR
// ============================================================

function Sidebar({
  activePage,
  setActivePage,
  user,
  onLogout,
  mobileOpen,
  setMobileOpen,
}) {
  const navigation = [
    { id: "dashboard", label: "Dashboard", icon: "dashboard" },
    { id: "resume", label: "Resume Intelligence", icon: "resume" },
    { id: "jobs", label: "Job Matches", icon: "jobs" },
    { id: "skills", label: "Skill Gaps", icon: "skills" },
    { id: "courses", label: "Learning Hub", icon: "courses" },
    { id: "applications", label: "Applications", icon: "applications" },
    { id: "notifications", label: "Notifications", icon: "notifications" },
  ];

  return (
    <>
      {mobileOpen && (
        <div
          className="mobile-overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`sidebar ${mobileOpen ? "mobile-open" : ""}`}>
        <div className="sidebar-top">
          <Logo />

          <button
            className="mobile-close"
            onClick={() => setMobileOpen(false)}
          >
            <Icon name="close" />
          </button>
        </div>

        <div className="nav-section">
          <div className="nav-label">WORKSPACE</div>

          {navigation.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${
                activePage === item.id ? "active" : ""
              }`}
              onClick={() => {
                setActivePage(item.id);
                setMobileOpen(false);
              }}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>

              {item.id === "notifications" && (
                <span className="nav-badge">3</span>
              )}
            </button>
          ))}
        </div>

        <div className="nav-section">
          <div className="nav-label">ACCOUNT</div>

          <button
            className={`nav-item ${
              activePage === "profile" ? "active" : ""
            }`}
            onClick={() => {
              setActivePage("profile");
              setMobileOpen(false);
            }}
          >
            <Icon name="profile" />
            <span>My Profile</span>
          </button>

          <button
            className={`nav-item ${
              activePage === "settings" ? "active" : ""
            }`}
            onClick={() => {
              setActivePage("settings");
              setMobileOpen(false);
            }}
          >
            <Icon name="settings" />
            <span>Settings</span>
          </button>
        </div>

        <div className="sidebar-bottom">
          <div className="user-mini">
            <div className="avatar">
              {user?.name?.charAt(0)?.toUpperCase() || "C"}
            </div>

            <div>
              <strong>{user?.name || "Candidate"}</strong>
              <span>{user?.email || "Account"}</span>
            </div>
          </div>

          <button className="logout-button" onClick={onLogout}>
            <Icon name="logout" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}

// ============================================================
// TOPBAR
// ============================================================

function Topbar({
  activePage,
  setMobileOpen,
  user,
  setActivePage,
}) {
  const titles = {
    dashboard: ["Dashboard", "Your career intelligence overview"],
    resume: ["Resume Intelligence", "Analyze and improve your resume"],
    jobs: ["Job Matches", "Opportunities matched to your profile"],
    skills: ["Skill Gaps", "Skills that can improve your career fit"],
    courses: ["Learning Hub", "Resources selected for your skill gaps"],
    applications: ["Applications", "Track your application journey"],
    notifications: ["Notifications", "Stay updated on your career activity"],
    profile: ["My Profile", "Manage your professional profile"],
    settings: ["Settings", "Manage your CareerLens preferences"],
  };

  const [title, subtitle] =
    titles[activePage] || titles.dashboard;

  return (
    <header className="topbar">
      <button
        className="mobile-menu"
        onClick={() => setMobileOpen(true)}
      >
        <Icon name="menu" />
      </button>

      <div className="page-heading">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>

      <div className="topbar-actions">
        <button
          className="notification-button"
          onClick={() => setActivePage("notifications")}
        >
          <Icon name="notifications" />
          <span />
        </button>

        <div className="top-user">
          <div className="avatar">
            {user?.name?.charAt(0)?.toUpperCase() || "C"}
          </div>

          <div className="top-user-text">
            <strong>{user?.name || "Candidate"}</strong>
            <span>Candidate</span>
          </div>
        </div>
      </div>
    </header>
  );
}

// ============================================================
// STAT CARD
// ============================================================

function StatCard({ label, value, description, icon, trend }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">
        <Icon name={icon} />
      </div>

      <div className="stat-content">
        <span className="stat-label">{label}</span>
        <strong>{value}</strong>

        <div className="stat-description">
          {trend && <span className="trend">{trend}</span>}
          {description}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// DASHBOARD
// ============================================================

function Dashboard({ setActivePage, profile, resumeUploaded }) {
  const hasProfile = profile.name || profile.targetRole;

  return (
    <div className="page-container">
      <div className="welcome-banner">
        <div>
          <div className="eyebrow">
            <Icon name="spark" /> CAREER INTELLIGENCE
          </div>

          <h2>
            {hasProfile
              ? `Welcome back, ${profile.name || "Candidate"}`
              : "Build your career intelligence profile"}
          </h2>

          <p>
            Complete your profile and resume analysis to unlock
            personalized job matching.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={() =>
            setActivePage(
              resumeUploaded ? "jobs" : "profile"
            )
          }
        >
          {resumeUploaded ? "Explore matches" : "Complete profile"}
          <Icon name="arrow" />
        </button>
      </div>

      <div className="stats-grid">
        <StatCard
          label="Resume Score"
          value={resumeUploaded ? "72/100" : "—"}
          description={
            resumeUploaded
              ? "Initial analysis"
              : "Upload your resume"
          }
          icon="resume"
          trend={resumeUploaded ? "+12%" : null}
        />

        <StatCard
          label="Job Matches"
          value={resumeUploaded ? "24" : "—"}
          description={
            resumeUploaded
              ? "Based on your profile"
              : "Analyze resume first"
          }
          icon="jobs"
        />

        <StatCard
          label="Skill Gaps"
          value={resumeUploaded ? "7" : "—"}
          description={
            resumeUploaded
              ? "Prioritized skills"
              : "AI analysis pending"
          }
          icon="skills"
        />

        <StatCard
          label="Applications"
          value="0"
          description="Tracked applications"
          icon="applications"
        />
      </div>

      <div className="dashboard-grid">
        <div className="panel">
          <div className="panel-header">
            <div>
              <h3>Career progress</h3>
              <p>Your CareerLens journey</p>
            </div>
          </div>

          <div className="progress-list">
            <ProgressStep
              number="01"
              title="Create account"
              completed
            />

            <ProgressStep
              number="02"
              title="Complete profile"
              completed={Boolean(profile.name)}
            />

            <ProgressStep
              number="03"
              title="Upload resume"
              completed={resumeUploaded}
            />

            <ProgressStep
              number="04"
              title="AI resume analysis"
              completed={resumeUploaded}
            />

            <ProgressStep
              number="05"
              title="Discover matched jobs"
              completed={false}
            />
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <h3>Quick actions</h3>
              <p>Continue building your career profile</p>
            </div>
          </div>

          <div className="quick-actions">
            <QuickAction
              icon="profile"
              title="Update profile"
              description="Add your education, skills and preferences"
              onClick={() => setActivePage("profile")}
            />

            <QuickAction
              icon="upload"
              title="Analyze resume"
              description="Upload a PDF or DOCX resume"
              onClick={() => setActivePage("resume")}
            />

            <QuickAction
              icon="jobs"
              title="Find opportunities"
              description="Explore AI-matched job listings"
              onClick={() => setActivePage("jobs")}
            />

            <QuickAction
              icon="skills"
              title="Improve skills"
              description="View your highest-priority skill gaps"
              onClick={() => setActivePage("skills")}
            />
          </div>
        </div>
      </div>

      <div className="panel source-panel">
        <div className="panel-header">
          <div>
            <h3>CareerLens job intelligence</h3>
            <p>
              Designed to aggregate opportunities from multiple
              authorized job APIs.
            </p>
          </div>

          <span className="status-pill">
            API READY
          </span>
        </div>

        <div className="architecture-row">
          <ArchitectureBox text="Authorized Job APIs" />
          <span>→</span>
          <ArchitectureBox text="Normalize" />
          <span>→</span>
          <ArchitectureBox text="Deduplicate" />
          <span>→</span>
          <ArchitectureBox text="AI Matching" />
          <span>→</span>
          <ArchitectureBox text="Your Job Feed" />
        </div>
      </div>
    </div>
  );
}

function ProgressStep({ number, title, completed }) {
  return (
    <div className="progress-step">
      <div
        className={`step-number ${
          completed ? "completed" : ""
        }`}
      >
        {completed ? <Icon name="check" /> : number}
      </div>

      <div>
        <strong>{title}</strong>
        <span>{completed ? "Completed" : "Pending"}</span>
      </div>
    </div>
  );
}

function QuickAction({
  icon,
  title,
  description,
  onClick,
}) {
  return (
    <button className="quick-action" onClick={onClick}>
      <div className="quick-icon">
        <Icon name={icon} />
      </div>

      <div>
        <strong>{title}</strong>
        <span>{description}</span>
      </div>

      <Icon name="arrow" />
    </button>
  );
}

function ArchitectureBox({ text }) {
  return <div className="architecture-box">{text}</div>;
}

// ============================================================
// PROFILE
// ============================================================

function ProfilePage({ profile, setProfile }) {
  const [saved, setSaved] = useState(false);

  function update(name, value) {
    setProfile({
      ...profile,
      [name]: value,
    });

    setSaved(false);
  }

  function save() {
    /*
      Backend later:

      await apiRequest("/candidate/profile", {
        method: "PUT",
        body: JSON.stringify(profile)
      });
    */

    setSaved(true);
  }

  return (
    <div className="page-container">
      <div className="section-intro">
        <div>
          <h2>Professional profile</h2>
          <p>
            This information powers CareerLens job matching and
            skill-gap recommendations.
          </p>
        </div>

        {saved && (
          <span className="success-message">
            <Icon name="check" /> Profile saved
          </span>
        )}
      </div>

      <div className="panel form-panel">
        <div className="form-section">
          <h3>Basic information</h3>

          <div className="form-grid">
            <FormField
              label="Full name"
              value={profile.name}
              onChange={(value) => update("name", value)}
              placeholder="Your full name"
            />

            <FormField
              label="Email"
              value={profile.email}
              onChange={(value) => update("email", value)}
              placeholder="Your email"
              type="email"
            />

            <FormField
              label="Phone"
              value={profile.phone}
              onChange={(value) => update("phone", value)}
              placeholder="Phone number"
            />

            <FormField
              label="Location"
              value={profile.location}
              onChange={(value) => update("location", value)}
              placeholder="City, Country"
            />
          </div>
        </div>

        <div className="form-section">
          <h3>Education</h3>

          <div className="form-grid">
            <FormField
              label="Degree"
              value={profile.degree}
              onChange={(value) => update("degree", value)}
              placeholder="e.g. B.Tech"
            />

            <FormField
              label="Branch / specialization"
              value={profile.branch}
              onChange={(value) => update("branch", value)}
              placeholder="e.g. Computer Science"
            />

            <FormField
              label="Graduation year"
              value={profile.graduationYear}
              onChange={(value) =>
                update("graduationYear", value)
              }
              placeholder="e.g. 2027"
            />

            <FormField
              label="Experience level"
              value={profile.experience}
              onChange={(value) =>
                update("experience", value)
              }
              placeholder="e.g. Fresher"
            />
          </div>
        </div>

        <div className="form-section">
          <h3>Career preferences</h3>

          <div className="form-grid">
            <FormField
              label="Target roles"
              value={profile.targetRole}
              onChange={(value) =>
                update("targetRole", value)
              }
              placeholder="e.g. ML Engineer, Data Analyst"
            />

            <FormField
              label="Preferred locations"
              value={profile.preferredLocations}
              onChange={(value) =>
                update("preferredLocations", value)
              }
              placeholder="e.g. Bengaluru, Pune, Remote"
            />

            <FormField
              label="Skills"
              value={profile.skills}
              onChange={(value) =>
                update("skills", value)
              }
              placeholder="Python, SQL, React..."
            />

            <FormField
              label="Career interests"
              value={profile.interests}
              onChange={(value) =>
                update("interests", value)
              }
              placeholder="AI, Data Science..."
            />
          </div>
        </div>

        <div className="form-actions">
          <button className="primary-button" onClick={save}>
            Save profile
            <Icon name="check" />
          </button>
        </div>
      </div>
    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}) {
  return (
    <div className="form-group">
      <label>{label}</label>

      <input
        type={type}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

// ============================================================
// RESUME PAGE
// ============================================================

function ResumePage({
  resume,
  setResume,
  setResumeUploaded,
}) {
  const [dragging, setDragging] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(
    resume?.analyzed || false
  );

  function processFile(file) {
    if (!file) return;

    const allowed = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ];

    if (
      !allowed.includes(file.type) &&
      !file.name.toLowerCase().endsWith(".pdf") &&
      !file.name.toLowerCase().endsWith(".docx")
    ) {
      alert("Please upload a PDF or DOC/DOCX resume.");
      return;
    }

    setResume({
      name: file.name,
      size: file.size,
      file,
      analyzed: false,
    });

    setAnalyzed(false);
    setResumeUploaded(true);
  }

  function analyzeResume() {
    setAnalyzing(true);

    /*
      Real backend later:

      const formData = new FormData();
      formData.append("resume", resume.file);

      fetch("/api/resume/analyze", {
        method: "POST",
        body: formData
      });

    */

    setTimeout(() => {
      setAnalyzing(false);
      setAnalyzed(true);

      setResume({
        ...resume,
        analyzed: true,
      });
    }, 1800);
  }

  return (
    <div className="page-container">
      <div className="resume-layout">
        <div>
          <div
            className={`upload-zone ${
              dragging ? "dragging" : ""
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              processFile(e.dataTransfer.files[0]);
            }}
          >
            <div className="upload-icon">
              <Icon name="upload" />
            </div>

            <h3>Upload your resume</h3>

            <p>
              PDF or DOCX files are supported.
              <br />
              CareerLens will extract and analyze your content.
            </p>

            <label className="secondary-button upload-button">
              Choose resume
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                hidden
                onChange={(e) =>
                  processFile(e.target.files[0])
                }
              />
            </label>

            <span className="upload-note">
              Your resume is processed securely through the
              CareerLens backend.
            </span>
          </div>

          {resume?.name && (
            <div className="uploaded-file">
              <div className="file-icon">PDF</div>

              <div>
                <strong>{resume.name}</strong>
                <span>
                  {resume.size
                    ? `${Math.round(
                        resume.size / 1024
                      )} KB`
                    : "Uploaded resume"}
                </span>
              </div>

              <span className="file-status">
                <Icon name="check" /> Uploaded
              </span>
            </div>
          )}

          {resume?.name && !analyzed && (
            <button
              className="primary-button analyze-button"
              onClick={analyzeResume}
              disabled={analyzing}
            >
              {analyzing
                ? "Analyzing resume..."
                : "Analyze resume with AI"}
              {!analyzing && <Icon name="spark" />}
            </button>
          )}
        </div>

        {analyzed && <ResumeAnalysis />}
      </div>
    </div>
  );
}

// ============================================================
// RESUME ANALYSIS
// ============================================================

function ResumeAnalysis() {
  const scores = [
    ["Skills", 82],
    ["Experience", 65],
    ["Projects", 78],
    ["Education", 91],
    ["Keywords", 68],
    ["ATS Compatibility", 74],
    ["Impact & Quantification", 59],
  ];

  return (
    <div className="analysis-column">
      <div className="score-card">
        <div>
          <span>OVERALL RESUME SCORE</span>
          <strong>72</strong>
          <small>/ 100</small>
        </div>

        <div className="score-ring">
          <span>72%</span>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div>
            <h3>Resume intelligence</h3>
            <p>AI-generated evaluation of your resume</p>
          </div>
        </div>

        <div className="score-list">
          {scores.map(([name, score]) => (
            <div className="score-row" key={name}>
              <div>
                <span>{name}</span>
                <strong>{score}</strong>
              </div>

              <div className="score-bar">
                <span style={{ width: `${score}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="analysis-insights">
        <div className="insight-card positive">
          <div className="insight-symbol">
            <Icon name="check" />
          </div>

          <div>
            <strong>Strong areas</strong>
            <p>
              Technical skills and educational background are
              clearly represented.
            </p>
          </div>
        </div>

        <div className="insight-card warning">
          <div className="insight-symbol">
            <Icon name="warning" />
          </div>

          <div>
            <strong>Areas to improve</strong>
            <p>
              Add measurable project outcomes and stronger
              role-specific keywords.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// JOBS
// ============================================================

function JobsPage({ profile, onSelectJob }) {
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [source, setSource] = useState("all");

  const jobs = useMemo(() => {
    return developmentJobs.filter((job) => {
      const matchesSearch =
        !search ||
        job.title
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        job.company
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesLocation =
        !location ||
        job.location
          .toLowerCase()
          .includes(location.toLowerCase());

      const matchesSource =
        source === "all" || job.source === source;

      return (
        matchesSearch &&
        matchesLocation &&
        matchesSource
      );
    });
  }, [search, location, source]);

  return (
    <div className="page-container">
      <div className="api-notice">
        <div>
          <strong>Multi-source job intelligence</strong>
          <p>
            Development listings are shown currently. The backend
            will aggregate jobs from authorized provider APIs.
          </p>
        </div>

        <span className="status-pill">
          PROVIDER-READY
        </span>
      </div>

      <div className="job-search">
        <div className="search-field">
          <Icon name="search" />
          <input
            placeholder="Search job title, company or skill..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="search-field">
          <Icon name="jobs" />
          <input
            placeholder="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>

        <select
          value={source}
          onChange={(e) => setSource(e.target.value)}
        >
          <option value="all">All sources</option>
          <option value="Development Mock">
            Development Mock
          </option>
        </select>

        <button className="primary-button">
          Search
        </button>
      </div>

      <div className="jobs-heading">
        <div>
          <h2>Recommended opportunities</h2>
          <p>
            Based on resume, skills, experience and preferences.
          </p>
        </div>

        <span>{jobs.length} results</span>
      </div>

      <div className="job-list">
        {jobs.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            onClick={() => onSelectJob(job)}
          />
        ))}
      </div>
    </div>
  );
}

function JobCard({ job, onClick }) {
  return (
    <div className="job-card">
      <div className="job-main">
        <div className="company-logo">
          {job.company.charAt(0)}
        </div>

        <div className="job-title-area">
          <span className="job-source">
            {job.source}
          </span>

          <h3>{job.title}</h3>

          <p>
            {job.company} · {job.location}
          </p>

          <div className="job-meta">
            <span>{job.employmentType}</span>
            <span>{job.experience}</span>
          </div>
        </div>
      </div>

      <div className="match-area">
        <span>CareerLens Match</span>

        <strong>{job.matchScore}%</strong>

        <div className="match-bar">
          <span style={{ width: `${job.matchScore}%` }} />
        </div>
      </div>

      <div className="job-skills">
        {job.requiredSkills.slice(0, 4).map((skill) => (
          <span key={skill} className="skill-tag matched">
            <Icon name="check" /> {skill}
          </span>
        ))}

        {job.preferredSkills.slice(0, 1).map((skill) => (
          <span key={skill} className="skill-tag missing">
            <Icon name="warning" /> {skill}
          </span>
        ))}
      </div>

      <button
        className="secondary-button"
        onClick={onClick}
      >
        Analyze match
        <Icon name="arrow" />
      </button>
    </div>
  );
}

// ============================================================
// JOB DETAIL
// ============================================================

function JobDetail({ job, onBack }) {
  if (!job) return null;

  return (
    <div className="page-container">
      <button className="back-button" onClick={onBack}>
        <Icon name="back" /> Back to jobs
      </button>

      <div className="job-detail-header panel">
        <div className="company-logo large">
          {job.company.charAt(0)}
        </div>

        <div>
          <span className="job-source">{job.source}</span>
          <h2>{job.title}</h2>
          <p>
            {job.company} · {job.location}
          </p>
        </div>

        <div className="detail-match">
          <span>AI MATCH</span>
          <strong>{job.matchScore}%</strong>
        </div>
      </div>

      <div className="detail-grid">
        <div className="panel">
          <div className="panel-header">
            <div>
              <h3>Why this role matches</h3>
              <p>CareerLens compatibility analysis</p>
            </div>
          </div>

          <div className="match-breakdown">
            <MatchMetric
              name="Skills"
              value={94}
            />

            <MatchMetric
              name="Experience"
              value={88}
            />

            <MatchMetric
              name="Education"
              value={100}
            />

            <MatchMetric
              name="Location"
              value={100}
            />

            <MatchMetric
              name="Role fit"
              value={92}
            />
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <h3>Skill comparison</h3>
              <p>Required vs your profile</p>
            </div>
          </div>

          <div className="comparison-list">
            {job.requiredSkills.map((skill) => (
              <div className="comparison-row" key={skill}>
                <span>{skill}</span>
                <span className="comparison-match">
                  <Icon name="check" /> Match
                </span>
              </div>
            ))}

            {job.preferredSkills.map((skill) => (
              <div className="comparison-row" key={skill}>
                <span>{skill}</span>
                <span className="comparison-missing">
                  <Icon name="warning" /> Skill gap
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="panel application-panel">
        <div>
          <h3>Ready to apply?</h3>
          <p>
            CareerLens will take you to the official application
            page provided by the authorized job source.
          </p>
        </div>

        <a
          href={job.applicationUrl}
          target="_blank"
          rel="noreferrer"
          className="primary-button"
          onClick={(e) => {
            if (job.applicationUrl === "#") {
              e.preventDefault();
              alert(
                "This is development data. A real authorized application URL will be supplied by the backend."
              );
            }
          }}
        >
          Apply on official site
          <Icon name="arrow" />
        </a>
      </div>
    </div>
  );
}

function MatchMetric({ name, value }) {
  return (
    <div className="match-metric">
      <div>
        <span>{name}</span>
        <strong>{value}%</strong>
      </div>

      <div className="score-bar">
        <span style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

// ============================================================
// SKILL GAPS
// ============================================================

function SkillsPage() {
  const skills = [
    {
      name: "Docker",
      priority: "High",
      reason:
        "Appears frequently in target Machine Learning and Backend roles.",
      demand: "High",
    },
    {
      name: "AWS",
      priority: "High",
      reason:
        "Cloud deployment knowledge can increase your job compatibility.",
      demand: "High",
    },
    {
      name: "System Design",
      priority: "Medium",
      reason:
        "Useful for engineering roles and technical interviews.",
      demand: "Medium",
    },
    {
      name: "TensorFlow",
      priority: "Medium",
      reason:
        "Frequently requested for machine learning positions.",
      demand: "High",
    },
  ];

  return (
    <div className="page-container">
      <div className="skills-summary">
        <div>
          <span>AI SKILL GAP ANALYSIS</span>
          <strong>7</strong>
          <p>Potential skills to improve</p>
        </div>

        <div className="skills-summary-copy">
          <h3>Focus on high-impact skills first.</h3>
          <p>
            CareerLens prioritizes skills based on job demand,
            target roles, and your current profile.
          </p>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div>
            <h3>Prioritized skill gaps</h3>
            <p>
              Skills that can increase your job-match percentage.
            </p>
          </div>
        </div>

        <div className="skill-gap-list">
          {skills.map((skill) => (
            <div className="skill-gap-card" key={skill.name}>
              <div className="skill-gap-number">
                {skill.priority === "High" ? "01" : "02"}
              </div>

              <div className="skill-gap-content">
                <div className="skill-gap-title">
                  <h3>{skill.name}</h3>

                  <span
                    className={`priority ${skill.priority.toLowerCase()}`}
                  >
                    {skill.priority} priority
                  </span>
                </div>

                <p>{skill.reason}</p>

                <div className="demand-row">
                  <span>Job demand</span>
                  <strong>{skill.demand}</strong>
                </div>
              </div>

              <button className="secondary-button">
                Learn skill <Icon name="arrow" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// COURSES
// ============================================================

function CoursesPage() {
  const courses = [
    {
      title: "Docker Fundamentals",
      skill: "Docker",
      level: "Beginner",
      type: "Course",
    },
    {
      title: "AWS Cloud Practitioner",
      skill: "AWS",
      level: "Beginner",
      type: "Certification",
    },
    {
      title: "Practical TensorFlow",
      skill: "TensorFlow",
      level: "Intermediate",
      type: "Course",
    },
  ];

  return (
    <div className="page-container">
      <div className="learning-banner">
        <div className="learning-icon">
          <Icon name="spark" />
        </div>

        <div>
          <span>PERSONALIZED LEARNING</span>
          <h2>Turn skill gaps into career opportunities.</h2>
          <p>
            Learning recommendations will eventually be generated
            dynamically from your AI skill-gap analysis.
          </p>
        </div>
      </div>

      <div className="course-grid">
        {courses.map((course) => (
          <div className="course-card" key={course.title}>
            <div className="course-top">
              <span>{course.type}</span>
              <span>{course.level}</span>
            </div>

            <h3>{course.title}</h3>

            <p>
              Recommended because <strong>{course.skill}</strong>{" "}
              is identified as a career skill gap.
            </p>

            <button className="secondary-button">
              View resource <Icon name="arrow" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// APPLICATIONS
// ============================================================

function ApplicationsPage() {
  const applications = [
    {
      company: "Your applications will appear here",
      role: "Start applying to matched opportunities",
      status: "Ready",
      date: "—",
    },
  ];

  return (
    <div className="page-container">
      <div className="application-stats">
        <ApplicationStat label="Applied" value="0" />
        <ApplicationStat label="Viewed" value="0" />
        <ApplicationStat label="Shortlisted" value="0" />
        <ApplicationStat label="Interviews" value="0" />
        <ApplicationStat label="Offers" value="0" />
      </div>

      <div className="panel">
        <div className="panel-header">
          <div>
            <h3>Application tracker</h3>
            <p>
              Track applications across your career journey.
            </p>
          </div>
        </div>

        <div className="application-table">
          <div className="application-table-head">
            <span>ROLE</span>
            <span>COMPANY</span>
            <span>STATUS</span>
            <span>DATE</span>
          </div>

          {applications.map((application, index) => (
            <div
              className="application-table-row"
              key={index}
            >
              <strong>{application.role}</strong>
              <span>{application.company}</span>
              <span className="status-pill">
                {application.status}
              </span>
              <span>{application.date}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="tracking-flow">
        {[
          "Applied",
          "Viewed",
          "Shortlisted",
          "Assessment",
          "Interview",
          "Offer / Rejected",
        ].map((stage, index) => (
          <div className="tracking-stage" key={stage}>
            <div>{index + 1}</div>
            <span>{stage}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ApplicationStat({ label, value }) {
  return (
    <div className="application-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

// ============================================================
// NOTIFICATIONS
// ============================================================

function NotificationsPage() {
  const notifications = [
    {
      type: "resume",
      title: "Resume analysis available",
      message:
        "Your resume analysis has been completed.",
      time: "CareerLens",
    },
    {
      type: "job",
      title: "New job matches available",
      message:
        "CareerLens found opportunities matching your profile.",
      time: "CareerLens",
    },
    {
      type: "skill",
      title: "Skill gap identified",
      message:
        "Docker could improve your compatibility with target roles.",
      time: "CareerLens",
    },
  ];

  return (
    <div className="page-container">
      <div className="panel notifications-panel">
        {notifications.map((notification, index) => (
          <div
            className="notification-row"
            key={index}
          >
            <div className="notification-icon">
              <Icon
                name={
                  notification.type === "resume"
                    ? "resume"
                    : notification.type === "job"
                    ? "jobs"
                    : "skills"
                }
              />
            </div>

            <div>
              <strong>{notification.title}</strong>
              <p>{notification.message}</p>
              <span>{notification.time}</span>
            </div>

            <span className="notification-dot" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// SETTINGS
// ============================================================

function SettingsPage() {
  const [settings, setSettings] = useState({
    jobAlerts: true,
    skillAlerts: true,
    resumeUpdates: true,
    applicationUpdates: true,
  });

  function toggle(name) {
    setSettings({
      ...settings,
      [name]: !settings[name],
    });
  }

  return (
    <div className="page-container">
      <div className="panel settings-panel">
        <div className="panel-header">
          <div>
            <h3>Notification preferences</h3>
            <p>Choose what CareerLens should notify you about.</p>
          </div>
        </div>

        <SettingRow
          title="New job matches"
          description="Receive alerts when suitable jobs are found."
          enabled={settings.jobAlerts}
          onToggle={() => toggle("jobAlerts")}
        />

        <SettingRow
          title="Skill gap alerts"
          description="Receive updates about important skills to learn."
          enabled={settings.skillAlerts}
          onToggle={() => toggle("skillAlerts")}
        />

        <SettingRow
          title="Resume analysis updates"
          description="Receive updates when resume analysis changes."
          enabled={settings.resumeUpdates}
          onToggle={() => toggle("resumeUpdates")}
        />

        <SettingRow
          title="Application updates"
          description="Receive application tracking notifications."
          enabled={settings.applicationUpdates}
          onToggle={() => toggle("applicationUpdates")}
        />
      </div>
    </div>
  );
}

function SettingRow({
  title,
  description,
  enabled,
  onToggle,
}) {
  return (
    <div className="setting-row">
      <div>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>

      <button
        className={`toggle ${enabled ? "on" : ""}`}
        onClick={onToggle}
      >
        <span />
      </button>
    </div>
  );
}

// ============================================================
// APP
// ============================================================

export default function App() {
  const [authenticated, setAuthenticated] =
    useState(false);

  const [authMode, setAuthMode] = useState("register");

  const [user, setUser] = useState(null);

  const [activePage, setActivePage] =
    useState("dashboard");

  const [mobileOpen, setMobileOpen] =
    useState(false);

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    degree: "",
    branch: "",
    graduationYear: "",
    experience: "",
    targetRole: "",
    preferredLocations: "",
    skills: "",
    interests: "",
  });

  const [resume, setResume] = useState(null);

  const [resumeUploaded, setResumeUploaded] =
    useState(false);

  const [selectedJob, setSelectedJob] =
    useState(null);

  function handleAuthenticated(account) {
    setUser(account);

    setProfile((current) => ({
      ...current,
      name: account.name || "",
      email: account.email || "",
    }));

    setAuthenticated(true);
    setActivePage("profile");
  }

  function logout() {
    setAuthenticated(false);
    setUser(null);
    setAuthMode("login");
    setActivePage("dashboard");
    setSelectedJob(null);
  }

  if (!authenticated) {
    return (
      <AuthScreen
        mode={authMode}
        setMode={setAuthMode}
        onAuthenticated={handleAuthenticated}
      />
    );
  }

  function renderPage() {
    if (selectedJob) {
      return (
        <JobDetail
          job={selectedJob}
          onBack={() => setSelectedJob(null)}
        />
      );
    }

    switch (activePage) {
      case "dashboard":
        return (
          <Dashboard
            setActivePage={setActivePage}
            profile={profile}
            resumeUploaded={resumeUploaded}
          />
        );

      case "profile":
        return (
          <ProfilePage
            profile={profile}
            setProfile={setProfile}
          />
        );

      case "resume":
        return (
          <ResumePage
            resume={resume}
            setResume={setResume}
            setResumeUploaded={setResumeUploaded}
          />
        );

      case "jobs":
        return (
          <JobsPage
            profile={profile}
            onSelectJob={setSelectedJob}
          />
        );

      case "skills":
        return <SkillsPage />;

      case "courses":
        return <CoursesPage />;

      case "applications":
        return <ApplicationsPage />;

      case "notifications":
        return <NotificationsPage />;

      case "settings":
        return <SettingsPage />;

      default:
        return (
          <Dashboard
            setActivePage={setActivePage}
            profile={profile}
            resumeUploaded={resumeUploaded}
          />
        );
    }
  }

  return (
    <div className="app-shell">
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        user={user}
        onLogout={logout}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <main className="main-area">
        <Topbar
          activePage={activePage}
          setMobileOpen={setMobileOpen}
          user={user}
          setActivePage={setActivePage}
        />

        {renderPage()}
      </main>
    </div>
  );
}