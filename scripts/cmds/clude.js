const axios = require("axios");

module.exports.config = {
	name: "clude",
	version: "1.0",
	author: "Bayejid",
	countDown: 5,
	role: 0,
	shortDescription: {
		en: "Chat with AI (Groq)"
	},
	longDescription: {
		en: "Chat directly with an AI model using the Groq API"
	},
	category: "ai",
	guide: {
		en: "{pn} <your message>\nExample: {pn} tumi kemon acho?"
	}
};

// ==== CONFIG: set your Groq API key and model here ====
const GROQ_API_KEY = "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";
const GROQ_BASE_URL = "https://api.groq.com/openai/v1";
const GROQ_MODEL = "openai/gpt-oss-120b"; // change model if you want
// ========================================================

module.exports.onStart = async function ({ api, event, args, message }) {
	const prompt = args.join(" ").trim();

	if (!prompt) {
		return message.reply("❗ কিছু লিখে জিজ্ঞেস করো।\nউদাহরণ: clude tumi kemon acho?");
	}

	// let user know bot is thinking
	api.sendTypingIndicator(event.threadID);

	try {
		const response = await axios.post(
			`${GROQ_BASE_URL}/chat/completions`,
			{
				model: GROQ_MODEL,
				messages: [
					{ role: "user", content: prompt }
				],
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

		const reply = response.data?.choices?.[0]?.message?.content;

		if (!reply) {
			return message.reply("⚠️ AI থেকে কোনো উত্তর পাওয়া যায়নি।");
		}

		return message.reply(reply.trim());
	} catch (err) {
		console.log("Clude AI error:", err.response?.data || err.message);
		return message.reply(
			"❌ AI এর সাথে কথা বলতে সমস্যা হচ্ছে। API key বা মডেল নাম চেক করো।\n\nError: " +
				(err.response?.data?.error?.message || err.message)
		);
	}
};
