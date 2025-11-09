# 🔐 Secret Key Setup - WICHTIG!

## Problem: "Thirdweb Secret Key nicht konfiguriert"

Falls du diese Fehlermeldung siehst, folge diesen Schritten:

### 1. Prüfe `.env.local` Datei

Stelle sicher, dass die Datei `.env.local` im **Root-Verzeichnis** deines Projekts existiert (gleiche Ebene wie `package.json`).

### 2. Füge den Secret Key hinzu

Öffne `.env.local` und füge diese Zeile hinzu:

```env
THIRDWEB_SECRET_KEY=0EU34F-xx0uQJgJ7qmkrWH4uHonpSJ1_oBgtM44H8wEYgRhZJkbl6PNjhoORDGYXKy43ExExiqF65-xiHIcAag
```

**WICHTIG:**
- Keine Leerzeichen um das `=`
- Keine Anführungszeichen
- Keine Zeilenumbrüche im Key
- Die Datei muss `.env.local` heißen (nicht `.env` oder `.env.local.txt`)

### 3. Server NEU STARTEN

Nach dem Hinzufügen des Secret Keys **MUSS** der Development Server neu gestartet werden:

```bash
# Stoppe den Server (Ctrl+C)
# Dann starte ihn neu:
npm run dev
```

### 4. Prüfe die Konsole

Nach dem Neustart solltest du in der Konsole sehen:
```
- Environments: .env.local
```

### 5. Teste die API

Öffne die Browser-Konsole und prüfe die Fehlermeldung. Sie sollte jetzt Debug-Informationen enthalten.

### Troubleshooting

**Falls es immer noch nicht funktioniert:**

1. **Prüfe die Datei-Endung:**
   - Windows zeigt manchmal versteckte Endungen
   - Die Datei sollte genau `.env.local` heißen (nicht `.env.local.txt`)

2. **Prüfe den Inhalt:**
   ```bash
   # Im Projekt-Root:
   cat .env.local
   # oder in PowerShell:
   Get-Content .env.local
   ```

3. **Prüfe ob die Variable geladen wird:**
   - Öffne die Browser-Konsole
   - Die Fehlermeldung enthält jetzt Debug-Informationen
   - Prüfe ob `hasTHIRDWEB_SECRET_KEY: true` angezeigt wird

4. **Alternative: Hardcode für Testing**
   Falls nichts funktioniert, kannst du temporär den Secret Key direkt in `app/api/claim-tokens/route.ts` hardcoden:
   ```typescript
   const secretKey = "0EU34F-xx0uQJgJ7qmkrWH4uHonpSJ1_oBgtM44H8wEYgRhZJkbl6PNjhoORDGYXKy43ExExiqF65-xiHIcAag";
   ```
   **WICHTIG:** Entferne das wieder vor dem Commit!

### Vollständige `.env.local` Datei

Deine `.env.local` sollte so aussehen:

```env
# Thirdweb Client ID
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=5fd5ad15bea63a2b9106d3547aebe43e

# Thirdweb Secret Key (für Backend API Calls)
THIRDWEB_SECRET_KEY=0EU34F-xx0uQJgJ7qmkrWH4uHonpSJ1_oBgtM44H8wEYgRhZJkbl6PNjhoORDGYXKy43ExExiqF65-xiHIcAag

# Para Token Address (Base Mainnet)
NEXT_PUBLIC_PARA_TOKEN_ADDRESS=0xB9FB73448d478312c1d3a747EbE795A97276Eb51
```

