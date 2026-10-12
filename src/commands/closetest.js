const { SlashCommandBuilder } = require('discord.js');
const config = require('../config');
const store = require('../store');
const { say, isAdmin, RED } = require('../util');

function make(name) {
  return {
    data: new SlashCommandBuilder()
      .setName(name)
      .setDescription('Close this test channel and start the player\'s cooldown')
      .setDMPermission(false),

    async execute(i) {
      const test = store.data.tests[i.channelId];
      if (!test) return say(i, 'This is not an open test channel.', RED);
      if (i.user.id !== test.testerId && !isAdmin(i.member))
        return say(i, 'Only the tester of this test (or an admin) can close it.', RED);

      const expiry = Date.now() + config.cooldownDays * 24 * 60 * 60 * 1000;
      store.setCooldown(test.userId, expiry);
      store.data.queues[test.region].lastSession = Date.now();
      delete store.data.tests[i.channelId];
      store.save();

      await say(i, `Test closed. <@${test.userId}> is on a ${config.cooldownDays}-day cooldown. This channel will be deleted in 5 seconds.`);
      setTimeout(() => i.channel.delete().catch(() => {}), 5000);
    },
  };
}

module.exports = [make('closetest'), make('closechannel')];
