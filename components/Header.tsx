"use client";

import { ConnectButton } from "thirdweb/react";
import { client } from "@/lib/thirdweb";

export default function Header() {
  return (
    <header className="w-full glass border-b border-white/10 backdrop-blur-xl">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-white/15 to-white/5 flex items-center justify-center border border-white/20 shadow-lg">
              <span className="text-xl font-bold text-white">⚡</span>
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight">Paragon AI</h1>
              <p className="text-[10px] text-gray-400 font-medium">The On-Chain AI Chart Analyst</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <nav className="hidden md:flex items-center gap-6">
              <a href="#dashboard" className="text-xs font-medium text-gray-300 hover:text-white transition-colors">
                Dashboard
              </a>
              <a href="#analysis" className="text-xs font-medium text-gray-300 hover:text-white transition-colors">
                Analysis
              </a>
              <a href="#token" className="text-xs font-medium text-gray-300 hover:text-white transition-colors">
                Token
              </a>
            </nav>
            <ConnectButton
              client={client}
              connectButton={{
                label: "Connect Wallet",
                className: "!bg-white/10 !text-white !font-semibold !px-4 !py-2 !rounded-lg hover:!bg-white/20 !border !border-white/20 transition-all shadow-lg hover:shadow-xl !text-xs",
              }}
            />
          </div>
        </div>
      </div>
    </header>
  );
}

