# SentinelBot - Ultimate Discord Verification Bot

## 📦 Fonctionnalités principales

- 🛡️ Détection et bannissement des alts, VPN, raids
- ✅ Vérification obligatoire via lien web sécurisé (comme Double Counter)
- 🧠 Fingerprint et blacklist persistante
- 🔧 Commande `/setup` complète pour tout configurer
- 📊 Logs détaillés des actions

## 🚀 Déploiement Web sur Vercel

1. Crée un compte sur https://vercel.com/
2. Crée un nouveau projet et importe ce dossier (`web/` sera automatiquement déployé)
3. Place le domaine public dans `web/index.html` (`https://your-site.vercel.app/api/verify`)
4. L’URL sera utilisée dans le message Discord de vérification.

## 🧠 Configuration

Dans `config.json` :
- `"token"` : ton bot token
- `"ipqsApiKey"` : clé IPQualityScore
- `"siteVerificationSecret"` : une clé secrète partagée entre le bot et le site
- `"logChannelId"` / `"verificationChannelId"` : IDs Discord
- `"verifiedRoleId"` : rôle à donner après vérification

## ✅ Lancement du bot

```bash
npm install
node index.js
```

Le bot se connecte, gère les joins, affiche un message avec le lien de vérification.

## 📬 Vérification web

Le site appelle `/api/verify` (via Express dans le bot) et si le token est valide,
le bot donne le rôle au membre correspondant et log l'action.