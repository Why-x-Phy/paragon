"use client";

import { useState } from "react";
import { ConnectButton } from "thirdweb/react";
import { client } from "@/lib/thirdweb";
import Image from "next/image";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (targetId: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <header className="w-full glass border-b-2 border-white/10 backdrop-blur-xl" role="banner">
      <div className="w-full px-6 sm:px-8 lg:px-12 xl:px-20 2xl:px-32">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center gap-4">
            <Image 
              src="/image/logo5.png" 
              alt="Paragon AI Logo" 
              width={56} 
              height={56}
              className="object-contain"
              priority
            />
            <div>
              <h1 className="text-h3 font-bold text-white tracking-tight">Paragon AI</h1>
              <p className="text-label text-gray-400 font-medium">The On-Chain AI Chart Analyst</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8" aria-label="Main navigation">
              <a 
                href="#dashboard" 
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick("dashboard");
                }}
                className="text-body-sm font-semibold text-gray-300 hover:text-cyan-400 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-gray-900 rounded px-2 py-1"
                aria-label="Navigate to Dashboard"
              >
                Dashboard
              </a>
              <a 
                href="#analysis" 
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick("analysis");
                }}
                className="text-body-sm font-semibold text-gray-300 hover:text-cyan-400 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-gray-900 rounded px-2 py-1"
                aria-label="Navigate to Analysis"
              >
                Analysis
              </a>
              <a 
                href="#token-purchase" 
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick("token-purchase");
                }}
                className="text-body-sm font-semibold text-gray-300 hover:text-cyan-400 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-gray-900 rounded px-2 py-1"
                aria-label="Navigate to Token Purchase"
              >
                Token
              </a>
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-gray-900"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
            >
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

            {/* Connect Button */}
            <div className="hidden sm:block">
              <ConnectButton
                client={client}
                connectButton={{
                  label: "Connect Wallet",
                  className: "!bg-white/10 !text-white !font-semibold !px-6 !py-3 !rounded-xl hover:!bg-white/20 !border-2 !border-white/20 transition-all shadow-lg hover:shadow-xl !text-body-sm !min-h-[48px] focus:!outline-none focus:!ring-2 focus:!ring-cyan-400 focus:!ring-offset-2 focus:!ring-offset-gray-900",
                }}
              />
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <nav 
            className="md:hidden py-4 border-t border-white/10 mt-2 animate-fade-in-up"
            aria-label="Mobile navigation"
            role="navigation"
          >
            <div className="flex flex-col gap-4">
              <a
                href="#dashboard"
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick("dashboard");
                }}
                className="text-body-sm font-semibold text-gray-300 hover:text-cyan-400 transition-colors px-4 py-2 rounded-lg hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-gray-900"
                aria-label="Navigate to Dashboard"
              >
                Dashboard
              </a>
              <a
                href="#analysis"
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick("analysis");
                }}
                className="text-body-sm font-semibold text-gray-300 hover:text-cyan-400 transition-colors px-4 py-2 rounded-lg hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-gray-900"
                aria-label="Navigate to Analysis"
              >
                Analysis
              </a>
              <a
                href="#token-purchase"
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick("token-purchase");
                }}
                className="text-body-sm font-semibold text-gray-300 hover:text-cyan-400 transition-colors px-4 py-2 rounded-lg hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-gray-900"
                aria-label="Navigate to Token Purchase"
              >
                Token
              </a>
              <div className="pt-2 border-t border-white/10">
                <ConnectButton
                  client={client}
                  connectButton={{
                    label: "Connect Wallet",
                    className: "!w-full !bg-white/10 !text-white !font-semibold !px-6 !py-3 !rounded-xl hover:!bg-white/20 !border-2 !border-white/20 transition-all shadow-lg hover:shadow-xl !text-body-sm !min-h-[48px] focus:!outline-none focus:!ring-2 focus:!ring-cyan-400 focus:!ring-offset-2 focus:!ring-offset-gray-900",
                  }}
                />
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}

