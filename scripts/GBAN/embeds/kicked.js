const { EmbedBuilder } = require("discord.js");

module.exports = (main, name, reason) =>
    new EmbedBuilder()
        .setColor(0xe23a3a)
        .setTitle(main.lang.run("gban.kicked", [name]))
        .setDescription(`${main.lang.run("gban.banned.player", [name])}\n${main.lang.run("gban.reason", [reason])}`)
        .setFooter({ text: main.lang.run("gban") });
