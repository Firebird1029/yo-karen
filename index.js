const Discord = require("discord.js"),
	axios = require("axios"),
	puppeteer = require("puppeteer"),
	he = require("he");
const client = new Discord.Client();

// Config
if (!process.env.BOT_TOKEN) {
	// assert environment keys are loaded
	console.log("ERROR: Environment keys not found.");
	process.exit();
}
const debug = process.env.NODE_ENV !== "production";
const prefix = "yo karen "; // or "!", "-", "%"

// Setup Puppeteer + Cleverbot
let page;
debug && console.log("Starting");
puppeteer
	.launch({
		args: ["--no-sandbox", "--disable-setuid-sandbox"]
	})
	.then((browser) => {
		browser.newPage().then((thePage) => {
			page = thePage;
			page.goto("https://www.cleverbot.com/").then(() => {
				debug && console.log("Page loaded");
				console.log("Setup complete");
			});
		});
	});

// Ask WolframAlpha Function
// Warning: Free API only has 2,000 calls/month
function askWolfram(request, simple = false) {
	return new Promise((resolve, reject) => {
		axios
			.get("http://api.wolframalpha.com/v2/query", {
				params: {
					appid: process.env.WOLFRAM_APPID,
					includepodid: "Result", // we only want the Result pod
					input: request
				}
			})
			.then(function ({ data }) {
				debug && console.log(data);
				if (data.indexOf("<plaintext>") >= 0) {
					// WolframAlpha has an answer
					// only collect the answer itself, which is stored inside <plaintext></plaintext>
					// if there is no <plaintext></plaintext>, Wolfram doesn't have a direct answer
					const startIndex = data.indexOf("<plaintext>") + "<plaintext>".length;
					const endIndex = data.indexOf("</plaintext>");
					let response = data.substring(startIndex, endIndex);

					// Remove Excess Text
					response = response.replace(/Wolfram/gi, "");
					if (response.indexOf("\n(") >= 0) {
						response = response.substring(0, response.indexOf("\n("));
					}
					resolve({ status: "success", response: he.decode(response) });
				} else {
					// WolframAlpha doesn't know
					resolve({ status: "fail", response: null });
				}
			})
			.catch(function (error) {
				console.log("Wolfram API Error", error);
				reject();
			});
	});
}

// Ask Cleverbot Function
function askCleverBot(request) {
	async function askCleverBotHelper(request, callback) {
		// Send over a message
		debug && console.log("Sending message");
		await page.evaluate((request) => {
			document.querySelector(".stimulus").value = request;
			cleverbot.sendAI(); // a form submit event triggers this API call on the page
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
	if (!message.content.toLowerCase().startsWith(prefix)) return;

	// Parse Command and Arguments
	const args = message.content.slice(prefix.length);
	// const args = message.content.slice(prefix.length).split(" ");
	// const command = args.shift().toLowerCase();

	// Ask Wolfram first, if it doesn't know, ask Cleverbot as a conversation
	askWolfram(args)
		.then(({ status, response }) => {
			if (status === "success") {
				message.reply(response);
			} else {
				// Collect answer from Cleverbot, then pass back to Discord
				askCleverBot(args).then((answer) => {
					message.reply(answer);
				});
			}
		})
		.catch(() => {
			message.reply("Oops! Something went wrong.");
		});
});

client.login(process.env.BOT_TOKEN).catch((err) => {
	console.log(err);
});
// ----------

/*
 * Resources
 * https://github.com/discordjs/discord.js
 * https://discordjs.guide/
 * https://products.wolframalpha.com/api/documentation/
 * https://products.wolframalpha.com/simple-api/documentation/
 * https://www.cleverbot.com/
 * https://github.com/puppeteer/puppeteer
 * https://gist.github.com/LeCoupa/e8b9aac95d0d7acbde740c91c4bcc178
 * https://www.digitalocean.com/community/tutorials/how-to-build-a-discord-bot-with-node-js
 * https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md#running-puppeteer-on-heroku
 * https://stackoverflow.com/questions/52225461/puppeteer-unable-to-run-on-heroku
 * https://github.com/dokku/dokku/blob/master/docs/deployment/methods/buildpacks.md
 * https://github.com/gliderlabs/herokuish/issues/321
 * https://www.digitalocean.com/docs/droplets/how-to/add-ssh-keys/to-existing-droplet/
 * https://www.digitalocean.com/community/questions/dokku-add-new-ssh-key
 * https://stackoverflow.com/questions/7394748/whats-the-right-way-to-decode-a-string-that-has-special-html-entities-in-it
 */
