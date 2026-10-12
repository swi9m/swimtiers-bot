const { REST, Routes } = require('discord.js');
const config = require('./config');
const { loadCommands } = require('./commands');

const body = [...loadCommands().values()].map((c) => c.data.toJSON());
const rest = new REST({ version: '10' }).setToken(config.token);

rest
  .put(Routes.applicationGuildCommands(config.clientId, config.guildId), { body })
  .then(() => console.log(`Registered ${body.length} commands: ${body.map((c) => '/' + c.name).join(', ')}`))
  .catch(console.error);
