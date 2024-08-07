const fs = require('fs');
const path = require('path');

class ScriptHandler {
  /** @param {import('../index')} main */
  constructor(main) {
    this.main = main;
  }
  
  load() {
    const entry = this.main.config.scripts_entry;
    if (!entry) return;
    const exists = fs.existsSync(path.resolve(__dirname, `../../${entry}`));
    if (!exists) throw Error(`[Script] entrypoint "${entry}" not found`);
    try {
      require(`../../${entry}`);
    } catch (e) {
      console.error('[Script]', e);
    }
  }

  loadGBAN() {
    const entry = "scripts/GBAN/index.js";
    if (!entry) return;
    const exists = fs.existsSync(path.resolve(__dirname, `../../${entry}`));
    if (!exists) throw Error(`[GBAN] entrypoint "${entry}" not found`);
    try {
      require(`../../${entry}`).main(this.main);
    } catch (e) {
      console.error('[GBAN]', e);
    }
  }
}

module.exports = { ScriptHandler };