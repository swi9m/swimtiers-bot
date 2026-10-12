const config = require('./config');
const store = require('./store');
const { statusPayload } = require('./embeds');

// Serialize message operations per region so edits never arrive out of order.
const chains = {};
function run(region, fn) {
  const p = (chains[region] || Promise.resolve()).then(fn).catch((e) => console.error(`[queue ${region}]`, e));
  chains[region] = p;
  return p;
}

async function channelFor(client, region) {
  const ch = await client.channels.fetch(config.waitlistChannels[region]).catch(() => null);
  if (!ch || !ch.isTextBased()) {
    console.error(`Waitlist channel for ${region} not found - check CHANNEL_WAITLIST_${region}`);
    return null;
  }
  return ch;
}

// Delete the old status message and send a fresh one (used when the queue opens/closes, so @here pings).
function postStatus(client, region) {
  return run(region, async () => {
    const st = store.data.queues[region];
    const ch = await channelFor(client, region);
    if (!ch) return;
    if (st.messageId) {
      await ch.messages.delete(st.messageId).catch(() => {});
      st.messageId = null;
    }
    const msg = await ch.send(statusPayload(region));
    st.messageId = msg.id;
    store.save();
  });
}

// Edit the existing status message in place (queue changes). Re-sends if it was deleted.
function editStatus(client, region) {
  return run(region, async () => {
    const st = store.data.queues[region];
    const ch = await channelFor(client, region);
    if (!ch) return;
    if (st.messageId) {
      try {
        await ch.messages.edit(st.messageId, statusPayload(region));
        return;
      } catch (e) {
        if (e.code !== 10008) throw e; // 10008 = Unknown Message
      }
    }
    const msg = await ch.send(statusPayload(region));
    st.messageId = msg.id;
    store.save();
  });
}

module.exports = { postStatus, editStatus };
