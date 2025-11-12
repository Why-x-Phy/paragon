# VPS Deployment Anleitung - Contabo

Diese Anleitung zeigt dir, wie du die Paragon-App auf einem Contabo VPS deployst.

## Voraussetzungen

- Contabo VPS mit Ubuntu 22.04 LTS (oder neuer)
- Root-Zugriff oder User mit sudo-Rechten
- Domain-Name (optional, aber empfohlen für SSL)
- GitHub Repository mit deinem Code

---

## Schritt 1: Server-Vorbereitung

### SSH-Verbindung herstellen

```bash
ssh root@deine-server-ip
# oder
ssh dein-username@deine-server-ip
```

### System aktualisieren

```bash
sudo apt update && sudo apt upgrade -y
```

### Benutzer erstellen (falls noch nicht vorhanden)

```bash
# Neuen User erstellen
adduser deploy
usermod -aG sudo deploy

# Zu neuem User wechseln
su - deploy
```

---

## Schritt 2: Node.js installieren

### Node.js 20.x installieren (empfohlen für Next.js 16)

```bash
# NodeSource Repository hinzufügen
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Node.js installieren
sudo apt install -y nodejs

# Version prüfen
node --version
npm --version
```

### PM2 installieren (Process Manager)

```bash
sudo npm install -g pm2
```

---

## Schritt 3: Nginx installieren und konfigurieren

### Nginx installieren

```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Firewall konfigurieren

```bash
# UFW aktivieren
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

### Nginx-Konfiguration erstellen

```bash
sudo nano /etc/nginx/sites-available/paragon
```

**Inhalt der Datei:**

```nginx
server {
    listen 80;
    server_name deine-domain.com www.deine-domain.com;
    # Falls keine Domain: server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeout für lange API-Aufrufe erhöhen
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
    }
}
```

### Nginx-Konfiguration aktivieren

```bash
# Symlink erstellen
sudo ln -s /etc/nginx/sites-available/paragon /etc/nginx/sites-enabled/

# Standard-Konfiguration entfernen (optional)
sudo rm /etc/nginx/sites-enabled/default

# Konfiguration testen
sudo nginx -t

# Nginx neu laden
sudo systemctl reload nginx
```

---

## Schritt 4: SSL-Zertifikat mit Let's Encrypt

### Certbot installieren

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### SSL-Zertifikat erstellen

```bash
# Mit Domain
sudo certbot --nginx -d deine-domain.com -d www.deine-domain.com

# Ohne Domain (nur IP) - SSL nicht möglich, überspringe diesen Schritt
```

### Auto-Renewal testen

```bash
sudo certbot renew --dry-run
```

---

## Schritt 5: Application-Verzeichnis erstellen

```bash
# App-Verzeichnis erstellen
sudo mkdir -p /var/www/paragon
sudo chown -R $USER:$USER /var/www/paragon
cd /var/www/paragon
```

---

## Schritt 6: Code deployen

### Option A: Git Clone (manuell)

```bash
# Repository klonen
git clone https://github.com/Why-x-Phy/paragon.git .

# Dependencies installieren
npm install

# Environment-Variablen setzen
nano .env.local
```

**Inhalt von `.env.local`:**

```env
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=deine-client-id
PARA_TOKEN_ADDRESS=deine-token-adresse
BASE_CHAIN_ID=84532
# Weitere Umgebungsvariablen...
```

### Option B: GitHub Actions (automatisch) - siehe Schritt 8

---

## Schritt 7: Production Build erstellen

```bash
# Build erstellen
npm run build

# Testen ob es funktioniert
npm start
# In anderem Terminal testen: curl http://localhost:3000
# Dann mit Ctrl+C beenden
```

---

## Schritt 8: PM2 konfigurieren

### PM2 Ecosystem-Datei erstellen

```bash
nano ecosystem.config.js
```

**Inhalt:**

```javascript
module.exports = {
  apps: [{
    name: 'paragon',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    cwd: '/var/www/paragon',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/pm2/paragon-error.log',
    out_file: '/var/log/pm2/paragon-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '1G',
    watch: false
  }]
};
```

### PM2 starten

```bash
# PM2 mit Config starten
pm2 start ecosystem.config.js

# PM2 beim System-Start starten
pm2 startup
pm2 save

# Status prüfen
pm2 status
pm2 logs paragon
```

---

## Schritt 9: Nginx-Konfiguration für SSL aktualisieren (falls SSL verwendet)

Nach dem SSL-Setup sollte Nginx automatisch die Konfiguration aktualisiert haben. Falls nicht:

```bash
sudo nano /etc/nginx/sites-available/paragon
```

**SSL-Konfiguration sollte so aussehen:**

