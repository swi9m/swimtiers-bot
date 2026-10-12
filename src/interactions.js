const { ActionRowBuilder, MessageFlags, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const config = require('./config');
const store = require('./store');
const { editStatus } = require('./queue');
const { say, RED, regionOfChannel } = require('./util');

const MC_NAME = /^[A-Za-z0-9_]{3,16}$/;

const input = (id, label, placeholder, max) =>
  new ActionRowBuilder().addComponents(
    new TextInputBuilder()
      .setCustomId(id)
      .setLabel(label)
      .setPlaceholder(placeholder)
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(max)
  );

const ts = (ms) => Math.floor(ms / 1000);

const buttons = {
  // ── Verify Account → popup ──
  verify_account: (i) =>
    i.showModal(
      new ModalBuilder()
        .setCustomId('verify_modal')
        .setTitle('Verify Account')
        .addComponents(input('username', 'Username', 'Your Minecraft username', 16))
    ),

  // ── Enter Waitlist → popup ──
  enter_waitlist: (i) =>
    i.showModal(
      new ModalBuilder()
        .setCustomId('waitlist_modal')
        .setTitle('Enter Waitlist')
        .addComponents(
          input('region', 'Region', 'EU, NA or AS', 2),
          input('server', 'Preferred server', 'Server IP', 100)
        )
    ),

  // ── View Cooldown ──
  view_cooldown: async (i) => {
    const expiry = store.getCooldown(i.user.id);
    if (!expiry) return say(i, 'You are not on a cooldown. You can enter the waitlist.');
    return say(i, `You are on cooldown. You can test again <t:${ts(expiry)}:R> (<t:${ts(expiry)}:f>).`);
  },

  // ── Queue: Join ──
  queue_join: async (i) => {
    const region = regionOfChannel(i.channelId);
    if (!region) return say(i, 'This button is not linked to a queue.', RED);
    const st = store.data.queues[region];

    if (!st.open) return say(i, 'The queue is currently closed.');
    const pos = st.queue.indexOf(i.user.id);
    if (pos !== -1) return say(i, `You are already in the queue (position #${pos + 1}).`);

    const expiry = store.getCooldown(i.user.id);
    if (expiry) return say(i, `You are on cooldown. You can test again <t:${ts(expiry)}:R>.`);

    if (!i.member.roles.cache.has(config.waitlistRoles[region]))
      return say(i, `You need to enter the ${region} waitlist first. Use **Enter Waitlist** in <#${config.requestTestChannelId}>.`);

    if (st.queue.length >= config.MAX_QUEUE) return say(i, 'Queue full. Try again in a bit.');

    // State changes happen synchronously, before any await, so two clicks can't both take the last spot.
    st.queue.push(i.user.id);
    store.save();
    await say(i, `You joined the queue. Your position: **#${st.queue.length}**.`);
    await editStatus(i.client, region);
  },

  // ── Queue: Leave ──
  queue_leave: async (i) => {
    const region = regionOfChannel(i.channelId);
    if (!region) return say(i, 'This button is not linked to a queue.', RED);
    const st = store.data.queues[region];

    const idx = st.queue.indexOf(i.user.id);
    if (idx === -1) return say(i, 'You are not in the queue.');

    st.queue.splice(idx, 1);
    store.save();
    await say(i, 'You left the queue.');
    await editStatus(i.client, region);
  },
};

const modals = {
  // ── Verify Account submit ──
  verify_modal: async (i) => {
    const username = i.fields.getTextInputValue('username').trim();
    if (!MC_NAME.test(username)) return say(i, 'That is not a valid Minecraft username (3-16 letters, numbers or underscores).', RED);

    const owner = store.findOwner(username);
    if (owner && owner !== i.user.id) return say(i, 'User already is registered.', RED);

    store.setUsername(i.user.id, username);
    return say(i, `Your account has been verified as **${username}**.`);
  },

  // ── Enter Waitlist submit ──
  waitlist_modal: async (i) => {
    await i.deferReply({ flags: MessageFlags.Ephemeral });

    const region = i.fields.getTextInputValue('region').trim().toUpperCase();
    const server = i.fields.getTextInputValue('server').trim();

    if (!config.REGIONS.includes(region)) return say(i, 'Region must be **EU**, **NA** or **AS**.', RED);
    if (!server) return say(i, 'Please enter the server IP you want to test on.', RED);
    if (config.requireVerify && !store.data.users[i.user.id])
      return say(i, 'You need to verify your account first. Press **Verify Account**.', RED);

    const expiry = store.getCooldown(i.user.id);
    if (expiry) return say(i, `You are on cooldown. You can enter the waitlist <t:${ts(expiry)}:R>.`);

    // One waitlist role at a time.
    const others = config.REGIONS.filter((r) => r !== region)
      .map((r) => config.waitlistRoles[r])
      .filter((id) => i.member.roles.cache.has(id));
    if (others.length) await i.member.roles.remove(others);
    await i.member.roles.add(config.waitlistRoles[region]);

    store.data.profiles[i.user.id] = { region, server, at: Date.now() };
    store.save();

    return say(i, `You have been added to the **${region} waitlist**. Head to <#${config.waitlistChannels[region]}> and press **Join** when a tester is available.`);
  },
};

module.exports = { buttons, modals };
