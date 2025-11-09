"use client";

import { useActiveAccount } from "thirdweb/react";
import { useState } from "react";

const PACKAGES = [
  { tokens: 1000, price: 10, label: "Starter" },
  { tokens: 5000, price: 50, label: "Pro", popular: true },
  { tokens: 10000, price: 100, label: "Enterprise" },
];

export default function TokenPurchase() {
  const account = useActiveAccount();
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);

  const handlePurchase = async (pkg: typeof PACKAGES[0]) => {
    if (!account) {
      alert("Bitte verbinde zuerst deine Wallet");
      return;
    }

    // TODO: Thirdweb Pay Integration
    alert(`Kauf von ${pkg.tokens} PARA Tokens für $${pkg.price} wird implementiert...`);
  };

  if (!account) {
    return (
      <div className="glass rounded-xl p-8 border border-white/10">
        <div className="text-center py-4">
          <p className="text-sm text-gray-400 mb-2">Bitte verbinde deine Wallet</p>
          <p className="text-xs text-gray-500">um Token-Pakete zu kaufen</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl p-8 border border-white/10">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-1">Token kaufen</h3>
        <p className="text-sm text-gray-400">Wähle ein Paket und zahle mit Thirdweb Pay</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PACKAGES.map((pkg, index) => (
          <div
            key={index}
            className={`relative rounded-lg p-5 border transition-all cursor-pointer ${
              selectedPackage === index
                ? "border-white/30 bg-white/10"
                : "border-white/10 bg-gray-900/50 hover:border-white/20"
            } ${pkg.popular ? "ring-2 ring-white/20" : ""}`}
            onClick={() => setSelectedPackage(index)}
          >
            {pkg.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-white/10 text-white text-xs font-semibold px-3 py-1 rounded-full border border-white/20">
                  Beliebt
                </span>
              </div>
            )}
            <div className="text-center mb-4">
              <div className="text-2xl font-bold text-white mb-1">{pkg.tokens.toLocaleString()}</div>
              <div className="text-sm text-gray-400">PARA Tokens</div>
            </div>
            <div className="text-center mb-4">
              <div className="text-xl font-semibold text-white">${pkg.price}</div>
              <div className="text-xs text-gray-500">USD</div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePurchase(pkg);
              }}
              className={`w-full py-2.5 rounded-lg font-semibold transition-all ${
                selectedPackage === index
                  ? "bg-white/10 text-white border border-white/20 hover:bg-white/20"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              Kaufen
            </button>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <p className="text-xs text-blue-400">
          💡 Zahlungen über Base, BSC, Polygon, Arbitrum und mehr möglich via Universal Bridge
        </p>
      </div>
    </div>
  );
}

