// ============================================
// EMPTY TERRITORY - PROFESSIONAL MUSIC BOT
// SINGLE FILE READY VERSION
// ============================================

// INSTALL:
// npm i discord.js distube @distube/youtube ffmpeg-static libsodium-wrappers dotenv

// RUN:
// node bot.js

require("dotenv").config();
require("opusscript");

const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    SlashCommandBuilder,
    REST,
    Routes,
    Events
} = require("discord.js");

const { DisTube } = require("distube");
const { YouTubePlugin } = require("@distube/youtube");

const fs = require("fs");

// ============================================
// CONFIG
// ============================================

const TOKEN = "MTUwMjU3ODY4ODE0MTgyNDA1MQ.GPBKdK.1hilNdy7fa7Oi53vtqJzcdoA4ar5inyLE5_2So";
const CLIENT_ID = "1502578688141824051";

// ============================================
// CLIENT
// ============================================

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages
    ]
});

// ============================================
// DISTUBE
// ============================================

client.distube = new DisTube(client, {
    plugins: [
        new YouTubePlugin()
    ],
    ffmpeg: {
        path: require("ffmpeg-static")
    },
    customFilters: {
        clear: ""
    }
});

// ============================================
// PLAYLIST FOLDER
// ============================================

if (!fs.existsSync("./playlists")) {
    fs.mkdirSync("./playlists");
}

// ============================================
// SLASH COMMANDS
// ============================================

