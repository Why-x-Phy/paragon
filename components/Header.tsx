"use client";

import { ConnectButton } from "thirdweb/react";
import { client } from "@/lib/thirdweb";

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10">
      <div className="w-full px-6 sm:px-8 lg:px-12 xl:px-16 2xl:px-24">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center border border-white/20">
              <span className="text-xl font-bold text-white">⚡</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Paragon AI</h1>
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
                className: "!bg-white/10 !text-white !font-semibold !px-6 !py-2 !rounded-lg hover:!bg-white/20 !border !border-white/20 transition-all",
              }}
            />
          </div>
        </div>
      </div>
    </header>
  );
}

