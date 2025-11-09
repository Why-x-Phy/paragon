"use client";

import { ConnectButton } from "thirdweb/react";
import { client } from "@/lib/thirdweb";

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10 backdrop-blur-xl">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-white/15 to-white/5 flex items-center justify-center border border-white/20 shadow-lg">
              <span className="text-2xl font-bold text-white">⚡</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">Paragon AI</h1>
              <p className="text-xs text-gray-400 font-medium">The On-Chain AI Chart Analyst</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-8">
              <a href="#dashboard" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
                Dashboard
              </a>
              <a href="#analysen" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
                Analysen
              </a>
              <a href="#token" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
                Token
              </a>
            </nav>
            <ConnectButton
              client={client}
              connectButton={{
                label: "Wallet verbinden",
                className: "!bg-white/10 !text-white !font-semibold !px-6 !py-3 !rounded-xl hover:!bg-white/20 !border !border-white/20 transition-all shadow-lg hover:shadow-xl",
              }}
            />
          </div>
        </div>
      </div>
    </header>
  );
}

