# Netlify Umgebungsvariablen Setup

Diese Anleitung zeigt dir, wie du die erforderlichen Umgebungsvariablen auf Netlify konfigurierst.

## Problem

Die `.env.local` Datei ist in `.gitignore` und wird nicht ins Git-Repository übernommen. Auf Netlify fehlen daher die Umgebungsvariablen, was zu Fehlern führen kann.

## Lösung: Umgebungsvariablen auf Netlify setzen

### Schritt 1: Netlify Dashboard öffnen

1. Gehe zu https://app.netlify.com
2. Wähle dein Projekt aus

### Schritt 2: Umgebungsvariablen hinzufügen

1. Gehe zu **Site settings** → **Environment variables**
2. Klicke auf **Add a variable**

### Schritt 3: Erforderliche Variablen hinzufügen

Füge folgende Variablen hinzu:

#### ERFORDERLICH:

```env
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=5fd5ad15bea63a2b9106d3547aebe43e
```

**Oder deine eigene Client ID**, falls du eine hast.

```env
NEXT_PUBLIC_PARA_TOKEN_ADDRESS=0xB9FB73448d478312c1d3a747EbE795A97276Eb51
```

**Oder deine Token-Adresse**, falls du eine andere verwendest.

#### OPTIONAL (aber empfohlen):

```env
THIRDWEB_SECRET_KEY=0EU34F-xx0uQJgJ7qmkrWH4uHonpSJ1_oBgtM44H8wEYgRhZJkbl6PNjhoORDGYXKy43ExExiqF65-xiHIcAag
```

**WICHTIG:** Falls du den Secret Key verwendest, ersetze ihn durch deinen eigenen!

```env
OPENAI_API_KEY=dein-openai-api-key
```

**Oder:**

```env
ANTHROPIC_API_KEY=dein-anthropic-api-key
```

Für echte AI-Analysen (aktuell verwendet die App einen Fallback ohne API-Key).

### Schritt 4: Variablen für alle Umgebungen setzen

Für jede Variable kannst du wählen:
- **All scopes** (empfohlen) - für alle Umgebungen
- **Production** - nur für Production
- **Deploy previews** - nur für Preview-Deployments
- **Branch deploys** - nur für Branch-Deployments

**Empfehlung:** Wähle **All scopes** für alle Variablen.

### Schritt 5: Neue Deployment triggern

Nach dem Hinzufügen der Variablen:

1. Gehe zu **Deploys**
2. Klicke auf **Trigger deploy** → **Deploy site**
3. Oder pushe einen neuen Commit zu GitHub

Die neuen Umgebungsvariablen werden beim nächsten Deployment verwendet.

---

## Prüfen welche Variablen lokal gesetzt sind

Falls du nicht sicher bist, welche Werte du lokal verwendest:

```bash
# Auf deinem lokalen Rechner
cat .env.local
```

**WICHTIG:** Kopiere die Werte NICHT direkt hier rein, wenn sie sensible Daten enthalten!

---

## Vollständige Liste der möglichen Variablen

Basierend auf deinem Code:

### ERFORDERLICH:

- `NEXT_PUBLIC_THIRDWEB_CLIENT_ID` - Thirdweb Client ID (hat Fallback: `5fd5ad15bea63a2b9106d3547aebe43e`)
- `NEXT_PUBLIC_PARA_TOKEN_ADDRESS` - PARA Token Adresse (hat Fallback: `0xB9FB73448d478312c1d3a747EbE795A97276Eb51`)

### OPTIONAL:

- `THIRDWEB_SECRET_KEY` - Für Backend API Calls (z.B. Token Claims)
- `OPENAI_API_KEY` - Für OpenAI AI-Analysen
- `ANTHROPIC_API_KEY` - Für Anthropic (Claude) AI-Analysen
- `BINANCE_API_KEY` - Für Binance API (bessere Rate-Limits, aktuell nicht verwendet)
- `BINANCE_SECRET_KEY` - Für Binance API (aktuell nicht verwendet)

---

## Warum könnte das das Binance-Problem lösen?

Auch wenn die Binance API öffentlich ist und keinen API-Key benötigt, könnte das Problem indirekt sein:

1. **Balance-Prüfung schlägt fehl**: Wenn `PARA_TOKEN_ADDRESS` fehlt oder falsch ist, könnte die Balance-Prüfung in `/api/analyze` fehlschlagen, bevor die Binance API aufgerufen wird.

2. **Thirdweb Client Initialisierung**: Wenn `NEXT_PUBLIC_THIRDWEB_CLIENT_ID` fehlt, könnte die Thirdweb-Initialisierung Probleme verursachen.

3. **Error-Handling**: Fehlende Variablen könnten zu unerwarteten Fehlern führen, die als "Binance-Fehler" angezeigt werden.

---

## Debugging: Prüfe Netlify Logs

Nach dem Setzen der Variablen:

1. Gehe zu **Functions** → **Logs**
2. Suche nach `[fetchBinanceData]` oder `[analyze]`
3. Prüfe ob Fehler auftreten

Oder in der Browser-Konsole:
- Öffne die Developer Tools (F12)
- Gehe zu **Network** Tab
- Suche nach `/api/analyze` Requests
- Prüfe die Response für Fehlerdetails

---

## Schnell-Checkliste

- [ ] `NEXT_PUBLIC_THIRDWEB_CLIENT_ID` gesetzt
- [ ] `NEXT_PUBLIC_PARA_TOKEN_ADDRESS` gesetzt
- [ ] `THIRDWEB_SECRET_KEY` gesetzt (falls verwendet)
- [ ] Neue Deployment getriggert
- [ ] Netlify Logs geprüft
- [ ] Browser-Konsole auf Fehler geprüft

---

## Falls es immer noch nicht funktioniert

1. **Prüfe Netlify Function Logs** für genaue Fehlermeldungen
2. **Prüfe Browser-Konsole** für Client-seitige Fehler
3. **Teste lokal** ob es mit den gleichen Variablen funktioniert
4. **Prüfe ob Timeout-Probleme** auftreten (Netlify Free Tier: 10s Limit)

---

## Alternative: Netlify CLI verwenden

Falls du lieber die CLI verwendest:

```bash
# Netlify CLI installieren
npm install -g netlify-cli

# Login
netlify login

# Variable hinzufügen
netlify env:set NEXT_PUBLIC_THIRDWEB_CLIENT_ID "5fd5ad15bea63a2b9106d3547aebe43e"
netlify env:set NEXT_PUBLIC_PARA_TOKEN_ADDRESS "0xB9FB73448d478312c1d3a747EbE795A97276Eb51"

# Alle Variablen anzeigen
netlify env:list
```

---

**Nach dem Setzen der Variablen sollte das Binance-Problem behoben sein!** 🎉

