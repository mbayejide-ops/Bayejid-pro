const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
	name: "clude",
	version: "3.0",
	author: "Bayejid",
	countDown: 5,
	role: 0,
	shortDescription: {
		en: "Chat & generate images with AI"
	},
	longDescription: {
		en: "Chat with an AI (Groq) or generate images from text — auto-detects which one you want."
	},
	category: "ai",
	guide: {
		en: "{pn} <your message>  — normal chat\n{pn} draw/imagine/ছবি বানাও <description>  — generates an image\nReply to the bot's message to continue chatting."
	}
};

// ==== CONFIG ====
// Better practice: process.env.GROQ_API_KEY (set it in Render's environment variables)
const GROQ_API_KEY = "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";
const GROQ_BASE_URL = "https://api.groq.com/openai/v1";
const GROQ_MODEL = "openai/gpt-oss-120b";
// =================

const SYSTEM_PROMPT = "You are a helpful, friendly AI assistant chatting inside a Facebook Messenger bot. Keep replies natural and conversational.";

// keywords that signal "the user wants an image, not a chat reply"
const IMAGE_TRIGGERS = [
	"draw", "generate image", "create image", "make image", "make an image",
	"generate a picture", "create a picture", "make a picture", "picture of",
	"image of", "photo of", "imagine ", "art of", "paint",
	"ছবি বানাও", "ছবি তৈরি", "ছবি আঁকো", "ছবি দাও", "একটা ছবি", "চিত্র বানাও", "আঁকো"
];

function isImageRequest(text) {
	const lower = text.toLowerCase();
	return IMAGE_TRIGGERS.some(trigger => lower.includes(trigger));
}

async function callGroq(messages) {
	const response = await axios.post(
		`${GROQ_BASE_URL}/chat/completions`,
		{
			model: GROQ_MODEL,
			messages,
			temperature: 0.7,
			max_tokens: 1024
		},
		{
			headers: {
				"Authorization": `Bearer ${GROQ_API_KEY}`,
				"Content-Type": "application/json"
			}
		}
	);
	return response.data?.choices?.[0]?.message?.content;
}

async function generateAndSendImage({ message, prompt }) {
	await message.reply("🎨 ছবি বানানো হচ্ছে, একটু অপেক্ষা করো...");

	const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true`;
	const cacheDir = path.join(__dirname, "cache");
	await fs.ensureDir(cacheDir);
	const filePath = path.join(cacheDir, `imagine_${Date.now()}.png`);

	try {
		const response = await axios.get(imageUrl, {
			responseType: "arraybuffer",
			timeout: 60000
		});

		await fs.writeFile(filePath, response.data);

		await message.reply({
			body: `🖼️ Prompt: ${prompt}`,
			attachment: fs.createReadStream(filePath)
		});

		fs.unlink(filePath, () => {});
	} catch (err) {
		console.log("Imagine error:", err.response?.data || err.message);
		message.reply("❌ ছবি বানাতে সমস্যা হয়েছে।\n\nError: " + (err.message || "unknown"));
		fs.unlink(filePath, () => {});
	}
}

async function chatAndSend({ event, message, history, that }) {
	try {
		const reply = await callGroq(history);

		if (!reply) {
			return message.reply("⚠️ AI থেকে কোনো উত্তর পাওয়া যায়নি।");
		}

		history.push({ role: "assistant", content: reply });

		return message.reply(reply.trim(), (err, info) => {
			if (err || !info) return;
			global.GoatBot.onReply.set(info.messageID, {
				commandName: that.config.name,
				messageID: info.messageID,
				author: event.senderID,
				history
			});
		});
	} catch (err) {
		console.log("Clude AI error:", err.response?.data || err.message);
		return message.reply(
			"❌ AI এর সাথে কথা বলতে সমস্যা হচ্ছে। API key বা মডেল নাম চেক করো।\n\nError: " +
				(err.response?.data?.error?.message || err.message)
		);
	}
}

module.exports.onStart = async function ({ api, event, args, message }) {
	const prompt = args.join(" ").trim();

	if (!prompt) {
		return message.reply("❗ কিছু লিখে জিজ্ঞেস করো অথবা ছবি বানাতে বলো।\nউদাহরণ: clude tumi kemon acho?\nclude draw a cat riding a motorcycle");
	}

	api.sendTypingIndicator(event.threadID);

	if (isImageRequest(prompt)) {
		return generateAndSendImage({ message, prompt });
	}

	const history = [
		{ role: "system", content: SYSTEM_PROMPT },
		{ role: "user", content: prompt }
	];

	return chatAndSend({ event, message, history, that: this });
};

module.exports.onReply = async function ({ api, event, Reply, message }) {
	if (event.senderID !== Reply.author) return;

	const userText = event.body?.trim();
	if (!userText) return;

	api.sendTypingIndicator(event.threadID);

	if (isImageRequest(userText)) {
		return generateAndSendImage({ message, prompt: userText });
	}

	const history = Reply.history;
	history.push({ role: "user", content: userText });

	return chatAndSend({ event, message, history, that: this });
};
