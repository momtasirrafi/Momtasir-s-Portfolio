import { useEffect, useRef, useState } from "react";
import "./App.css";
import profilePhoto from "./assets/profile.jpg";

const NAV_LINKS = ["About", "Experience", "Skills", "Projects", "Contact"];

const EXPERIENCES = [
  {
    role: "Documentation & Merchant Enablement",
    company: "CodeLab FZC LLC",
    period: "April 2026 - Present",
    points: [
      "Creating structured documentation including process flows, user stories, feature lists, and SRS/SDD.",
      "Ensuring product quality by validating requirements and identifying requirement gaps.",
      "Engaging with clients through workshops, interviews, and site visits.",
    ],
  },
  {
    role: "Associate Business Analyst",
    company: "SELISE DIGITAL",
    period: "April 2025 - December 2026",
    points: [
      "Led ERP-based application development with end-to-end requirement alignment.",
      "Collaborated with PM, Development, QA, and UI/UX teams throughout the project lifecycle.",
      "Led client-facing walkthroughs, validation sessions, and feedback discussions.",
    ],
  },
  {
    role: "Sales Executive",
    company: "Urban Academy",
    period: "November 2024 - January 2025",
    points: [
      "Drove sales and marketing strategies for online course offerings.",
      "Engaged with potential customers to increase course enrollments.",
      "Developed and implemented effective promotional campaigns.",
    ],
  },
  {
    role: "Associate Product Analyst",
    company: "Genesis Expo",
    period: "April 2024 - December 2024",
    points: [
      "Worked in a tech-based company focused on data-driven decision-making.",
      "Analyzed and improved business processes to enhance operational efficiency.",
      "Collaborated with cross-functional teams to support pitch decks.",
    ],
  },
  {
    role: "Product Designer (Part Time)",
    company: "ISD Corporation",
    period: "July 2024 - December 2024",
    points: [
      "Designed the company logo and business card for a professional brand identity.",
      "Used Photoshop, Illustrator, and Canva to create high-quality designs.",
      "Contributed to visual branding and marketing materials.",
    ],
  },
  {
    role: "E-Business Model Developer",
    company: "Smart Shurokkha",
    period: "September 2023 - May 2024",
    points: [
      "Designed a complete e-business model for Smart Shurokkha.",
      "Developed digital strategies for product marketing, sales, and customer engagement.",
      "Integrated e-commerce and online service solutions to support business growth.",
    ],
  },
];

const SKILLS = [
  {
    category: "Communication & Language",
    items: [
      "English-Bengali Bilingual",
      "Complex Idea Simplification",
      "Stakeholder Communication",
    ],
  },
  {
    category: "Analytical & Documentation",
    items: [
      "Requirement Analysis",
      "Logical Structuring",
      "Technical Documentation",
      "Detail Orientation",
    ],
  },
  {
    category: "Technical Proficiency",
    items: [
      "MS Word & Excel",
      "Google Sheets",
      "Productivity Tools",
      "Rapid Technology Learning",
    ],
  },
  {
    category: "Process & Systems",
    items: [
      "Software System Analysis",
      "Technical Process Documentation",
      "Workflow Structuring",
    ],
  },
  {
    category: "Marketing & Brand",
    items: [
      "Digital Marketing",
      "Product Design",
      "Marketing Strategy",
      "Brand Development",
    ],
  },
  {
    category: "Graphic Design",
    items: ["Logo Design", "Canva Expert", "Photoshop", "Illustrator"],
  },
];

const PROJECTS = [
  {
    title: "ERP-Based Application Development",
    company: "SELISE DIGITAL",
    description:
      "End-to-end requirement alignment for an ERP solution with PM, Development, QA, and UI/UX teams. Supported walkthroughs, validation sessions, UAT, piloting, and deployment.",
    tags: ["ERP", "Requirements", "Stakeholder Management", "UAT"],
  },
  {
    title: "Cross-Domain Client Operations",
    company: "SELISE DIGITAL",
    description:
      "Managed requirements for a Japanese service-based web application alongside a crypto payment gateway, combining support operations, structured documentation, and fintech coordination.",
    tags: ["Fintech", "Web Services", "Documentation", "Agile/Scrum"],
  },
  {
    title: "E-Business Model for Smart Shurokkha",
    company: "Smart Shurokkha",
    description:
      "Created a complete e-business strategy covering product marketing, sales, customer engagement, and e-commerce integration to support business growth.",
    tags: ["E-Business", "Digital Strategy", "Marketing", "E-Commerce"],
  },
];

