import type { LandingPortfolioData } from "../types";

/**
 * Static portfolio data - replace with real data or API integration later
 * TODO: Connect to backend API to fetch dynamic portfolio data
 */
export const LANDING_PORTFOLIO_DATA: LandingPortfolioData = {
  hero: {
    name: "Your Name",
    title: "AI Engineer @ Your Company",
    tagline:
      "Building Agentic AI systems that automate complex workflows. Bridging cutting-edge GenAI with robust production systems.",
    avatar: "/vercel.svg",
    location: "Ho Chi Minh City, Vietnam",
  },

  education: {
    school: "VNU-HCM University of Information Technology",
    degree: "BS in Computer Science",
    period: "2020 - 2024",
    gpa: "8.42/10",
    rank: "Top 10/32 graduating students",
    coursework: [
      "Deep Learning Techniques",
      "Advanced Computer Vision",
      "Probability and Statistics",
      "Python for ML",
      "Data Mining",
    ],
  },

  techStack: [
    { name: "Python", icon: "python", category: "language" },
    { name: "TypeScript", icon: "typescript", category: "language" },
    { name: "Pydantic-AI", icon: "python", category: "ai" },
    { name: "PyTorch", icon: "pytorch", category: "ai" },
    { name: "FastAPI", icon: "fastapi", category: "backend" },
    { name: "Next.js", icon: "nextjs", category: "frontend" },
    { name: "PostgreSQL", icon: "postgres", category: "database" },
    { name: "Docker", icon: "docker", category: "devops" },
    { name: "Kubernetes", icon: "k8s", category: "devops" },
    { name: "Ragflow", icon: "ai", category: "ai" },
  ],

  projects: [
    {
      id: "1",
      title: "Agentic AI System @ Your Company",
      description:
        "Production system automating Customer Experience workflows with Human-in-the-loop tool execution and RAG integration",
      tags: ["Pydantic-AI", "OpenRouter", "Ragflow", "HITL"],
    },
    {
      id: "2",
      title: "VuSEO Automation",
      description:
        "AI-Agent powered SEO automation processing 40-50 articles/day with Google Workspace integration",
      tags: ["Python", "Strapi", "Google API", "AI Agent"],
    },
    {
      id: "3",
      title: "Homelab Infrastructure",
      description:
        "Self-hosted services on Kubernetes with monitoring via k9s, Kibana, and Logfire",
      tags: ["Docker", "K8s", "Terraform", "Monitoring"],
    },
  ],

  publications: [
    {
      title:
        "Empirical Study of the Performance of Object Detection Methods on Road Marking Dataset",
      venue: "IEEE RIVF 2022",
      doi: "10.1109/RIVF55975.2022.10013909",
      year: 2022,
    },
  ],

  achievements: [
    {
      title: "Innovation Award",
      event: "AI Tempo Run Competition",
      organization: "UIT AI Club",
      year: 2021,
    },
  ],

  courses: [
    {
      title: "Machine Learning Engineer K3",
      year: 2024,
      focus: ["Containerization", "Model Deployment", "CI/CD", "Data Engineering"],
    },
  ],

  lifestyle: {
    music: {
      instruments: ["Guitar", "Piano"],
      currentlyPlaying: "Lo-fi Beats",
    },
    routines: ["Morning: Code & Coffee", "Afternoon: Deep Work", "Evening: Music & Reading"],
  },
};

export const LANDING_SOCIAL = {
  github: "https://github.com/yourusername",
  linkedin: "https://www.linkedin.com/in/yourprofile/",
  email: "contact@yourdomain.com",
};
