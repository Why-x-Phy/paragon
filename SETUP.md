# 🚀 Paragon AI - Setup & Test Checkliste

## ✅ Was bereits implementiert ist:

### Frontend
- ✅ Next.js 13 Projekt mit TypeScript & Tailwind CSS
- ✅ Thirdweb SDK v5 Integration
- ✅ Wallet-Connect (Metamask, Rabby, Phantom, Rainbow)
- ✅ Moderne UI-Komponenten (Header, Dashboard, Charts, Analysis Panel)
- ✅ TradingView Widget Integration
- ✅ Token-Balance & Credit-Status Anzeige
- ✅ Token-Purchase Komponente

### Backend
- ✅ API Route `/api/analyze` implementiert
- ✅ Marktdaten-Integration (Binance API)
- ✅ Indikator-Berechnung (RSI, MACD, EMA, Volume-Spike)
- ✅ AI-Service Integration (OpenAI/Claude + Fallback)
- ✅ TypeScript Types definiert

### Git
- ✅ Repository auf GitHub erstellt
- ✅ Code gepusht
- ✅ SSH-Verbindung konfiguriert

---

## ⚠️ Was noch fehlt / konfiguriert werden muss:

### 1. Umgebungsvariablen (.env.local)

Erstelle eine `.env.local` Datei im Root-Verzeichnis:

```env
# ERFORDERLICH für Wallet-Connect
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=deine-thirdweb-client-id

# ERFORDERLICH nach Token-Deployment
NEXT_PUBLIC_PARA_TOKEN_ADDRESS=0x0000000000000000000000000000000000000000

# OPTIONAL - für echte AI-Analysen
OPENAI_API_KEY=dein-openai-api-key
# oder
ANTHROPIC_API_KEY=dein-anthropic-api-key

# OPTIONAL - für Binance API (bessere Rate-Limits)
BINANCE_API_KEY=dein-binance-api-key
BINANCE_SECRET_KEY=dein-binance-secret-key

# OPTIONAL - für Datenbank (Supabase)
NEXT_PUBLIC_SUPABASE_URL=deine-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=dein-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=dein-supabase-service-role-key
```

### 2. Thirdweb Client ID

1. Gehe zu https://thirdweb.com
2. Erstelle einen Account oder logge dich ein
3. Gehe zu Dashboard → Settings → API Keys
4. Kopiere deine Client ID
5. Füge sie in `.env.local` ein

### 3. PARA Token Deployment

Der PARA Token muss auf Base Mainnet deployed werden:

**Option A: Thirdweb Dashboard**
1. Gehe zu https://thirdweb.com/dashboard
2. Erstelle ein neues Projekt
3. Deploy einen ERC-20 Token auf Base
4. Kopiere die Contract-Adresse

**Option B: Thirdweb CLI**
```bash
npx thirdweb deploy
```

Nach dem Deployment:
- Kopiere die Contract-Adresse
- Füge sie in `.env.local` als `NEXT_PUBLIC_PARA_TOKEN_ADDRESS` ein

### 4. Supabase Setup (Optional - für Credits & History)

1. Gehe zu https://supabase.com
2. Erstelle ein neues Projekt
3. Erstelle folgende Tabellen:

```sql
-- User Credits Tabelle
CREATE TABLE user_credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT UNIQUE NOT NULL,
  credits INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Analyse History Tabelle
CREATE TABLE analysis_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT NOT NULL,
  market TEXT NOT NULL,
  analysis JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index für schnelle Abfragen
CREATE INDEX idx_wallet_address ON user_credits(wallet_address);
CREATE INDEX idx_analysis_wallet ON analysis_history(wallet_address);
```

4. Kopiere die Supabase URL und Keys in `.env.local`

### 5. AI-Service Setup (Optional)

**OpenAI:**
1. Gehe zu https://platform.openai.com/api-keys
2. Erstelle einen neuen API-Key
3. Füge ihn in `.env.local` ein

**Anthropic Claude:**
1. Gehe zu https://console.anthropic.com/
2. Erstelle einen neuen API-Key
3. Füge ihn in `.env.local` ein

**Hinweis:** Ohne AI-API-Key funktioniert die App mit regelbasierter Analyse (Fallback).

### 6. Binance API (Optional)

1. Gehe zu https://www.binance.com/en/my/settings/api-management
2. Erstelle einen neuen API-Key
3. Füge API-Key und Secret in `.env.local` ein

**Hinweis:** Ohne Binance API-Key verwendet die App Dexscreener (kostenlos, aber Rate-Limits).

---

## 🧪 Testing

### 1. Development Server starten

```bash
npm run dev
```

Die App läuft dann auf http://localhost:3000

### 2. Test-Checkliste

- [ ] Wallet-Connect funktioniert
- [ ] Token-Balance wird angezeigt (nach Wallet-Connect)
- [ ] Chart-Panel zeigt TradingView Widget
- [ ] Analyse-Button funktioniert
- [ ] API `/api/analyze` gibt Analyse zurück
- [ ] Indikatoren werden korrekt berechnet
- [ ] AI-Analyse wird generiert (oder Fallback)

### 3. Build Test

```bash
npm run build
npm start
```

---

## 📝 Nächste Schritte (Optional)

### Backend-Erweiterungen
- [ ] Supabase Integration für Credits
- [ ] Analyse-History speichern
- [ ] Credit-System implementieren
- [ ] User-Authentifizierung

### Features
- [ ] Mehr Markt-Paare
- [ ] Analyse-History anzeigen
- [ ] Leaderboard / Gamification
- [ ] Erweiterte Indikatoren
- [ ] Trading-Signale

### Smart Contracts
- [ ] Thirdweb Pay Integration
- [ ] Universal Bridge Setup
- [ ] Token-Staking (optional)

---

## 🐛 Bekannte Probleme / TODOs

1. **Chart-Panel → Analysis-Panel Kommunikation**
   - Aktuell: Hardcoded "BTC/USDT"
   - TODO: Ausgewähltes Market aus Chart-Panel übernehmen

2. **Credit-System**
   - Aktuell: Nur Frontend (Demo)
   - TODO: Backend-Integration mit Supabase

3. **Token-Balance**
   - Aktuell: Liest von Blockchain
   - TODO: Credits-System implementieren

4. **Error Handling**
   - Grundlegend vorhanden
   - TODO: Verbesserte Fehlermeldungen

---

## 🆘 Troubleshooting

### "Thirdweb Client ID fehlt"
- Stelle sicher, dass `.env.local` existiert
- Prüfe, ob `NEXT_PUBLIC_THIRDWEB_CLIENT_ID` gesetzt ist
- Starte den Dev-Server neu

### "Token Balance wird nicht angezeigt"
- Prüfe, ob `NEXT_PUBLIC_PARA_TOKEN_ADDRESS` gesetzt ist
- Stelle sicher, dass der Token auf Base deployed ist
- Prüfe, ob die Wallet verbunden ist

### "Analyse funktioniert nicht"
- Prüfe Browser-Console auf Fehler
- Prüfe Server-Logs
- Stelle sicher, dass Binance API erreichbar ist (oder Dexscreener)

### "Build-Fehler"
```bash
# Dependencies neu installieren
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## 📚 Dokumentation

- [Next.js Docs](https://nextjs.org/docs)
- [Thirdweb Docs](https://portal.thirdweb.com/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TradingView Widget](https://www.tradingview.com/widget-docs/)

---

**Viel Erfolg mit Paragon AI! ⚡**

