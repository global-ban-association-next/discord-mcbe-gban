const { server, client, version } = require("discord-mcbe");
const { Logger } = require("socket-be");
const logo = require("./logo.js");
const kicked = require("./embeds/kicked.js");

const ALT_GBAN_REFERENCES = ["https://gban.un-known.xyz/list.json", "https://api.github.com/repos/Unknown-Creators-Team/GBan/contents/list.json"];

let GBan = [],
    useAlt = false;

/** @param {import('../src/index')} main */
async function main(main) {
    if (!main.config.gban.enable) return;

    console.log(logo);

    const logger = new Logger("GBAN", {
        timezone: main.config.timezone,
        debug: main.config.debug,
    });

    logger.info(main.lang.run("gban.running", [version]));

    GBan = await fetchGBan();
    logger.info(main.lang.run("gban.fetched", [GBan.length]));

    server.events.on("playerJoin", async (event) => {
        const { world, players } = event;
        const details = (await world.getPlayerDetail()).details;

        for (const ply of players) {
            if (main.config.gban.whitelist.includes(ply)) continue;
            const player = details.find((p) => p.name === ply);
            if (!player) continue;

            if (!useAlt) {
                try {
                    // const uri = "http://api.gban.un-known.xyz/v1/search";
                    const uri = "http://localhost/v1/search";
                    const res = await fetch(uri.replace("/search", "")).catch(() => {
                        throw new Error(main.lang.run("gban.error.failedConnect"));
                    });
                    if ((await res.text()) !== "GBan API v1") throw new Error(main.lang.run("gban.error.failedConnect"));

                    const checks = [
                        await (await fetch(`${uri}/did/${player.deviceSessionId}`)).json().catch(() => {}),
                        await (await fetch(`${uri}/uuid/${player.uuid}`)).json().catch(() => {}),
                        await (await fetch(`${uri}/name/${player.name}`)).json().catch(() => {}),
                    ];
                    const check = checks.find(Boolean);
                    if (check && check.status === "active") {
                        logger.warn(main.lang.run("gban.banned.player", [player.name]));
                        await world.runCommand(
                            `kick "${player.name}" §r\n${main.lang.run("gban.mc.banned.you")}\n${main.lang.run("gban.mc.reason", [
                                check.reason,
                            ])}\n\n${main.lang.run("gban")}`
                        );
                        await world.sendMessage(banMsg(main, player.name, check.reason));
                        await main.sendDiscord({ embeds: [kicked(main, player.name, check.reason)] });
                    }
                } catch (e) {
                    logger.error(main.lang.run("gban.error.checking", [player.name]));
                    logger.error(e);
                    useAlt = true;
                    logger.warn(main.lang.run("gban.warn.alt"));
                }
            } else {
                const check = GBan.find((entry) => {
                    return entry.name === player.name || entry.xuid === player.uuid || entry.did === player.deviceSessionId;
                });

                if (check) {
                    logger.warn(main.lang.run("gban.banned.player", [player.name]));
                    await world.runCommand(
                        `kick "${player.name}" §r\n${main.lang.run("gban.mc.banned.you")}\n${main.lang.run("gban.mc.reason", [
                            check.reason,
                        ])}\n\n${main.lang.run("gban")}`
                    );
                    world.sendMessage(banMsg(main, player.name, check.reason));
                    await main.sendDiscord({ embeds: [kicked(main, player.name, check.reason)] });
                }
            }
        }
    });
}

async function fetchGBan() {
    for (const url of ALT_GBAN_REFERENCES) {
        try {
            const response = await fetch(url);
            const json = await response.json();
            if (isJsonObject(json)) {
                return json;
            } else {
                const decoded = JSON.parse(atob(json.content));
                if (isJsonObject(decoded)) {
                    return decoded;
                }
            }
        } catch (error) {
            console.error(error);
        }
    }

    return [];
}

function isJsonObject(json) {
    try {
        JSON.stringify(json);
        return true;
    } catch (error) {
        return false;
    }
}

function banMsg(main, name, reason) {
    const msgs = [
        "-".repeat(30),
        main.lang.run("gban.mc.banned.player", [name]),
        main.lang.run("gban.mc.reason", [reason]),
        "",
        main.lang.run("gban"),
        "-".repeat(30),
    ];

    return msgs.join("\n");
}

module.exports = { main };