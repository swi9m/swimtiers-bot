const { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } = require('discord.js');
const config = require('../config');
const store = require('../store');
const { editStatus } = require('../queue');
const { say, isAdmin, isTester, RED } = require('../util');

const userOption = (o) => o.setName('user').setDescription('Player').setRequired(true);
const tierOption = (o) => o.setName('tier').setDescription('Tier role').setRequired(true);

// ── /tier give | remove ──
const tier = {
  data: new SlashCommandBuilder()
    .setName('tier')
    .setDescription('Give or remove a tier role')
    .addSubcommand((s) =>
      s.setName('give').setDescription('Give a tier role').addUserOption(userOption).addRoleOption(tierOption)
    )
    .addSubcommand((s) =>
      s.setName('remove').setDescription('Remove a tier role').addUserOption(userOption).addRoleOption(tierOption)
    )
    .setDMPermission(false),

  async execute(i) {
    if (!isTester(i.member)) return say(i, 'Only testers can use this command.', RED);

    const target = i.options.getMember('user');
    const role = i.options.getRole('tier', true);
    if (!target) return say(i, 'That user is not in this server.', RED);
    if (!config.tierRoleIds.includes(role.id)) return say(i, `<@&${role.id}> is not a tier role.`, RED);

    await i.deferReply({ flags: MessageFlags.Ephemeral });

    if (i.options.getSubcommand() === 'give') {
      // A player holds one tier at a time: drop their other tier roles first.
      const others = config.tierRoleIds.filter((id) => id !== role.id && target.roles.cache.has(id));
      if (others.length) await target.roles.remove(others);
      await target.roles.add(role.id);
      return say(i, `Gave <@&${role.id}> to <@${target.id}>.`);
    }

    if (!target.roles.cache.has(role.id)) return say(i, `<@${target.id}> does not have <@&${role.id}>.`);
    await target.roles.remove(role.id);
    return say(i, `Removed <@&${role.id}> from <@${target.id}>.`);
  },
};

// ── /tester add | remove ──
const tester = {
  data: new SlashCommandBuilder()
    .setName('tester')
    .setDescription('Add or remove a tester')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((s) => s.setName('add').setDescription('Give a user the Tester role').addUserOption(userOption))
    .addSubcommand((s) => s.setName('remove').setDescription('Remove the Tester role from a user').addUserOption(userOption))
    .setDMPermission(false),

  async execute(i) {
    if (!isAdmin(i.member)) return say(i, 'Only admins can use this command.', RED);

    const target = i.options.getMember('user');
    if (!target) return say(i, 'That user is not in this server.', RED);

    await i.deferReply({ flags: MessageFlags.Ephemeral });

    if (i.options.getSubcommand() === 'add') {
      await target.roles.add(config.testerRoleId);
      return say(i, `<@${target.id}> is now a tester.`);
    }

    await target.roles.remove(config.testerRoleId);
    // Also drop them from any open queue's active tester list.
    for (const region of config.REGIONS) {
      const st = store.data.queues[region];
      const idx = st.active.indexOf(target.id);
      if (idx !== -1) {
        st.active.splice(idx, 1);
        store.save();
        if (st.open) editStatus(i.client, region);
      }
    }
    return say(i, `<@${target.id}> is no longer a tester.`);
  },
};

module.exports = [tier, tester];
