const Discord = require("discord.js"),
	puppeteer = require("puppeteer");
const client = new Discord.Client();

const prefix = "yo karen "; // or "!", "-", "%"

(async () => {
	console.log("Start");
	const browser = await puppeteer.launch();
	const page = await browser.newPage();
	await page.goto("https://www.cleverbot.com/");
	console.log("Page loaded");

	async function askCleverBot(request) {
		// Send over a message
		console.log("Sending message");
		await page.evaluate((request) => {
			document.querySelector(".stimulus").value = request;
			cleverbot.sendAI(); // a form submit event triggers this API call
		}, request); // bind request variable into evaluate function

		// Wait for response
		console.log("Awaiting response");
		await page.waitForSelector("#snipTextIcon"); // #snipTextIcon is added to DOM when the bot finishes speaking

		// Parse response
		const response = await page.evaluate(() => {
			return document.querySelector("#line1 .bot").textContent; // the bot always says its last message in #line1
		});
		console.log(response);
	}

	// Discord Code
	// ----------
	client.on("message", (message) => {
		if (message.author.bot) return;
		if (!message.content.startsWith(prefix)) return;

		// Parse Command and Arguments
		const args = message.content.slice(prefix.length).split(" ");
		// const command = args.shift().toLowerCase();

		// Commands
		// if (command === "ping") {
		// 	const timeTaken = Date.now() - message.createdTimestamp;
		// 	message.reply(`Pong! This message had a latency of ${timeTaken} ms.`);
		// }
		askCleverBot(args);
	});

	client.login(process.env.BOT_TOKEN).catch((err) => {
		console.log(err);
	});
	// ----------

	// console.log("Closing");
	// await browser.close();
	// console.log("Closed");
})();

/*
 * Resources
 * https://github.com/puppeteer/puppeteer
 * https://gist.github.com/LeCoupa/e8b9aac95d0d7acbde740c91c4bcc178
 * https://www.digitalocean.com/community/tutorials/how-to-build-a-discord-bot-with-node-js
 */
