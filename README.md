# ⚡ Paragon AI

### The On-Chain AI Chart Analyst

**Paragon AI** ist eine hochmoderne Web-App, die Live-Marktdaten mit künstlicher Intelligenz kombiniert, um Tradern klare, datenbasierte Chart-Analysen zu liefern.

Jede Analyse kostet Punkte („Credits"), die mit einem eigenen ERC-20-Token auf der **Base-Chain** bezahlt werden können.

Die Nutzer verbinden einfach ihre Wallet, wählen einen Markt aus – und Paragon AI liefert eine smarte, KI-gestützte Einschätzung zu Momentum, Volumen und Trendrichtung.

---

## 🚀 Features

- 🔗 **Wallet-Login (Thirdweb Connect)** - Unterstützung für Metamask, Rabby, Phantom, Rainbow und mehr
- 💰 **Token-Bezahlung** - Credits mit PARA Token auf Base bezahlen
- 🧠 **AI Chart-Analyzer** - KI-gestützte Analysen mit RSI, MACD, EMA Indikatoren
- 📊 **Live-Charts** - TradingView Widget Integration für Echtzeit-Charts
- 💳 **Token-Pakete** - Flexible Kaufoptionen (1.000 / 5.000 / 10.000 Tokens)
- 🌉 **Universal Bridge** - Zahlungen über verschiedene Chains möglich

---

## 🏗️ Tech-Stack

- **Frontend**: Next.js 13 (App Router), React 19, TypeScript, Tailwind CSS 4
- **Blockchain**: Thirdweb SDK v5, Base Chain (EVM)
- **Wallets**: Thirdweb Connect (Metamask, Rabby, Phantom, Rainbow)
- **Charts**: TradingView Widget
- **Styling**: Tailwind CSS mit Glass Morphism & Gradient Effects

---

## 📦 Installation

1. **Repository klonen**
```bash
git clone https://github.com/dein-username/paragon.git
cd paragon
```

2. **Dependencies installieren**
```bash
npm install
```

3. **Umgebungsvariablen konfigurieren**

Erstelle eine `.env.local` Datei:

```env
# Thirdweb Client ID (erforderlich)
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your-thirdweb-client-id

# Para Token Address (Base Mainnet)
NEXT_PUBLIC_PARA_TOKEN_ADDRESS=0x0000000000000000000000000000000000000000
```

4. **Development Server starten**
```bash
npm run dev
```

Die App läuft dann auf [http://localhost:3000](http://localhost:3000)

---

## 🔧 Konfiguration

### Thirdweb Client ID

1. Erstelle einen Account auf [thirdweb.com](https://thirdweb.com)
2. Gehe zu Dashboard → Settings → API Keys
3. Kopiere deine Client ID in die `.env.local` Datei

### Para Token Deployment

Der PARA Token muss auf Base Mainnet deployed werden:

1. Verwende Thirdweb Dashboard oder CLI
2. Deploy einen ERC-20 Token auf Base
3. Kopiere die Contract-Adresse in `.env.local`

---

## 📁 Projektstruktur

```
paragon/
├── app/
│   ├── api/
│   │   └── analyze/
│   │       └── route.ts          # Backend API für AI-Analysen
│   ├── layout.tsx                 # Root Layout mit Providers
│   ├── page.tsx                   # Hauptseite / Dashboard
│   ├── providers.tsx              # Thirdweb Provider
│   └── globals.css                # Globale Styles
├── components/
│   ├── Header.tsx                 # Navigation & Wallet-Connect
│   ├── TokenBalance.tsx           # Token-Balance Anzeige
│   ├── CreditStatus.tsx           # Credit-Status & Progress
│   ├── ChartPanel.tsx             # TradingView Chart Widget
│   ├── AnalysisPanel.tsx          # AI-Analyse Panel
│   └── TokenPurchase.tsx          # Token-Kauf Komponente
├── lib/
│   └── thirdweb.ts                # Thirdweb Client Konfiguration
└── README.md
```

---

## 🎨 Design-Features

- **Glass Morphism** - Moderne Glass-Effekte für UI-Komponenten
- **Gradient Text** - Indigo-Purple Gradient für Headlines
- **Glow Effects** - Subtile Glow-Effekte für interaktive Elemente
- **Dark Theme** - Professionelles Dark Theme mit hohem Kontrast
- **Responsive Design** - Mobile-first, vollständig responsive

---

## 🔄 Nächste Schritte

### Backend Integration

- [ ] Supabase Setup für User-Credits & Analyse-History
- [ ] Binance API Integration für Live-Marktdaten
- [ ] Indikator-Berechnung (RSI, MACD, EMA)
- [ ] OpenAI/Claude API Integration für AI-Analysen

### Smart Contracts

- [ ] PARA Token Deployment auf Base
- [ ] Thirdweb Pay Integration für Token-Käufe
- [ ] Universal Bridge Setup für Cross-Chain Payments

### Features

- [ ] Analyse-History anzeigen
- [ ] Leaderboard / Gamification
- [ ] Mehr Markt-Paare
- [ ] Erweiterte Indikatoren

---

## ⚠️ Disclaimer

Paragon AI bietet **keine Finanz- oder Anlageberatung**. Alle Analysen sind algorithmisch generierte technische Einschätzungen. Trading erfolgt auf eigenes Risiko.

---

## 📄 Lizenz

MIT License

---

## 🤝 Contributing

Contributions sind willkommen! Bitte erstelle einen Pull Request oder öffne ein Issue.

---

**Powered by Thirdweb, Base, und Paragon AI Token (PARA)** ⚡
