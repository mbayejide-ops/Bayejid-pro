const axios = require("axios");

module.exports = {
  config: {
    name: "insta",
    aliases: ["ig", "instagram"],
    version: "1.0",
    author: "Bayejid",
    countDown: 5,
    role: 0,
    description: { en: "Send random Instagram video from link database" },
    category: "media",
    guide: { en: "{pn} → random video pathabe\n{pn} <number> → nirdishto number er video pathabe" }
  },

  onStart: async function ({ api, event, args }) {
    try {
      const res = await axios.get("https://raw.githubusercontent.com/mbayejide-ops/Video-database/main/instavideo.json");
      
      // GitHub raw content-type text/plain hoy, tai manual parse dorkar
      const jsonData = typeof res.data === "string" ? JSON.parse(res.data) : res.data;
      const videos = jsonData.videos;

      if (!videos || !videos.length) throw new Error("Video list khali ba format vul");

      let videoUrl;
      if (args[0] && !isNaN(args[0])) {
        const index = parseInt(args[0]) - 1;
        videoUrl = videos[index];
        if (!videoUrl) return api.sendMessage(`❌ Video number ${args[0]} khuje pawa jayni. Total: ${videos.length}`, event.threadID, event.messageID);
      } else {
        videoUrl = videos[Math.floor(Math.random() * videos.length)];
      }

      const videoStream = (await axios.get(videoUrl, { responseType: "stream" })).data;
      api.sendMessage({ attachment: videoStream }, event.threadID, event.messageID);
    } catch (err) {
      console.log(err);
      api.sendMessage("API ERROR⚠️", event.threadID, event.messageID);
    }
  }
};
