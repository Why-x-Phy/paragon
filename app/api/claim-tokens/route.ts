import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, quantity, contractAddress, chainId } = body;

    // Validierung
    if (!walletAddress || !quantity || !contractAddress || !chainId) {
      return NextResponse.json(
        { error: "Alle Parameter sind erforderlich" },
        { status: 400 }
      );
    }

    const secretKey = process.env.THIRDWEB_SECRET_KEY;
    
    if (!secretKey) {
      return NextResponse.json(
        { error: "Thirdweb Secret Key nicht konfiguriert" },
        { status: 500 }
      );
    }

    // Thirdweb API Call für Contract Write
    // Verwende die claim Methode mit allen erforderlichen Parametern
    const response = await fetch("https://api.thirdweb.com/v1/contracts/write", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-secret-key": secretKey,
      },
      body: JSON.stringify({
        calls: [
          {
            contractAddress: contractAddress,
            method:
              "function claim(address _receiver, uint256 _quantity, address _currency, uint256 _pricePerToken, (bytes32[] proof, uint256 quantityLimitPerWallet, uint256 pricePerToken, address currency) _allowlistProof, bytes _data) payable",
            params: [
              walletAddress, // _receiver
              quantity, // _quantity
              "0x0000000000000000000000000000000000000000", // _currency (ETH/Base native)
              "0", // _pricePerToken (Claim Conditions bestimmen den Preis)
              {
                proof: [],
                quantityLimitPerWallet: "0",
                pricePerToken: "0",
                currency: "0x0000000000000000000000000000000000000000",
              }, // _allowlistProof
              "0x", // _data (empty bytes)
            ],
            value: "0", // ETH value (Claim Conditions bestimmen den Preis)
          },
        ],
        chainId: chainId,
        from: walletAddress,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Thirdweb API Error:", data);
      return NextResponse.json(
        { error: data.error || "Fehler bei der Thirdweb API" },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      transactionHash: data.result?.transactionHash || data.transactionHash,
      data: data,
    });
  } catch (error) {
    console.error("Claim-Tokens-Fehler:", error);
    return NextResponse.json(
      { error: "Fehler beim Token-Kauf", details: error instanceof Error ? error.message : "Unbekannter Fehler" },
      { status: 500 }
    );
  }
}

