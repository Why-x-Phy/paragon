import { createThirdwebClient } from "thirdweb";

export const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || "5fd5ad15bea63a2b9106d3547aebe43e",
});

export const PARA_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_PARA_TOKEN_ADDRESS || "0xB9FB73448d478312c1d3a747EbE795A97276Eb51";
export const BASE_CHAIN_ID = 8453; // Base Mainnet