```nginx
server {
    listen 80;
    server_name deine-domain.com www.deine-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name deine-domain.com www.deine-domain.com;

    ssl_certificate /etc/letsencrypt/live/deine-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/deine-domain.com/privkey.pem;
    
    # SSL-Optimierungen
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeout für lange API-Aufrufe erhöhen
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
    }
}
```

```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## Schritt 10: Automatisches Deployment mit GitHub Actions (Optional)

### GitHub Actions Workflow erstellen

Erstelle `.github/workflows/deploy.yml` im Repository:

```yaml
name: Deploy to VPS

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /var/www/paragon
            git pull origin main
            npm install --production
            npm run build
            pm2 restart paragon
```

### GitHub Secrets konfigurieren

Im GitHub Repository:
1. Settings → Secrets and variables → Actions
2. Folgende Secrets hinzufügen:
   - `VPS_HOST`: Deine Server-IP oder Domain
   - `VPS_USER`: Dein SSH-User (z.B. `deploy`)
   - `VPS_SSH_KEY`: Dein privater SSH-Key

### SSH-Key für GitHub Actions erstellen

```bash
# Auf deinem lokalen Rechner
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions_key

# Öffentlichen Key auf Server kopieren
ssh-copy-id -i ~/.ssh/github_actions_key.pub deploy@deine-server-ip

# Privaten Key kopieren (für GitHub Secret)
cat ~/.ssh/github_actions_key
# Inhalt in GitHub Secret VPS_SSH_KEY einfügen
```

---

## Schritt 11: Firewall und Sicherheit

### Fail2Ban installieren (Schutz vor Brute-Force)

```bash
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### Automatische Updates aktivieren

```bash
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

---

## Schritt 12: Monitoring und Logs

### PM2 Monitoring

```bash
# PM2 Monitoring Dashboard (optional)
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7

# Logs ansehen
pm2 logs paragon --lines 100
pm2 monit
```

### Nginx Logs

```bash
# Access Logs
sudo tail -f /var/log/nginx/access.log

# Error Logs
sudo tail -f /var/log/nginx/error.log
```

---

## Schritt 13: Updates und Wartung

### Manuelles Update

```bash
cd /var/www/paragon
git pull origin main
npm install --production
npm run build
pm2 restart paragon
```

### PM2 Befehle

```bash
# App neu starten
pm2 restart paragon

# App stoppen
pm2 stop paragon

# App starten
pm2 start paragon

# Logs löschen
pm2 flush

# Status prüfen
pm2 status
pm2 info paragon
```

---

## Troubleshooting

### App startet nicht

```bash
# PM2 Logs prüfen
pm2 logs paragon --err

# Manuell starten zum Debuggen
cd /var/www/paragon
npm start
```

### Nginx Fehler

```bash
# Konfiguration testen
sudo nginx -t

# Nginx Logs prüfen
sudo tail -f /var/log/nginx/error.log
```

### Port bereits belegt

```bash
# Prüfen welcher Prozess Port 3000 verwendet
sudo lsof -i :3000

# PM2 stoppen und neu starten
pm2 stop paragon
pm2 start paragon
```

### SSL-Zertifikat erneuern

```bash
# Manuell erneuern
sudo certbot renew

# Nginx neu laden nach Erneuerung
sudo systemctl reload nginx
```

---

## Wichtige Dateipfade

- **App-Verzeichnis**: `/var/www/paragon`
- **Nginx Config**: `/etc/nginx/sites-available/paragon`
- **PM2 Logs**: `/var/log/pm2/`
- **Nginx Logs**: `/var/log/nginx/`
- **Environment**: `/var/www/paragon/.env.local`

---

## Sicherheits-Checkliste

- [ ] Firewall (UFW) aktiviert
- [ ] SSH-Key-Authentifizierung statt Passwort
- [ ] Fail2Ban installiert
- [ ] Automatische Updates aktiviert
- [ ] SSL-Zertifikat installiert
- [ ] Regelmäßige Backups eingerichtet
- [ ] PM2 Logs rotieren lassen

---

## Performance-Optimierungen

### Node.js Memory-Limit erhöhen (falls nötig)

```bash
# In ecosystem.config.js
max_memory_restart: '2G'  # Anpassen je nach VPS-Größe
```

### Nginx Caching (optional)

```nginx
# In Nginx-Config hinzufügen
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=paragon_cache:10m max_size=100m inactive=60m;
proxy_cache paragon_cache;
```

---

## Fertig! 🎉

Deine App sollte jetzt unter `http://deine-domain.com` oder `http://deine-server-ip` erreichbar sein.

Bei Fragen oder Problemen, prüfe die Logs:
- `pm2 logs paragon`
- `sudo tail -f /var/log/nginx/error.log`