const commands = [

    new SlashCommandBuilder()
        .setName("play")
        .setDescription("Play a song")
        .addStringOption(option =>
            option
                .setName("song")
                .setDescription("Song name or URL")
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName("skip")
        .setDescription("Skip current song"),

    new SlashCommandBuilder()
        .setName("stop")
        .setDescription("Stop music"),

    new SlashCommandBuilder()
        .setName("pause")
        .setDescription("Pause music"),

    new SlashCommandBuilder()
        .setName("resume")
        .setDescription("Resume music"),

    new SlashCommandBuilder()
        .setName("queue")
        .setDescription("View queue"),

    new SlashCommandBuilder()
        .setName("volume")
        .setDescription("Change volume")
        .addIntegerOption(option =>
            option
                .setName("amount")
                .setDescription("1-100")
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName("saveplaylist")
        .setDescription("Save current queue")
        .addStringOption(option =>
            option
                .setName("name")
                .setDescription("Playlist name")
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName("loadplaylist")
        .setDescription("Load saved playlist")
        .addStringOption(option =>
            option
                .setName("name")
                .setDescription("Playlist name")
                .setRequired(true)
        )

].map(command => command.toJSON());

// ============================================
// DEPLOY COMMANDS
// ============================================

const rest = new REST({
    version: "10"
}).setToken(TOKEN);

(async () => {

    try {

        console.log("Deploying slash commands...");

        await rest.put(
            Routes.applicationCommands(CLIENT_ID),
            {
                body: commands
            }
        );

        console.log("Slash commands deployed.");

    } catch (err) {

        console.log(err);

    }

})();

// ============================================
// READY EVENT
// ============================================

client.once(Events.ClientReady, () => {

    console.log(`Logged in as ${client.user.tag}`);

    client.user.setPresence({
        activities: [
            {
                name: "🎵 Premium Music",
                type: 2
            }
        ],
        status: "online"
    });

});

// ============================================
// NOW PLAYING EVENT
// ============================================

client.distube.on("playSong", async (queue, song) => {

    const embed = new EmbedBuilder()
        .setColor("#5865F2")
        .setTitle("🎵 NOW PLAYING")
        .setDescription(
            `# ${song.name}\n\n` +
            `⏱️ Duration: \`${song.formattedDuration}\`\n` +
            `👤 Requested By: ${song.user}\n` +
            `🔊 Volume: \`${queue.volume}%\``
        )
        .setThumbnail(song.thumbnail)
        .setImage("https://i.imgur.com/8iID9Ps.gif")
        .setFooter({
            text: "Empty Territory Music"
        });

    const row = new ActionRowBuilder()
        .addComponents(

            new ButtonBuilder()
                .setCustomId("pause")
                .setEmoji("⏸️")
                .setStyle(ButtonStyle.Secondary),

            new ButtonBuilder()
                .setCustomId("resume")
                .setEmoji("▶️")
                .setStyle(ButtonStyle.Success),

            new ButtonBuilder()
                .setCustomId("skip")
                .setEmoji("⏭️")
                .setStyle(ButtonStyle.Primary),

            new ButtonBuilder()
                .setCustomId("stop")
                .setEmoji("⏹️")
                .setStyle(ButtonStyle.Danger)

        );

    queue.textChannel.send({
        embeds: [embed],
        components: [row]
    });

});

// ============================================
// BUTTON INTERACTIONS
// ============================================

client.on("interactionCreate", async interaction => {

    if (!interaction.isButton()) return;

    const queue = client.distube.getQueue(interaction.guildId);

    if (!queue) {

        return interaction.reply({
            content: "❌ No music playing.",
            ephemeral: true
        });

    }

    if (interaction.customId === "pause") {

        queue.pause();

        return interaction.reply({
            content: "⏸️ Paused",
            ephemeral: true
        });

    }

    if (interaction.customId === "resume") {

        queue.resume();

        return interaction.reply({
            content: "▶️ Resumed",
            ephemeral: true
        });

    }

    if (interaction.customId === "skip") {

        queue.skip();

        return interaction.reply({
            content: "⏭️ Skipped",
            ephemeral: true
        });

    }

    if (interaction.customId === "stop") {

        queue.stop();

        return interaction.reply({
            content: "⏹️ Stopped",
            ephemeral: true
        });

    }

});

// ============================================
// SLASH COMMAND HANDLER
// ============================================

client.on("interactionCreate", async interaction => {

    if (!interaction.isChatInputCommand()) return;

    const voiceChannel = interaction.member.voice.channel;

    // PLAY

    if (interaction.commandName === "play") {

        if (!voiceChannel) {

            return interaction.reply({
                content: "❌ Join a VC first.",
                ephemeral: true
            });

        }

        const song = interaction.options.getString("song");

        await interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor("#5865F2")
                    .setDescription(`🔎 Searching for **${song}**`)
            ]
        });

        client.distube.play(
            voiceChannel,
            song,
            {
                member: interaction.member,
                textChannel: interaction.channel
            }
        );

    }

    // SKIP

    if (interaction.commandName === "skip") {

        const queue = client.distube.getQueue(interaction.guildId);

        if (!queue) {
            return interaction.reply("❌ No queue.");
        }

        queue.skip();

        interaction.reply("⏭️ Skipped.");

    }

    // STOP

    if (interaction.commandName === "stop") {

        const queue = client.distube.getQueue(interaction.guildId);

        if (!queue) {
            return interaction.reply("❌ No queue.");
        }

        queue.stop();

        interaction.reply("⏹️ Stopped.");

    }

    // PAUSE

    if (interaction.commandName === "pause") {

        const queue = client.distube.getQueue(interaction.guildId);

        if (!queue) {
            return interaction.reply("❌ No queue.");
        }

        queue.pause();

        interaction.reply("⏸️ Paused.");

    }

    // RESUME

    if (interaction.commandName === "resume") {

        const queue = client.distube.getQueue(interaction.guildId);

        if (!queue) {
            return interaction.reply("❌ No queue.");
        }

        queue.resume();

        interaction.reply("▶️ Resumed.");

    }

    // QUEUE

    if (interaction.commandName === "queue") {

        const queue = client.distube.getQueue(interaction.guildId);

        if (!queue) {
            return interaction.reply("❌ Queue empty.");
        }

        const songs = queue.songs
            .map((song, i) => `\`${i + 1}.\` ${song.name}`)
            .slice(0, 10)
            .join("\n");

        const embed = new EmbedBuilder()
            .setColor("#111214")
            .setTitle("🎶 MUSIC QUEUE")
            .setDescription(songs);

        interaction.reply({
            embeds: [embed]
        });

    }

    // VOLUME

    if (interaction.commandName === "volume") {

        const queue = client.distube.getQueue(interaction.guildId);

        if (!queue) {
            return interaction.reply("❌ No queue.");
        }

        const amount = interaction.options.getInteger("amount");

        queue.setVolume(amount);

        interaction.reply(`🔊 Volume set to ${amount}%`);

    }

    // SAVE PLAYLIST

    if (interaction.commandName === "saveplaylist") {

        const queue = client.distube.getQueue(interaction.guildId);

        if (!queue) {
            return interaction.reply("❌ No queue.");
        }

        const name = interaction.options.getString("name");

        const songs = queue.songs.map(song => song.url);

        fs.writeFileSync(
            `./playlists/${name}.json`,
            JSON.stringify(songs, null, 2)
        );

        interaction.reply(`✅ Playlist saved as **${name}**`);

    }

    // LOAD PLAYLIST

    if (interaction.commandName === "loadplaylist") {

        if (!voiceChannel) {
            return interaction.reply("❌ Join VC first.");
        }

        const name = interaction.options.getString("name");

        const file = `./playlists/${name}.json`;

        if (!fs.existsSync(file)) {
            return interaction.reply("❌ Playlist not found.");
        }

        const songs = JSON.parse(
            fs.readFileSync(file)
        );

        await interaction.reply(
            `📂 Loading playlist **${name}**`
        );

        for (const song of songs) {

            client.distube.play(
                voiceChannel,
                song,
                {
                    member: interaction.member,
                    textChannel: interaction.channel
                }
            );

        }

    }

});

// ============================================
// LOGIN
// ============================================

client.login("MTUwMjU3ODY4ODE0MTgyNDA1MQ.GPBKdK.1hilNdy7fa7Oi53vtqJzcdoA4ar5inyLE5_2So");