function useInView(threshold = 0.18) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  return [ref, inView];
}

function Section({ id, children, className = "" }) {
  const [ref, inView] = useInView();

  return (
    <section
      id={id}
      ref={ref}
      className={`section ${inView ? "visible" : ""} ${className}`.trim()}
    >
      {children}
    </section>
  );
}

export default function App() {
  const [activeNav, setActiveNav] = useState("About");
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24);

      NAV_LINKS.forEach((item) => {
        const section = document.getElementById(item.toLowerCase());
        if (!section) return;

        const top = section.offsetTop - 180;
        const bottom = top + section.offsetHeight;

        if (window.scrollY >= top && window.scrollY < bottom) {
          setActiveNav(item);
        }
      });
    };

    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id.toLowerCase())?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    setMenuOpen(false);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setSent(true);
    setFormData({ name: "", email: "", message: "" });
    window.setTimeout(() => setSent(false), 4000);
  };

  return (
    <div className="app-shell">
      <div className="page-orb orb-one" aria-hidden="true" />
      <div className="page-orb orb-two" aria-hidden="true" />
      <div className="page-grid" aria-hidden="true" />

      <nav className={scrolled ? "site-nav scrolled" : "site-nav"}>
        <button className="nav-logo" onClick={() => scrollTo("about")}>
          Rafi.
        </button>

        <button
          className={`hamburger ${menuOpen ? "open" : ""}`}
          onClick={() => setMenuOpen((open) => !open)}
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
        >
          <span />
          <span />
          <span />
        </button>

        <ul className={`nav-links ${menuOpen ? "open" : ""}`}>
          {NAV_LINKS.map((item) => (
            <li key={item}>
              <button
                className={activeNav === item ? "active" : ""}
                onClick={() => scrollTo(item)}
              >
                {item}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <main>
        <Section id="about" className="hero-section">
          <div className="hero-copy motion-enter">
            <p className="eyebrow">Business Analyst Portfolio</p>
            <h1>
              MD. Momtasir
              <span>Rahman Rafi</span>
            </h1>
            <p className="hero-text">
              I bridge business goals and technical execution through requirement
              analysis, stakeholder engagement, structured documentation, and
              product thinking across ERP, fintech, and digital service teams.
            </p>

            <div className="hero-actions">
              <button className="btn btn-solid" onClick={() => scrollTo("contact")}>
                Get in touch
              </button>
              <button
                className="btn btn-outline"
                onClick={() => scrollTo("projects")}
              >
                View projects
              </button>
            </div>

            <div className="hero-metrics">
              <div>
                <strong>6+</strong>
                <span>roles and major projects</span>
              </div>
              <div>
                <strong>3 years</strong>
                <span>of cross-functional experience</span>
              </div>
              <div>
                <strong>ERP + Fintech</strong>
                <span>domain exposure</span>
              </div>
            </div>
          </div>

          <aside className="hero-panel">
            <div className="panel-card photo-card motion-enter motion-delay-1">
              <img
                src={profilePhoto}
                alt="MD. Momtasir Rahman Rafi"
                className="profile-photo"
              />
            </div>

            <div className="panel-card intro-card motion-enter motion-delay-2">
              <p className="card-label">Current focus</p>
              <h2>Documentation, merchant enablement, and requirement quality</h2>
              <p>
                Building structured process documents, feature definitions, and
                delivery clarity for teams that need business and technical
                alignment.
              </p>
            </div>

            <div className="panel-card profile-card motion-enter motion-delay-3">
              <p className="card-label">Based in</p>
              <h3>Bashundhara, Dhaka</h3>
              <p>Available for business analysis, product, and documentation roles.</p>
              <div className="profile-pills">
                <span>Requirements</span>
                <span>ERP</span>
                <span>Stakeholders</span>
                <span>Documentation</span>
              </div>
            </div>
          </aside>
        </Section>

        <Section id="experience">
          <p className="section-kicker">Career path</p>
          <div className="section-heading">
            <h2>Work experience shaped by delivery, communication, and structure.</h2>
            <p>
              A progression from business operations and design into product,
              process, and analyst responsibilities.
            </p>
          </div>

          <div className="timeline">
            {EXPERIENCES.map((exp, index) => (
              <article
                className="timeline-item"
                key={`${exp.company}-${exp.role}`}
                style={{ transitionDelay: `${index * 90}ms` }}
              >
                <div className="timeline-marker" aria-hidden="true" />
                <div className="timeline-head">
                  <div>
                    <p className="timeline-role">{exp.role}</p>
                    <p className="timeline-company">{exp.company}</p>
                  </div>
                  <span className="timeline-period">{exp.period}</span>
                </div>
                <ul className="timeline-points">
                  {exp.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </Section>

        <Section id="skills">
          <p className="section-kicker">Capabilities</p>
          <div className="section-heading">
            <h2>Skills built around clarity, analysis, and execution.</h2>
            <p>
              The mix of communication, documentation, and business systems work
              that helps teams move faster.
            </p>
          </div>

          <div className="skills-grid">
            {SKILLS.map((skill, index) => (
              <article
                className="skill-card"
                key={skill.category}
                style={{ transitionDelay: `${index * 70}ms` }}
              >
                <p className="skill-category">{skill.category}</p>
                <div className="skill-tags">
                  {skill.items.map((item) => (
                    <span className="skill-tag" key={item}>
                      {item}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </Section>

        <Section id="projects">
          <p className="section-kicker">Highlights</p>
          <div className="section-heading">
            <h2>Projects that show domain range and structured problem solving.</h2>
            <p>
              Selected work across ERP delivery, fintech coordination, and digital
              business strategy.
            </p>
          </div>

          <div className="projects-grid">
            {PROJECTS.map((project, index) => (
              <article
                className="project-card"
                key={project.title}
                style={{ transitionDelay: `${index * 90}ms` }}
              >
                <span className="project-index">0{index + 1}</span>
                <p className="project-company">{project.company}</p>
                <h3>{project.title}</h3>
                <p>{project.description}</p>
                <div className="project-tags">
                  {project.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </Section>

        <Section id="contact">
          <p className="section-kicker">Let's connect</p>
          <div className="contact-layout">
            <div className="contact-copy">
              <h2>Open to opportunities, collaboration, and thoughtful conversations.</h2>
              <p>
                If you are hiring for a business analyst, documentation, or product
                support role, I would love to hear from you.
              </p>

              <div className="contact-list">
                <a href="mailto:momtasir.rafi@gmail.com">momtasir.rafi@gmail.com</a>
                <a href="tel:+8801764368102">+880 1764 368102</a>
                <span>Bashundhara, Dhaka, Bangladesh</span>
              </div>
            </div>

            <form className="contact-form" onSubmit={handleSubmit}>
              <label>
                Name
                <input
                  type="text"
                  placeholder="Your name"
                  value={formData.name}
                  onChange={(event) =>
                    setFormData({ ...formData, name: event.target.value })
                  }
                  required
                />
              </label>

              <label>
                Email
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(event) =>
                    setFormData({ ...formData, email: event.target.value })
                  }
                  required
                />
              </label>

              <label>
                Message
                <textarea
                  placeholder="Tell me about your project or opportunity"
                  value={formData.message}
                  onChange={(event) =>
                    setFormData({ ...formData, message: event.target.value })
                  }
                  required
                />
              </label>

              {sent ? (
                <p className="sent-message">Message captured. I will get back to you soon.</p>
              ) : (
                <button className="btn btn-solid" type="submit">
                  Send message
                </button>
              )}
            </form>
          </div>
        </Section>
      </main>

      <footer className="site-footer">
        <p>(c) 2026 MD. Momtasir Rahman Rafi. Built with React and Vite.</p>
      </footer>
    </div>
  );
}
