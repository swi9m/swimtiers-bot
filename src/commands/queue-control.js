const { SlashCommandBuilder } = require('discord.js');
const store = require('../store');
const { postStatus, editStatus } = require('../queue');
const { say, isTester, addRegion, RED } = require('../util');

const NO_PERMS = 'Only testers can use this command.';

const openqueue = {
  data: addRegion(
    new SlashCommandBuilder().setName('openqueue').setDescription('Open the queue for a region and become an active tester')
  ).setDMPermission(false),

  async execute(i) {
    if (!isTester(i.member)) return say(i, NO_PERMS, RED);
    const region = i.options.getString('region', true);
    const st = store.data.queues[region];

    const wasOpen = st.open;
    st.open = true;
    if (!st.active.includes(i.user.id)) st.active.push(i.user.id);
    store.save();

    await say(i, wasOpen ? `You were added as an active tester for **${region}**.` : `The **${region}** queue is now open.`);
    // Opening: delete the "No Testers Online" message and post the queue (pings @here).
    // Already open: just update the existing queue message.
    return wasOpen ? editStatus(i.client, region) : postStatus(i.client, region);
  },
};

const closequeue = {
  data: addRegion(
    new SlashCommandBuilder().setName('closequeue').setDescription('Close the queue for a region')
  ).setDMPermission(false),

  async execute(i) {
    if (!isTester(i.member)) return say(i, NO_PERMS, RED);
    const region = i.options.getString('region', true);
    const st = store.data.queues[region];

    if (!st.open) return say(i, `The **${region}** queue is already closed.`);

    st.open = false;
    st.active = [];
    st.queue = [];
    st.lastSession = Date.now();
    store.save();

    await say(i, `The **${region}** queue is now closed.`);
    // Delete the queue message and post "No Testers Online".
    return postStatus(i.client, region);
  },
};

const addtester = {
  data: addRegion(
    new SlashCommandBuilder()
      .setName('addtester')
      .setDescription('Add a tester to the active testers list of an open queue')
      .addUserOption((o) => o.setName('user').setDescription('Tester to add').setRequired(true))
  ).setDMPermission(false),

  async execute(i) {
    if (!isTester(i.member)) return say(i, NO_PERMS, RED);
    const region = i.options.getString('region', true);
    const user = i.options.getUser('user', true);
    const st = store.data.queues[region];

    if (!st.open) return say(i, `The **${region}** queue is closed. Use /openqueue first.`);
    if (st.active.includes(user.id)) return say(i, `<@${user.id}> is already an active tester.`);

    st.active.push(user.id);
    store.save();
    await say(i, `Added <@${user.id}> to the active testers for **${region}**.`);
    return editStatus(i.client, region);
  },
};

module.exports = [openqueue, closequeue, addtester];
