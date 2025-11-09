"use client";

import { ConnectButton } from "thirdweb/react";
import { client } from "@/lib/thirdweb";

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center glow">
              <span className="text-xl font-bold text-white">⚡</span>
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text">Paragon AI</h1>
              <p className="text-xs text-gray-400">The On-Chain AI Chart Analyst</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <nav className="hidden md:flex items-center gap-6">
              <a href="#dashboard" className="text-sm text-gray-300 hover:text-white transition-colors">
                Dashboard
              </a>
              <a href="#analysen" className="text-sm text-gray-300 hover:text-white transition-colors">
                Analysen
              </a>
              <a href="#token" className="text-sm text-gray-300 hover:text-white transition-colors">
                Token
              </a>
            </nav>
            <ConnectButton
              client={client}
              connectButton={{
                label: "Wallet verbinden",
                className: "!bg-gradient-to-r !from-indigo-600 !to-purple-600 !text-white !font-semibold !px-6 !py-2 !rounded-lg hover:!from-indigo-500 hover:!to-purple-500 transition-all glow-hover",
              }}
            />
          </div>
        </div>
      </div>
    </header>
  );
}

