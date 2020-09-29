const Discord = require("discord.js");
const client = new Discord.Client();

const prefix = "yo karen "; // or "!", "-", "%"
client.on("message", (message) => {
	if (message.author.bot) return;
	if (!message.content.startsWith(prefix)) return;

	// Parse Command and Arguments
	const args = message.content.slice(prefix.length).split(" ");
	const command = args.shift().toLowerCase();

	// Commands
	if (command === "ping") {
		const timeTaken = Date.now() - message.createdTimestamp;
		message.reply(`Pong! This message had a latency of ${timeTaken} ms.`);
	}
});

client.login(process.env.BOT_TOKEN).catch((err) => {
	console.log(err);
});
