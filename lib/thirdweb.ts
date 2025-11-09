import { createThirdwebClient } from "thirdweb";

export const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || "your-client-id",
});

export const PARA_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_PARA_TOKEN_ADDRESS || "0x0000000000000000000000000000000000000000";
export const BASE_CHAIN_ID = 8453; // Base Mainnet

