import { NextRequest, NextResponse } from "next/server";
import { client, PARA_TOKEN_ADDRESS, BASE_CHAIN_ID } from "@/lib/thirdweb";
import { getContract } from "thirdweb/contract";
import { defineChain } from "thirdweb/chains";
import { getActiveClaimCondition } from "thirdweb/extensions/erc20";

const baseChain = defineChain(BASE_CHAIN_ID);

export async function GET(request: NextRequest) {
  try {
    const contract = getContract({
      client,
      chain: baseChain,
      address: PARA_TOKEN_ADDRESS,
    });

    // Lese die aktive Claim Condition
    const claimCondition = await getActiveClaimCondition({
      contract,
    });

    // Berechne den Preis in ETH (wei zu ETH)
    const pricePerToken = claimCondition?.pricePerToken 
      ? Number(claimCondition.pricePerToken) / 1e18 
      : 0;

    // Berechne den Preis in USD (angenommen 1 ETH = 3000 USD)
    const ethPriceUsd = 3000; // TODO: Dynamisch aus API holen
    const pricePerTokenUsd = pricePerToken * ethPriceUsd;

    return NextResponse.json({
      success: true,
      claimCondition: {
        pricePerToken: pricePerToken.toString(),
        pricePerTokenUsd: pricePerTokenUsd.toFixed(2),
        currency: claimCondition?.currency || "0x0000000000000000000000000000000000000000",
        maxClaimableSupply: claimCondition?.maxClaimableSupply?.toString() || "0",
        supplyClaimed: claimCondition?.supplyClaimed?.toString() || "0",
      },
    });
  } catch (error) {
    console.error("Claim-Conditions-Fehler:", error);
    return NextResponse.json(
      { 
        error: "Fehler beim Auslesen der Claim Conditions", 
        details: error instanceof Error ? error.message : "Unbekannter Fehler" 
      },
      { status: 500 }
    );
  }
}

