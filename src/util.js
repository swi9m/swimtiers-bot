const { EmbedBuilder, MessageFlags, PermissionFlagsBits } = require('discord.js');
const config = require('./config');

const BLUE = 0x3498db;
const RED = 0xed4245;

const feedback = (text, color = BLUE) => new EmbedBuilder().setColor(color).setDescription(text);

// Ephemeral blue feedback message. Works whether or not the interaction was already deferred/replied.
function say(interaction, text, color = BLUE) {
  const payload = { embeds: [feedback(text, color)] };
  if (interaction.deferred) return interaction.editReply(payload);
  if (interaction.replied) return interaction.followUp({ ...payload, flags: MessageFlags.Ephemeral });
  return interaction.reply({ ...payload, flags: MessageFlags.Ephemeral });
}

const isAdmin = (member) => member.permissions.has(PermissionFlagsBits.Administrator);
const isTester = (member) => isAdmin(member) || member.roles.cache.has(config.testerRoleId);

function addRegion(builder) {
  return builder.addStringOption((o) =>
    o
      .setName('region')
      .setDescription('Region')
      .setRequired(true)
      .addChoices({ name: 'EU', value: 'EU' }, { name: 'NA', value: 'NA' }, { name: 'AS', value: 'AS' })
  );
}

function regionOfChannel(channelId) {
  return config.REGIONS.find((r) => config.waitlistChannels[r] === channelId) || null;
}

// e.g. "3/4/2026, 10:28:19 PM"
const fmtTime = (ts) => new Date(ts).toLocaleString('en-US', { timeZone: config.tz });

module.exports = { BLUE, RED, feedback, say, isAdmin, isTester, addRegion, regionOfChannel, fmtTime };
