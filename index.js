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

      console.log("✅ Notícia enviada:", title);
      break; // só envia uma
    }
  } catch (err) {
    console.error("🚨 Erro ao buscar ou enviar notícia:", err);
  }
}
