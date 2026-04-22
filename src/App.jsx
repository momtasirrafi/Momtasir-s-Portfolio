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
    period: "April 2025 - December 2025",
    points: [
      "Led ERP-based application development with end-to-end requirement alignment.",
      "Collaborated with PM, Development, QA, and UI/UX teams throughout the project lifecycle.",
      "Led client-facing walkthroughs, validation sessions, and feedback discussions.",
    ],
    details: [
      "Spearheaded requirements gathering and end-to-end alignment for a large-scale, long-running ERP system serving Delta Security, an enterprise-level client with a multi-year, high-budget engagement spanning 6+ years.",
      "Managed and coordinated cross-functional collaboration across a 15+ member team comprising Developers, QA Engineers, Project Managers, and UI/UX Designers throughout the full project lifecycle.",
      "Led structured client-facing walkthrough sessions, user acceptance validation, and iterative feedback loops to ensure delivered features aligned with business objectives and stakeholder expectations.",
      "Translated complex business requirements into clear functional specifications, bridging the gap between Delta Security's operational needs and technical implementation by the development team.",
      "Contributed to sprint planning and backlog refinement within an agile framework, ensuring consistent delivery velocity across a large and distributed project team.",
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
    details: [
      "Drove end-to-end sales and marketing strategies for online course offerings, contributing to measurable growth in course enrollments through targeted outreach and customer engagement.",
      "Engaged proactively with prospective learners to understand their learning goals, recommending suitable courses and converting leads into enrolled students.",
      "Organized and executed 3-4 marketing campaigns across Facebook and Email channels, generating 50+ qualified leads and significantly expanding course visibility and audience reach.",
      "Planned and delivered multiple promotional projects end-to-end, coordinating creative assets, messaging, and distribution timelines to maximize campaign impact across digital channels.",
      "Leveraged the role as an opportunity to strengthen technical and business skills, gaining hands-on exposure to digital marketing platforms and sales funnel management.",
      "Added strategic value to the organization's portfolio by contributing insights on customer behavior and market positioning to support future course offerings.",
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
    details: [
      "Worked in a technology-focused environment supporting data-driven decision-making and business process improvement initiatives.",
      "Analyzed operational workflows and identified opportunities to enhance efficiency, structure, and overall business performance.",
      "Collaborated with cross-functional teams to gather insights, align business needs, and support strategic planning activities.",
      "Contributed to the preparation of pitch decks and business presentation materials by organizing key information, research findings, and value-driven content.",
      "Supported the translation of business requirements and operational observations into actionable recommendations for internal and client-facing use.",
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
    details: [
      "Developed business branding assets to strengthen the company's professional identity and market presence.",
      "Designed core brand materials, including the company logo and business card, ensuring a consistent and recognizable visual language.",
      "Used Photoshop, Illustrator, and Canva to produce high-quality creative assets aligned with business and branding goals.",
      "Contributed to category positioning by helping shape the visual identity of the company across branding and promotional materials.",
      "Supported marketing and communication efforts through design elements that enhanced brand consistency and audience appeal.",
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
    details: [
      "Developed a complete e-business model to support Smart Shurokkha's digital growth and long-term business strategy.",
      "Built product category structures to improve product organization, market positioning, and customer accessibility.",
      "Designed digital strategies for product marketing, sales, and customer engagement to strengthen online presence and conversion opportunities.",
      "Integrated e-commerce and online service solutions to support scalable business operations and customer convenience.",
      "Contributed to aligning business goals with digital execution by creating a more structured and growth-oriented online business framework.",
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

function useInView(threshold = 0.08) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    if (!("IntersectionObserver" in window)) {
      setInView(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      {
        threshold,
        rootMargin: "0px 0px -12% 0px",
      }
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
  const [expandedExperience, setExpandedExperience] = useState(null);

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
              <a
                href="https://www.linkedin.com/in/md-momtasir-rahman-rafi-11b904243/"
                target="_blank"
                rel="noreferrer"
                aria-label="Open LinkedIn profile"
                className="photo-link"
              >
                <img
                  src={profilePhoto}
                  alt="MD. Momtasir Rahman Rafi"
                  className="profile-photo"
                />
              </a>
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
                className={`timeline-item ${expandedExperience === exp.role ? "expanded" : ""}`}
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
                {exp.details ? (
                  expandedExperience === exp.role ? (
                    <div className="experience-detail-box">
                      <button
                        type="button"
                        className="detail-back-button"
                        onClick={() => setExpandedExperience(null)}
                      >
                        Back
                      </button>
                      <div className="experience-detail-copy">
                        {exp.details.map((detail) => (
                          <p key={detail}>{detail}</p>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="detail-open-button"
                      onClick={() => setExpandedExperience(exp.role)}
                    >
                      View project details
                    </button>
                  )
                ) : null}
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
