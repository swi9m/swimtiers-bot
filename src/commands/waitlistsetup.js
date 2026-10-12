const { PermissionFlagsBits, SlashCommandBuilder } = require('discord.js');
const { requestTestMessage } = require('../embeds');
const { say, isAdmin, RED } = require('../util');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('waitlistsetup')
    .setDescription('Post the request-test message in this channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false),

  async execute(i) {
    if (!isAdmin(i.member)) return say(i, 'Only admins can use this command.', RED);
    await i.channel.send(requestTestMessage());
    return say(i, 'Request-test message posted.');
  },
};
