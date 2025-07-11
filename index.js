const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

let lastPostedLink = "";

client.once('ready', () => {
  console.log(`✅ Bot online: ${client.user.tag}`);
  checkNews();
  setInterval(checkNews, 5 * 60 * 1000); // verifica a cada 5 minutos
});

async function checkNews() {
  try {
    const res = await fetch("https://www.rockstargames.com/newswire");
    const html = await res.text();
    const $ = cheerio.load(html);

    // Seleciona as notícias listadas na página
    const newsItems = $(".NewswireList-item");

    for (let i = 0; i < newsItems.length; i++) {
      const el = newsItems.eq(i);

      const title = el.find(".NewswireList-title").text().trim();
      const linkPartial = el.find("a").attr("href");
      const link = "https://www.rockstargames.com" + linkPartial;

      // Filtra só notícias de GTA Online (case insensitive)
      if (!title.toLowerCase().includes("gta online")) continue;

      if (link === lastPostedLink) break; // já postamos essa notícia

      lastPostedLink = link;

      // Pega imagem da notícia
      const img = el.find("img").attr("src") || null;

      // Pega o resumo do texto da notícia
      const summary = el.find(".NewswireList-summary").text().trim();

      // Traduz o resumo para português
      const translated = await translateText(summary, "pt");

      // Cria embed e envia
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

      console.log("📰 Notícia postada:", title);
      break; // só posta a notícia mais recente por rodada
    }

  } catch (err) {
    console.error("Erro ao buscar ou enviar notícia:", err);
  }
}

async function translateText(text, targetLang = "pt") {
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    const data = await res.json();
    return data[0].map(x => x[0]).join("") || text;
  } catch {
    return text;
  }
}

client.login(process.env.DISCORD_TOKEN);
