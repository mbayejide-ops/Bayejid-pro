module.exports.config = {
	name: "manpower",
	aliases: ["mp"],
	version: "1.0",
	author: "Bayejid",
	countDown: 5,
	role: 2,
	shortDescription: "Send scheduled messages to a group chat",
	longDescription: "List all group chats, pick one, then send multiple messages one by one every 10 seconds",
	category: "utility",
	guide: "{pn}: reply with the gc number, then write your messages like this:\n1 m1 Hi m2 kemon acho? m3 ki koro"
};

module.exports.onStart = async function ({ api, event, message }) {
	const threadList = await api.getThreadList(100, null, ["INBOX"]);
	const groups = threadList.filter(t => t.isGroup);

	if (groups.length === 0) {
		return message.reply("Kono group chat pawa jai nai.");
	}

	let msg = "";
	groups.forEach((g, i) => {
		msg += `${i + 1}. ${g.threadName || g.name || "Unnamed Group"}\n`;
	});
	msg += "\nReply to send message to group chat";

	const sent = await message.reply(msg);

	global.GoatBot.onReply.set(sent.messageID, {
		commandName: this.config.name,
		author: event.senderID,
		groups: groups
	});
};

module.exports.onReply = async function ({ api, event, Reply, message }) {
	if (event.senderID !== Reply.author) return;

	const body = event.body ? event.body.trim() : "";
	const match = body.match(/^(\d+)\s+([\s\S]+)$/);

	if (!match) {
		return message.reply("Format vul. Example: 1 m1 Hi m2 kemon acho? m3 ki koro");
	}

	const gcIndex = parseInt(match[1]) - 1;
	const rest = match[2];
	const group = Reply.groups[gcIndex];

	if (!group) {
		return message.reply("Vul gc number, abar try korun.");
	}

	const regex = /m\d+\s*([\s\S]*?)(?=m\d+\s|$)/g;
	let msgs = [];
	let m;
	while ((m = regex.exec(rest)) !== null) {
		const text = m[1].trim();
		if (text) msgs.push(text);
	}

	if (msgs.length === 0) {
		return message.reply("Kono message pawa jai nai. Format: m1 <text> m2 <text>");
	}

	message.reply(`${msgs.length}টি message "${group.threadName || "Unnamed Group"}" এ পাঠানো হবে, প্রতিটার মাঝে ১০ সেকেন্ড গ্যাপ থাকবে।`);

	let i = 0;
	const sendNext = () => {
		if (i >= msgs.length) return;
		api.sendMessage(msgs[i], group.threadID);
		i++;
		if (i < msgs.length) setTimeout(sendNext, 10000);
	};
	sendNext();
};
