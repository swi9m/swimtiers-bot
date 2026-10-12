const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const store = require('./store');
const { fmtTime, RED } = require('./util');

// ── Image 1: the "request test" message ──
function requestTestMessage() {
  const embed = new EmbedBuilder()
    .setColor(0xe8114b)
    .setTitle('📝 Evaluation Testing Waitlist')
    .setDescription(
      [
        'Upon applying, you will be added to a waitlist channel.',
        'Here you will be pinged when a tester of your region is available.',
        'If you are HT3 or higher, a high ticket will be created.',
        '',
        '• Region should be the region of the server you wish to test on',
        '',
        '• Username should be the name of the account you will be testing on',
        '',
        '🛑 **Failure to provide authentic information will result in a denied test.**',
      ].join('\n')
    );

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('verify_account').setLabel('Verify Account').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('enter_waitlist').setLabel('Enter Waitlist').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('view_cooldown').setLabel('View Cooldown').setStyle(ButtonStyle.Primary)
  );

  return { embeds: [embed], components: [row] };
}

// ── Image 2: no testers online ──
function noTestersEmbed(region) {
  const last = store.data.queues[region].lastSession;
  return new EmbedBuilder()
    .setColor(RED)
    .setTitle('No Testers Online')
    .setDescription(
      [
        'No testers for your region are available at this time.',
        'You will be pinged when a tester is available.',
        'Check back later!',
        '',
        `Last testing session: \`${last ? fmtTime(last) : 'Never'}\``,
      ].join('\n')
    );
}

// ── Image 3: tester available ──
function queueEmbed(region) {
  const st = store.data.queues[region];
  const queueText = st.queue.length
    ? st.queue.map((id, i) => `${i + 1}. <@${id}>`).join('\n')
    : 'The queue is empty.';
  const testerText = st.active.length ? st.active.map((id, i) => `${i + 1}. <@${id}>`).join('\n') : 'None';

  return new EmbedBuilder()
    .setColor(0x1e90ff)
    .setTitle('Tester Available!')
    .setDescription(
      '⏳ Queue updates in real-time every second.\nClick **leave** if you want to leave the queue or be removed.'
    )
    .addFields({ name: 'Queue:', value: queueText }, { name: 'Active Testers:', value: testerText });
}

function queueRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('queue_join').setLabel('Join').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('queue_leave').setLabel('Leave').setStyle(ButtonStyle.Secondary)
  );
}

// The message that lives in each waitlist channel: image 3 when open, image 2 when closed.
function statusPayload(region) {
  if (store.data.queues[region].open) {
    return {
      content: '@here',
      embeds: [queueEmbed(region)],
      components: [queueRow()],
      allowedMentions: { parse: ['everyone'] },
    };
  }
  return { content: '', embeds: [noTestersEmbed(region)], components: [] };
}

module.exports = { requestTestMessage, statusPayload };
