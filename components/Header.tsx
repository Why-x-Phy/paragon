"use client";

import { useState, useMemo } from "react";
import { ConnectButton, useActiveAccount, useReadContract } from "thirdweb/react";
import { createWallet } from "thirdweb/wallets";
import { client, PARA_TOKEN_ADDRESS, BASE_CHAIN_ID } from "@/lib/thirdweb";
import { getContract } from "thirdweb/contract";
import { balanceOf } from "thirdweb/extensions/erc20";
import { defineChain } from "thirdweb/chains";
import Image from "next/image";

const baseChain = defineChain(BASE_CHAIN_ID);

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const account = useActiveAccount();

  // Definiere spezifische Wallets für Connect Button
  const wallets = useMemo(
    () => [
      createWallet("io.metamask"),
      createWallet("com.coinbase.wallet"),
      createWallet("me.rainbow"),
      createWallet("io.rabby"),
      createWallet("io.zerion.wallet"),
    ],
    []
  );

  // Token Balance für Credits
  const contract = useMemo(
    () =>
      getContract({
        client,
        chain: baseChain,
        address: PARA_TOKEN_ADDRESS,
      }),
    []
  );

  const { data: balance, isLoading: isLoadingBalance } = useReadContract(
    balanceOf,
    {
      contract,
      address: account?.address || "0x0000000000000000000000000000000000000000",
      queryOptions: { enabled: !!account },
    }
  );

  // Berechne Credits basierend auf Token-Balance: 1 Token = 1 Credit
  const credits = balance ? Math.floor(Number(balance) / 1e18) : 0;

  return (
    <header className="w-full glass border-b-2 border-white/10 backdrop-blur-xl" role="banner">
      <div className="w-full px-6 sm:px-8 md:px-10 lg:px-16 xl:px-24 2xl:px-40">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center gap-4 flex-shrink-0">
            <Image 
              src="/image/logo5.png" 
              alt="Paragon AI Logo" 
              width={56} 
              height={56}
              className="object-contain"
              priority
            />
            <div className="min-w-0">
              <h1 className="text-h3 font-bold text-white tracking-tight">Paragon AI</h1>
              <p className="text-label text-gray-400 font-medium">The On-Chain AI Chart Analyst</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 flex-shrink-0 !pr-[10px]">
            {/* Balance Display - nur wenn Wallet verbunden */}
            {account && (
              <div className="hidden sm:flex items-center gap-4 px-8 py-3 bg-gray-900/60 rounded-xl border border-white/10 backdrop-blur-sm !ml-[20px] min-w-[200px] shadow-lg shadow-cyan-500/10">
                {isLoadingBalance ? (
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span className="text-body-sm text-gray-400">Loading...</span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 w-full">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center flex-shrink-0 shadow-md shadow-cyan-500/20">
                        <span className="text-xs font-bold text-cyan-400">PARA</span>
                      </div>
                      <div className="flex items-baseline gap-2 flex-1 min-w-0">
                        <span className="text-h4 font-bold text-white leading-tight">{credits}</span>
                        <span className="text-body-sm text-gray-400 font-medium leading-tight">Credits</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

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
            <div className="hidden sm:block !pr-[10px]">
              <ConnectButton
                client={client}
                connectButton={{
                  label: "Connect Wallet",
                  className: "!bg-white/10 !text-white !font-semibold !px-6 !py-3 !rounded-xl hover:!bg-white/20 !border-2 !border-white/20 transition-all shadow-lg hover:shadow-xl !text-body-sm !min-h-[48px] focus:!outline-none focus:!ring-2 focus:!ring-cyan-400 focus:!ring-offset-2 focus:!ring-offset-gray-900",
                }}
                connectModal={{
                  showThirdwebBranding: false,
                  size: "compact",
                  title: "Paragon AI",
                }}
                wallets={wallets}
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
              {/* Mobile Balance Display */}
              {account && (
                <div className="flex items-center justify-between px-8 py-4 bg-gray-900/60 rounded-xl border border-white/10 min-w-[200px] shadow-lg shadow-cyan-500/10">
                  {isLoadingBalance ? (
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span className="text-body-sm text-gray-400">Loading...</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 w-full">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center flex-shrink-0 shadow-md shadow-cyan-500/20">
                          <span className="text-xs font-bold text-cyan-400">PARA</span>
                        </div>
                        <div className="flex items-baseline gap-2 flex-1 min-w-0">
                          <span className="text-h4 font-bold text-white leading-tight">{credits}</span>
                          <span className="text-body-sm text-gray-400 font-medium leading-tight">Credits</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
              <div className="pt-2 border-t border-white/10 !px-[10px]">
                <ConnectButton
                  client={client}
                  connectButton={{
                    label: "Connect Wallet",
                    className: "!w-full !bg-white/10 !text-white !font-semibold !px-6 !py-3 !rounded-xl hover:!bg-white/20 !border-2 !border-white/20 transition-all shadow-lg hover:shadow-xl !text-body-sm !min-h-[48px] focus:!outline-none focus:!ring-2 focus:!ring-cyan-400 focus:!ring-offset-2 focus:!ring-offset-gray-900",
                  }}
                  connectModal={{
                    showThirdwebBranding: false,
                    size: "compact",
                    title: "Paragon AI",
                  }}
                  wallets={wallets}
                />
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}

