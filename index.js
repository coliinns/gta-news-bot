const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
require('dotenv').config();

if (!process.env.DISCORD_TOKEN || !process.env.CHANNEL_ID) {
  console.error("❌ Variáveis de ambiente não definidas! Verifique DISCORD_TOKEN e CHANNEL_ID.");
  process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', () => {
  console.log(`✅ Bot online: ${client.user.tag}`);
  checkNews();
  setInterval(checkNews, 5 * 60 * 1000); // a cada 5 min
});

async function checkNews() {
  try {
    console.log("🔍 Buscando notícias...");

    const res = await fetch("https://www.rockstargames.com/newswire");
    const html = await res.text();
    const $ = cheerio.load(html);

    const newsItems = $(".NewswireList-item");
    console.log(`🧾 Total de notícias encontradas: ${newsItems.length}`);

    for (let i = 0; i < newsItems.length; i++) {
      const el = newsItems.eq(i);

      const title = el.find(".NewswireList-title").text().trim();
      const linkPartial = el.find("a").attr("href");
      const link = "https://www.rockstargames.com" + linkPartial;

      console.log(`➡️ Verificando notícia: ${title}`);

      if (!title.toLowerCase().includes("gta online")) continue;

      const img = el.find("img").attr("src") || null;
      const summary = el.find(".NewswireList-summary").text().trim();
      const translated = await translateText(summary, "pt");

      const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(translated)
        .setURL(link)
        .setImage(img)
        .setFooter({ text: "Fonte: Rockstar Newswire" })
        .setColor(0xff0000)
        .setTimestamp();

      const channel = await client.channels.fetch(process.env.CHANNEL_ID);
      await channel.send({ embeds: [embed] });

      console.log("✅ Notícia postada:", title);
      break;
    }

  } catch (err) {
    console.error("🚨 Erro ao buscar ou enviar notícia:", err);
  }
}

async function translateText(text, targetLang = "pt") {
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    const data = await res.json();
    return data[0].map(x => x[0]).join("") || text;
  } catch (err) {
    console.error("⚠️ Erro na tradução:", err);
    return text;
  }
}

client.login(process.env.DISCORD_TOKEN);
