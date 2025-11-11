"use client";

import { ThirdwebProvider } from "thirdweb/react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter, SolflareWalletAdapter, TorusWalletAdapter } from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";
import { useMemo } from "react";

// Import Wallet Adapter CSS
import "@solana/wallet-adapter-react-ui/styles.css";

function SolanaWalletProvider({ children }: { children: React.ReactNode }) {
  // You can also provide a custom RPC endpoint
  const network = WalletAdapterNetwork.Mainnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new TorusWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThirdwebProvider>
      <SolanaWalletProvider>{children}</SolanaWalletProvider>
    </ThirdwebProvider>
  );
}

