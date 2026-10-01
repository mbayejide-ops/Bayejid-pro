module.exports = {
  config: {
    name: "unf",
    version: "1.0",
    author: "Bayejid",
    countDown: 10,
    role: 0,
    shortDescription: { en: "Bot er sob friend unfriend kore" },
    longDescription: { en: "Bot account er friend list er sokolke unfriend kore" },
    category: "system",
    guide: { en: "{pn}" }
  },

  onStart: async function ({ api, event, message }) {
    const botID = api.getCurrentUserID();
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

    let friends;
    try {
      friends = await new Promise((resolve, reject) => {
        api.getFriendsList((err, data) => (err ? reject(err) : resolve(data)));
      });
    } catch (e) {
      return message.reply("❌ Friend list ante parlam na.");
    }

    friends = friends.filter((f) => f.userID !== botID);
    if (!friends.length) return message.reply("Friend list already khali.");

    await message.reply(`⏳ ${friends.length} jon ke unfriend kora shuru hocche...`);

    let done = 0, failed = 0;
    for (const f of friends) {
      try {
        await new Promise((resolve, reject) => {
          api.unfriend(f.userID, (err) => (err ? reject(err) : resolve()));
        });
        done++;
      } catch (e) {
        failed++;
      }
      await sleep(200); // rate limit / ban ragate delay
    }

    return message.reply(`✅ Sesh!\nUnfriend: ${done}\nFailed: ${failed}`);
  }
};
