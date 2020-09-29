const Discord = require("discord.js"),
	puppeteer = require("puppeteer");
const client = new Discord.Client();

// Config
const debug = false;
const prefix = "yo karen "; // or "!", "-", "%"

// Setup Puppeteer + Cleverbot
let page;
debug && console.log("Starting");
puppeteer.launch().then((browser) => {
	browser.newPage().then((thePage) => {
		page = thePage;
		page.goto("https://www.cleverbot.com/").then(() => {
			debug && console.log("Page loaded");
			console.log("Setup complete");
		});
	});
});

// Ask Cleverbot Function
function askCleverBot(request) {
	async function askCleverBotHelper(request, callback) {
		// Send over a message
		debug && console.log("Sending message");
		await page.evaluate((request) => {
			document.querySelector(".stimulus").value = request;
			cleverbot.sendAI(); // a form submit event triggers this API call
		}, request); // bind request variable into evaluate function

		// Wait for response
		debug && console.log("Awaiting response");
		await page.waitForSelector("#snipTextIcon"); // #snipTextIcon is added to DOM when the bot finishes speaking

		// Parse response
		const response = await page.evaluate(() => {
			return document.querySelector("#line1 .bot").textContent; // the bot always says its last message in #line1
		});
		debug && console.log(response);
		callback(response);
	}

	return new Promise((resolve) => {
		askCleverBotHelper(request, (response) => {
			resolve(response);
		});
	});
}

// Discord Code
// ----------
client.on("message", (message) => {
	if (message.author.bot) return;
	if (!message.content.startsWith(prefix)) return;

	// Parse Command and Arguments
	const args = message.content.slice(prefix.length).split(" ");
	// const command = args.shift().toLowerCase();

	// Collect answer from Cleverbot, then pass back to Discord
	askCleverBot(args).then((answer) => {
		message.reply(answer);
	});
});

client.login(process.env.BOT_TOKEN).catch((err) => {
	console.log(err);
});
// ----------

/*
 * Resources
 * https://github.com/puppeteer/puppeteer
 * https://gist.github.com/LeCoupa/e8b9aac95d0d7acbde740c91c4bcc178
 * https://www.digitalocean.com/community/tutorials/how-to-build-a-discord-bot-with-node-js
 */
