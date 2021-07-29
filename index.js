const botconfig = require("./botconfig.json");
const Discord = require("discord.js");
const ytdl = require("ytdl-core");
const ffmpeg = require("ffmpeg");

const bot = new Discord.Client({ disableEveryone: true })

const queue = new Map();

function secondsToString(seconds) {
    var days = Math.floor(seconds / 86400);
    var hours = Math.floor((seconds % 86400) / 3600);
    var minutes = Math.floor((seconds % 3600) / 60);
    var seconds = Math.floor(seconds % 60);

    var str = "";

    if (days > 0) {
        str += days + ":";
    }
    if (hours < 10) {
        hours = "0" + hours;
    }
    if (minutes < 10) {
        minutes = "0" + minutes;
    }
    if (seconds < 10) {
        seconds = "0" + seconds;
    }

    str += hours + ":";
    str += minutes + ":";
    str += seconds;

    return str;
}

bot.on("ready", async () => {
    console.log(`${bot.user.username} believes!`)
    let prefix = botconfig.prefix;
    bot.user.setActivity(`${prefix}help`)
});

bot.on("message", async message => {
    let prefix = botconfig.prefix;
    let messageArray = message.content.split(" ");
    let cmd = messageArray[0];
    let args = messageArray.slice(1);

    if (message.author.bot) return;
    if (message.channel.type == "dm") return;






    if (message.content.toLowerCase() === "praise wooloo") return message.reply('I believe in you');

    if (message.content.toLowerCase() === "wooloo") return message.channel.sendFile("wooloo.png");

    if (cmd === `${prefix}help`)   return message.channel.send("Music commands: play (URL), skip, stop\nOther Commands: uptime, version, help");

    if (cmd === `${prefix}uptime`) return message.channel.send(secondsToString(process.uptime()));

    if (cmd == `${prefix}version`) return message.channel.send(botconfig.version);

    //music part
    const serverQueue = queue.get(message.guild.id);
    if (cmd === `${prefix}play`) {
        const voiceChannel = message.member.voiceChannel;
        if (!voiceChannel) return;
        const permissions = voiceChannel.permissionsFor(message.client.user)
        if (!permissions.has("CONNECT")) return;
        if (!permissions.has("SPEAK")) return;
        const songInfo = await ytdl.getInfo(args[0]);

        const song =
        {
            title: songInfo.title, url: songInfo.video_url
        };

        if (!serverQueue) {
            
            const queueConstruct = {
                textChannel: message.channel,
                voiceChannel: voiceChannel,
                connection: null,
                songs: [],
                volume: 5,
                playing: true
            };
            queue.set(message.guild.id, queueConstruct);
            queueConstruct.songs.push(song);
            try {
                var connection = await voiceChannel.join();
                queueConstruct.connection = connection;
                play(message.guild, queueConstruct.songs[0]);
            } catch (error) {
                console.error(`I was unable to join the voice channel ${voiceChannel}, the error is : ${error}`);
                return;
               
            }
        } else {
            serverQueue.songs.push(song);
            message.channel.send( song.title + " has now been added to the queue");
            return;
        }
        message.channel.send("Now playing " + song.title);
        return;


    }
    if (cmd === `${prefix}stop`) {
        if (!message.member.voiceChannel) return;
        message.member.voiceChannel.leave();
        message.channel.send("Player stopped.");
        return;
    }

    if (cmd === `${prefix}skip`) {
        if (!serverQueue) return message.channel.send(`I could not skip anything.`);
        serverQueue.connection.dispatcher.end();
        return;
    }
});

//Always on music :
function play(guild, song) {
    const serverQueue = queue.get(guild.id);

    if (!song) {
        serverQueue.voiceChannel.leave();
        queue.delete(guild.id);
        return;
    }

    const dispatcher = serverQueue.connection.playStream(ytdl(song.url))
        .on('end', () => {
            console.log(`song ended`);
            serverQueue.songs.shift();
            play(guild, serverQueue.songs[0]);
            return;
        })
        .on('error', error => console.error(error));

    dispatcher.setVolumeLogarithmic(5 / 5);
}




bot.login(botconfig.token);