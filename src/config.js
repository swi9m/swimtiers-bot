require('dotenv').config();

const REGIONS = ['EU', 'NA', 'AS'];

function get(key, required = true) {
  const value = (process.env[key] || '').trim();
  if (!value && required) throw new Error(`Missing ${key} in .env`);
  return value;
}

function perRegion(prefix) {
  return Object.fromEntries(REGIONS.map((r) => [r, get(`${prefix}_${r}`)]));
}

module.exports = {
  REGIONS,
  MAX_QUEUE: 20,

  token: get('DISCORD_TOKEN'),
  clientId: get('CLIENT_ID'),
  guildId: get('GUILD_ID'),

  requestTestChannelId: get('CHANNEL_REQUEST_TEST'),
  waitlistChannels: perRegion('CHANNEL_WAITLIST'),

  openTestsCategoryId: get('CATEGORY_OPEN_TESTS'),

  testerRoleId: get('ROLE_TESTER'),
  waitlistRoles: perRegion('ROLE_WAITLIST'),
  tierRoleIds: get('TIER_ROLE_IDS')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),

  cooldownDays: Number(get('COOLDOWN_DAYS', false) || 7),
  requireVerify: (get('REQUIRE_VERIFY', false) || 'true').toLowerCase() !== 'false',
  tz: get('TIMEZONE', false) || 'UTC',
};
