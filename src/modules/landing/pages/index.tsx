"use client";

import { BentoGrid } from "../components/bento-grid";
import { CredentialsSection } from "../components/credentials-section";
import { FloatingDock } from "../components/floating-dock";
import { HeroSection } from "../components/hero-section";
import { MeshBackground } from "../components/mesh-background";
import { MessengerButton } from "../components/messenger-button";
import { SmoothScrollContainer } from "../components/smooth-scroll-container";
import { SoulSection } from "../components/soul-section";
import { LANDING_PORTFOLIO_DATA } from "../constants";

// TODO: Replace LANDING_PORTFOLIO_DATA with data fetched from backend API
// Example:
//   const data = await fetchPortfolioData(); // wire up to your API endpoint

export const LandingPage = () => {
  const data = LANDING_PORTFOLIO_DATA;

  return (
    <SmoothScrollContainer duration={1200} className="relative">
      {/* Background Layer */}
      <MeshBackground />

      {/* Content Layer */}
      <div className="relative z-10">
        {/* Hero Section */}
        <section id="hero" className="min-h-screen flex items-center justify-center px-4">
          <HeroSection data={data.hero} />
        </section>

        {/* Tech & Lab Section */}
        <section id="tech" className="relative min-h-screen py-20 px-4">
          <BentoGrid projects={data.projects} techStack={data.techStack} />
        </section>

        {/* Credentials Section */}
        <section id="credentials" className="relative min-h-screen py-20 px-4">
          <CredentialsSection
            education={data.education}
            publications={data.publications}
            achievements={data.achievements}
            courses={data.courses}
          />
        </section>

        {/* Soul Section */}
        <section id="soul" className="relative min-h-screen py-20 px-4">
          <SoulSection data={data.lifestyle} />
        </section>
      </div>

      {/* Floating Elements */}
      <FloatingDock />

      {/* Messenger / Chat button
          TODO: ChatTab inside MessengerButton uses placeholder AI responses.
          Wire up to your AI backend (OpenAI / Anthropic / custom LLM endpoint).
          TODO: ContactTab email form needs to connect to an email API (Resend / EmailJS / backend). */}
      <MessengerButton />
    </SmoothScrollContainer>
  );
};
