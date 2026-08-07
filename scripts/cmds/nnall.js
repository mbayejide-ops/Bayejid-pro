module.exports = {
  config: {
    name: "nnall",
    version: "1.0",
    author: "Bayejid",
    countDown: 10,
    role: 2, // 0 = সবাই, 1 = group admin, 2 = শুধু bot admin ব্যবহার করতে পারবে
    shortDescription: "সবার nickname পরিবর্তন",
    longDescription: "গ্রুপের সবার nickname একসাথে পরিবর্তন করে দেয়",
    category: "admin",
    guide: "{pn} <nickname>\nউদাহরণ: nnall Hi"
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID, senderID } = event;

    // শুধু bot admin চেক (extra safety, role:2 এমনিতেই এটা করে)
    const config = require("../../config.json") || {};
    const adminBot = (global.GoatBot && global.GoatBot.config && global.GoatBot.config.adminBot) || [];
    if (adminBot.length > 0 && !adminBot.includes(senderID)) {
      return api.sendMessage("❌ এই কমান্ড শুধু Bot Admin ব্যবহার করতে পারবে।", threadID, messageID);
    }

    const nickname = args.join(" ");
    if (!nickname) {
      return api.sendMessage(
        "⚠️ Nickname দিতে হবে।\nউদাহরণ: nnall Hi",
        threadID,
        messageID
      );
    }

    api.getThreadInfo(threadID, async (err, info) => {
      if (err || !info) {
        return api.sendMessage("❌ Thread info নিতে সমস্যা হয়েছে: " + err, threadID, messageID);
      }

      const members = info.userInfo.map(u => u.id);
      let success = 0;
      let fail = 0;

      api.sendMessage(
        `⏳ ${members.length} জন সদস্যের nickname পরিবর্তন করা শুরু হচ্ছে...`,
        threadID
      );

      for (let i = 0; i < members.length; i++) {
        const id = members[i];
        await new Promise(resolve => {
          api.changeNickname(nickname, threadID, id, (err) => {
            if (err) {
              fail++;
            } else {
              success++;
            }
            resolve();
          });
          // rate limit এড়ানোর জন্য delay
        });
        await new Promise(r => setTimeout(r, 1500));
      }

      api.sendMessage(
        `✅ Nickname পরিবর্তন সম্পন্ন হয়েছে!\n\n✔️ Success: ${success}\n❌ Fail: ${fail}`,
        threadID
      );
    });
  }
};
