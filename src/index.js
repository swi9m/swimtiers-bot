const { Client, Events, GatewayIntentBits, MessageFlags } = require('discord.js');
const config = require('./config');
const { loadCommands } = require('./commands');
const { buttons, modals } = require('./interactions');
const { editStatus } = require('./queue');
const { feedback, RED } = require('./util');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const commands = loadCommands();

client.once(Events.ClientReady, async (c) => {
  console.log(`SwimTiers online as ${c.user.tag}`);
  c.user.setPresence({ activities: [{ name: 'SwimTiers | tier testing' }] });
  // Make sure every region's waitlist channel shows either "No Testers Online" or the live queue.
  for (const region of config.REGIONS) await editStatus(c, region);
});

client.on(Events.InteractionCreate, async (i) => {
  try {
    if (i.isChatInputCommand()) {
      const cmd = commands.get(i.commandName);
      if (cmd) await cmd.execute(i);
    } else if (i.isButton()) {
      await buttons[i.customId]?.(i);
    } else if (i.isModalSubmit()) {
      await modals[i.customId]?.(i);
    }
  } catch (err) {
    console.error(`Error handling ${i.commandName || i.customId}:`, err);
    const payload = { embeds: [feedback('Something went wrong. Please try again or tell an admin.', RED)] };
    if (i.deferred) i.editReply(payload).catch(() => {});
    else if (i.replied) i.followUp({ ...payload, flags: MessageFlags.Ephemeral }).catch(() => {});
    else if (i.isRepliable()) i.reply({ ...payload, flags: MessageFlags.Ephemeral }).catch(() => {});
  }
});

client.login(config.token);
