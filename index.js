const { Client, GatewayIntentBits, Partials } = require('discord.js');
const fs = require('fs');
const axios = require('axios');
const config = require('./config.json');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./sentinel.db');
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
  partials: [Partials.Channel]
});

// Express backend pour vérification
const api = express();
api.use(bodyParser.urlencoded({ extended: true }));
api.use(bodyParser.json());

api.post('/api/verify', (req, res) => {
  const token = req.body.token;
  if (!token) return res.status(400).send('Invalid request.');

  db.get('SELECT * FROM tokens WHERE token = ? AND verified = 0', [token], async (err, row) => {
    if (err || !row) return res.status(403).send('Invalid or expired token.');
    const userId = row.user_id;
    db.run('UPDATE tokens SET verified = 1 WHERE token = ?', [token]);
    db.run('INSERT INTO logs (user_id, action) VALUES (?, ?)', [userId, 'verified']);
    fs.writeFileSync(`./verify_queue/${userId}.verify`, token);
    res.status(200).send('✅ You have been verified!');
  });
});

api.listen(3000, () => console.log('🌐 API Web active sur http://localhost:3000'));

// Discord bot events
client.once('ready', () => {
  console.log(`✅ Bot connecté en tant que ${client.user.tag}`);
});

client.on('guildMemberAdd', async member => {
  const age = (Date.now() - member.user.createdAt) / (1000 * 60 * 60 * 24);
  if (age < config.altAccountAgeDays) {
    await member.ban({ reason: 'Compte trop récent (alt)' });
    return;
  }

  try {
    const res = await axios.get(`https://ipqualityscore.com/api/json/ip/${config.ipqsApiKey}/${member.id}`);
    if (res.data.vpn || res.data.proxy || res.data.tor) {
      await member.ban({ reason: 'VPN/proxy détecté' });
      return;
    }
  } catch (e) {}

  const token = Math.random().toString(36).substr(2);
  db.run('INSERT INTO tokens (token, user_id) VALUES (?, ?)', [token, member.id]);
  const verifyChannel = await member.guild.channels.fetch(config.verificationChannelId);
  verifyChannel.send({
    content: `${member.user}, please verify to access the server: https://YOUR_DOMAIN_HERE/?token=${token}`
  });
});

// Loop to check verification queue
setInterval(async () => {
  const files = fs.readdirSync('./verify_queue').filter(f => f.endsWith('.verify'));
  for (const file of files) {
    const userId = file.split('.')[0];
    const member = await client.guilds.cache.first().members.fetch(userId).catch(() => null);
    if (member) {
      await member.roles.add(config.verifiedRoleId).catch(() => {});
      const logChannel = await member.guild.channels.fetch(config.logChannelId);
      logChannel.send(`✅ ${member.user.tag} has been verified.`);
    }
    fs.unlinkSync(`./verify_queue/${file}`);
  }
}, 5000);

client.login(config.token);