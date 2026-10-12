const fs = require('fs');
const path = require('path');

// Loads every command file in this folder. A file may export one command or an array of commands.
function loadCommands() {
  const commands = new Map();
  for (const file of fs.readdirSync(__dirname)) {
    if (file === 'index.js' || !file.endsWith('.js')) continue;
    for (const cmd of [].concat(require(path.join(__dirname, file)))) {
      commands.set(cmd.data.name, cmd);
    }
  }
  return commands;
}

module.exports = { loadCommands };
