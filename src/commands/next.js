const { ChannelType, EmbedBuilder, MessageFlags, PermissionFlagsBits, SlashCommandBuilder } = require('discord.js');
const config = require('../config');
const store = require('../store');
const { editStatus } = require('../queue');
const { say, feedback, isAdmin, isTester, addRegion, RED } = require('../util');

const P = PermissionFlagsBits;
const TEST_PERMS = [P.ViewChannel, P.SendMessages, P.ReadMessageHistory, P.AttachFiles, P.EmbedLinks];

const channelSafe = (name) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .slice(0, 80);

module.exports = {
  data: addRegion(
    new SlashCommandBuilder().setName('next').setDescription('Take the #1 player in the queue into a test channel')
  ).setDMPermission(false),

  async execute(i) {
    if (!isTester(i.member)) return say(i, 'Only testers can use this command.', RED);

    const region = i.options.getString('region', true);
    const st = store.data.queues[region];

    if (!st.open) return say(i, `The **${region}** queue is closed. Use /openqueue first.`);
    if (!st.active.includes(i.user.id) && !isAdmin(i.member))
      return say(i, `You are not an active tester for **${region}**. Use /openqueue ${region} or ask for /addtester.`, RED);

    await i.deferReply({ flags: MessageFlags.Ephemeral });

    // Take the first player who is still in the server.
    let member = null;
    while (st.queue.length && !member) {
      const id = st.queue.shift();
      member = await i.guild.members.fetch(id).catch(() => null);
    }
    store.save();

    if (!member) {
      await editStatus(i.client, region);
      return say(i, 'The queue is empty.');
    }

    const channel = await i.guild.channels.create({
      name: `${channelSafe(member.user.username)}-tiertest`,
      type: ChannelType.GuildText,
      parent: config.openTestsCategoryId,
      topic: `${region} tier test | player: ${member.user.username} | tester: ${i.user.username}`,
      permissionOverwrites: [
        { id: i.guild.roles.everyone.id, deny: [P.ViewChannel] },
        { id: member.id, allow: TEST_PERMS },
        { id: i.user.id, allow: [...TEST_PERMS, P.ManageMessages] },
        { id: config.testerRoleId, allow: [P.ViewChannel, P.SendMessages, P.ReadMessageHistory] },
      ],
    });

    store.data.tests[channel.id] = { userId: member.id, testerId: i.user.id, region };
    store.save();

    const profile = store.data.profiles[member.id] || {};
    const verified = store.data.users[member.id]?.username;
    const embed = new EmbedBuilder()
      .setColor(0x1e90ff)
      .setTitle('Tier Test')
      .addFields(
        { name: 'Player', value: `<@${member.id}>`, inline: true },
        { name: 'Tester', value: `<@${i.user.id}>`, inline: true },
        { name: 'Region', value: region, inline: true },
        { name: 'Minecraft username', value: verified || 'Not verified', inline: true },
        { name: 'Preferred server', value: profile.server || 'Not provided', inline: true }
      )
      .setFooter({ text: 'SwimTiers | Tester: use /closetest when the test is finished.' });

    await channel.send({ content: `<@${member.id}> <@${i.user.id}>`, embeds: [embed] });

    // The new #1 gets a DM.
    const nextId = st.queue[0];
    if (nextId) {
      i.client.users
        .fetch(nextId)
        .then((u) =>
          u.send({ embeds: [feedback(`You are **#1** in the **${region}** queue. Get ready to test!`)] })
        )
        .catch(() => {}); // DMs closed
    }

    await editStatus(i.client, region);
    return say(i, `Test channel created: <#${channel.id}>`);
  },
};
