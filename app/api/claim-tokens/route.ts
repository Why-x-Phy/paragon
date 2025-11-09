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

    // Lade Secret Key aus Umgebungsvariablen
    // Prüfe auch NEXT_PUBLIC_ Variante für Fallback
    const secretKey = process.env.THIRDWEB_SECRET_KEY || process.env.NEXT_PUBLIC_THIRDWEB_SECRET_KEY;
    
    // Debug: Log alle verfügbaren Env-Variablen (ohne Werte)
    console.log("Environment Variables Check:", {
      hasTHIRDWEB_SECRET_KEY: !!process.env.THIRDWEB_SECRET_KEY,
      hasNEXT_PUBLIC_THIRDWEB_SECRET_KEY: !!process.env.NEXT_PUBLIC_THIRDWEB_SECRET_KEY,
      secretKeyLength: secretKey?.length || 0,
    });
    
    if (!secretKey) {
      // Versuche auch direkt aus .env.local zu lesen (falls Next.js es nicht lädt)
      const allEnvKeys = Object.keys(process.env).filter(key => key.includes('THIRDWEB'));
      console.error("THIRDWEB_SECRET_KEY nicht gefunden. Verfügbare Env-Vars:", allEnvKeys);
      
      return NextResponse.json(
        { 
          error: "Thirdweb Secret Key nicht konfiguriert.",
          hint: "Bitte füge THIRDWEB_SECRET_KEY=0EU34F-xx0uQJgJ7qmkrWH4uHonpSJ1_oBgtM44H8wEYgRhZJkbl6PNjhoORDGYXKy43ExExiqF65-xiHIcAag in .env.local hinzu und starte den Server neu.",
          debug: {
            hasTHIRDWEB_SECRET_KEY: !!process.env.THIRDWEB_SECRET_KEY,
            hasNEXT_PUBLIC_THIRDWEB_SECRET_KEY: !!process.env.NEXT_PUBLIC_THIRDWEB_SECRET_KEY,
            availableKeys: allEnvKeys,
          }
        },
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
              [
                [], // proof: bytes32[] (empty array)
                "0", // quantityLimitPerWallet: uint256
                "0", // pricePerToken: uint256
                "0x0000000000000000000000000000000000000000", // currency: address
              ], // _allowlistProof as array
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

    // Log die komplette Response für Debugging
    console.log("Thirdweb API Response Status:", response.status);
    console.log("Thirdweb API Response Data:", JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error("Thirdweb API Error:", JSON.stringify(data, null, 2));
      console.error("Request Body:", JSON.stringify({
        calls: [{
          contractAddress,
          method: "function claim(...)",
          params: [
            walletAddress,
            quantity,
            "0x0000000000000000000000000000000000000000",
            "0",
            [[], "0", "0", "0x0000000000000000000000000000000000000000"],
            "0x",
          ],
        }],
        chainId,
        from: walletAddress,
      }, null, 2));
      
      return NextResponse.json(
        { 
          error: data.error?.message || data.error || "Fehler bei der Thirdweb API",
          details: data.error?.details || data,
        },
        { status: response.status }
      );
    }

    // Thirdweb API gibt verschiedene Response-Strukturen zurück
    // Die API kann transactionIds (UUIDs) zurückgeben, die wir dann abfragen müssen
    let transactionHash = null;
    let transactionId = null;
    
    // Prüfe ob data.result transactionIds enthält
    if (data.result?.transactionIds && Array.isArray(data.result.transactionIds) && data.result.transactionIds.length > 0) {
      transactionId = data.result.transactionIds[0];
      console.log("Transaction ID erhalten:", transactionId);
      
      // Versuche den Transaction Status abzurufen, um den Hash zu bekommen
      try {
        const statusResponse = await fetch(`https://api.thirdweb.com/v1/transactions/${transactionId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-secret-key": secretKey,
          },
        });
        
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          console.log("Transaction Status:", JSON.stringify(statusData, null, 2));
          
          // Prüfe verschiedene mögliche Felder für den Hash
          transactionHash = 
            statusData.result?.transactionHash ||
            statusData.result?.hash ||
            statusData.result?.receipt?.transactionHash ||
            statusData.transactionHash ||
            statusData.hash ||
            statusData.receipt?.transactionHash;
        }
      } catch (statusError) {
        console.error("Fehler beim Abrufen des Transaction Status:", statusError);
      }
    }
    
    // Fallback: Prüfe ob data.result ein Array ist (mehrere Calls)
    if (!transactionHash && Array.isArray(data.result)) {
      const firstResult = data.result[0];
      transactionHash = 
        firstResult?.transactionHash || 
        firstResult?.hash ||
        firstResult?.transaction?.hash ||
        firstResult?.txHash ||
        firstResult?.receipt?.transactionHash;
    }
    // Prüfe ob data.result ein Objekt ist
    else if (!transactionHash && data.result && typeof data.result === 'object') {
      transactionHash = 
        data.result.transactionHash || 
        data.result.hash ||
        data.result.transaction?.hash ||
        data.result.txHash ||
        data.result.receipt?.transactionHash ||
        data.result[0]?.transactionHash ||
        data.result[0]?.hash;
    }
    
    // Fallback: Prüfe direkt im data Objekt
    if (!transactionHash) {
      transactionHash = 
        data.transactionHash || 
        data.txHash ||
        data.hash ||
        data.transaction?.hash ||
        data.receipt?.transactionHash ||
        data.data?.transactionHash ||
        data.data?.hash ||
        data.data?.transaction?.hash ||
        data.results?.[0]?.transactionHash ||
        data.results?.[0]?.hash;
    }

    // Wenn wir eine Transaction ID haben, aber noch keinen Hash, geben wir die ID zurück
    if (!transactionHash && transactionId) {
      return NextResponse.json({
        success: true,
        pending: true,
        transactionId: transactionId,
        message: "Transaction wurde erstellt. Warte auf Bestätigung...",
        data: data,
      });
    }

    // Wenn immer noch kein Hash, könnte es ein async Response sein
    // Prüfe auf "id" oder "taskId" für async operations
    if (!transactionHash && (data.id || data.taskId)) {
      return NextResponse.json({
        success: true,
        pending: true,
        taskId: data.id || data.taskId,
        message: "Transaction wird verarbeitet. Bitte warte auf Bestätigung.",
        data: data,
      });
    }

    if (!transactionHash) {
      console.error("No transaction hash in response. Full response:", JSON.stringify(data, null, 2));
      // Gib die komplette Response zurück, damit wir im Frontend debuggen können
      return NextResponse.json(
        { 
          error: "Keine Transaction Hash in der API-Antwort erhalten",
          details: data,
          hint: "Die API-Antwort könnte eine andere Struktur haben. Bitte prüfe die Console-Logs.",
          fullResponse: data, // Für Debugging
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      transactionHash: transactionHash,
      transactionId: transactionId,
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

