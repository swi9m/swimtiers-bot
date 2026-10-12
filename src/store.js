const fs = require('fs');
const path = require('path');
const { REGIONS } = require('./config');

const FILE = path.join(__dirname, '..', 'data', 'data.json');

const blankQueue = () => ({
  open: false,
  active: [], // tester ids
  queue: [], // player ids, index 0 = #1
  messageId: null, // status message in the waitlist channel
  lastSession: null, // timestamp (ms)
});

const blank = () => ({
  users: {}, // discordId -> { username }
  profiles: {}, // discordId -> { region, server, at }
  cooldowns: {}, // discordId -> expiry timestamp (ms)
  queues: Object.fromEntries(REGIONS.map((r) => [r, blankQueue()])),
  tests: {}, // channelId -> { userId, testerId, region }
});

let data = blank();

function load() {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  if (fs.existsSync(FILE)) {
    const saved = JSON.parse(fs.readFileSync(FILE, 'utf8'));
    data = { ...blank(), ...saved };
    for (const r of REGIONS) data.queues[r] = { ...blankQueue(), ...(saved.queues?.[r] || {}) };
  }
}

let timer = null;
function flush() {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  const tmp = FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, FILE);
}

function save() {
  if (timer) return;
  timer = setTimeout(flush, 250);
}

load();
process.on('SIGINT', () => {
  flush();
  process.exit(0);
});
process.on('SIGTERM', () => {
  flush();
  process.exit(0);
});

module.exports = {
  get data() {
    return data;
  },
  save,
  flush,

  // Returns the Discord id that registered this username, or null.
  findOwner(username) {
    const lower = username.toLowerCase();
    for (const [id, u] of Object.entries(data.users)) {
      if (u.username.toLowerCase() === lower) return id;
    }
    return null;
  },

  setUsername(discordId, username) {
    data.users[discordId] = { username };
    save();
  },

  // Returns the expiry timestamp if the user is on cooldown, otherwise null.
  getCooldown(discordId) {
    const expiry = data.cooldowns[discordId];
    if (!expiry) return null;
    if (expiry <= Date.now()) {
      delete data.cooldowns[discordId];
      save();
      return null;
    }
    return expiry;
  },

  setCooldown(discordId, expiry) {
    data.cooldowns[discordId] = expiry;
    save();
  },
};
