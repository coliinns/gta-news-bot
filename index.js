const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const Parser = require('rss-parser');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const parser = new Parser();
let last = "";

client.once('ready', () => {
  console.log(`✅ Bot online: ${client.user.tag}`);
  check();
  setInterval(check, 5 * 60 * 1000);
});

async function check() {
  try {
    const feed = await parser.parseURL('https://www.rockstargames.com/newswire.xml');
    const item = feed.items.find(x => x.title.toLowerCase().includes("gta online"));
    if (!item || item.link === last) return;
    last = item.link;
    const res = await fetch(item.link);
    const html = await res.text();
    const $ = cheerio.load(html);
    const img = $("meta[property='og:image']").attr("content") || null;
    let raw = $(".article-content p").first().text().trim();
    if (!raw) raw = item.contentSnippet;
    const trans = await translate(raw, "pt");
    const embed = new EmbedBuilder()
      .setTitle(item.title)
      .setDescription(trans)
      .setURL(item.link)
      .setImage(img)
      .setFooter({ text: "Fonte: Rockstar Newswire" })
      .setColor(0xff0000)
      .setTimestamp();
    const ch = await client.channels.fetch(process.env.CHANNEL_ID);
    await ch.send({ embeds: [embed] });
  } catch (e) {
    console.error("Erro ao buscar ou enviar notícia:", e);
  }
}

async function translate(text, lang) {
  try {
    const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${lang}&dt=t&q=${encodeURIComponent(text)}`);
    const d = await res.json();
    return d[0].map(x=>x[0]).join("");
  } catch (e) {
    console.error("Erro tradução:", e);
    return text;
  }
}

client.login(process.env.DISCORD_TOKEN);
