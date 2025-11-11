"use client";

import { ConnectButton } from "thirdweb/react";
import { client } from "@/lib/thirdweb";
import Image from "next/image";

export default function Header() {
  return (
    <header className="w-full glass border-b-2 border-white/10 backdrop-blur-xl">
      <div className="w-full px-6 sm:px-8 lg:px-12 xl:px-20 2xl:px-32">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center gap-4">
            <Image 
              src="/image/logo5.png" 
              alt="Paragon AI Logo" 
              width={56} 
              height={56}
              className="object-contain"
            />
            <div>
              <h1 className="text-h3 font-bold text-white tracking-tight">Paragon AI</h1>
              <p className="text-label text-gray-400 font-medium">The On-Chain AI Chart Analyst</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-8">
              <a href="#dashboard" className="text-body-sm font-semibold text-gray-300 hover:text-cyan-400 transition-colors">
                Dashboard
              </a>
              <a href="#analysis" className="text-body-sm font-semibold text-gray-300 hover:text-cyan-400 transition-colors">
                Analysis
              </a>
              <a href="#token" className="text-body-sm font-semibold text-gray-300 hover:text-cyan-400 transition-colors">
                Token
              </a>
            </nav>
            <ConnectButton
              client={client}
              connectButton={{
                label: "Connect Wallet",
                className: "!bg-white/10 !text-white !font-semibold !px-6 !py-3 !rounded-xl hover:!bg-white/20 !border-2 !border-white/20 transition-all shadow-lg hover:shadow-xl !text-body-sm !min-h-[48px]",
              }}
            />
          </div>
        </div>
      </div>
    </header>
  );
}

