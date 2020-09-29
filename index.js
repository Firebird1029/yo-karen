const Discord = require("discord.js"),
	puppeteer = require("puppeteer");
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

// client.login(process.env.BOT_TOKEN).catch((err) => {
// 	console.log(err);
// });

(async () => {
	console.log("Start");
	const browser = await puppeteer.launch();
	const page = await browser.newPage();
	await page.goto("https://www.cleverbot.com/");
	console.log("Page loaded");

	// Send over a message
	console.log("Sending message");
	await page.evaluate(() => {
		document.querySelector(".stimulus").value = "test";
		cleverbot.sendAI();
	});

	// Wait for response
	console.log("Awaiting response");
	await page.waitForSelector("#snipTextIcon"); // #snipTextIcon is added to DOM when the bot finishes speaking

	// Parse response
	const response = await page.evaluate(() => {
		return document.querySelector("#line1 .bot").textContent; // the bot always says its last message in #line1
	});
	console.log(response);

	console.log("Closing");
	await browser.close();
	console.log("Closed");
})();

/*
 * Resources
 * https://www.digitalocean.com/community/tutorials/how-to-build-a-discord-bot-with-node-js
 */
