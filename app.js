require("dotenv").config();
const {Client, MessageEmbed} = require("discord.js");
const fetch = require("node-fetch");
const { URLSearchParams } = require("url");

const bot = new Client();
const prefix = "!";
let intervals = [];

const DAY = 24*60*60*1000;

const getTests = async () => {
    const from = new Date(new Date().getTime() - 7 * DAY).toLocaleDateString("en-US");
    const to = new Date().toLocaleDateString("en-US");
    const params = new URLSearchParams({ from, to });
    let result = await fetch("https://api.sledilnik.org/api/lab-tests?" + params);
    let json = await result.json()
    return json
  }

bot.on("ready", () => {
  console.log("COVID19 up and running!");
});

bot.on("message", async (msg) => {
  if (!msg.content.startsWith(prefix)) {
    return;
  }
  const args = msg.content.slice(prefix.length).trim().split(" ");
  const command = args.shift().toLowerCase();
  console.log("Got command: ", command);

  if (command === "activate") {
    const covidData = await getTests();
    let msgEmbed = new MessageEmbed()
    .setColor('#0099ff')
	.setTitle('Rezultati COVID bolezni')
	.setDescription('Število okužb za določene dni')
	.setTimestamp()
	.setFooter('COVID19 Bot');
    await covidData.forEach(day => {
        let date = new Date(`${day.month}.${day.day}.${day.year}`);
        let weekday = date.toLocaleDateString("sl-SI", { weekday: 'long' });
        weekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
        date = date.toLocaleDateString("sl-SI");
        let value = "Opravljeni testi: " + day.total.performed.today + "\n" +
                    "Pozitivni: " + day.total.positive.today + "\n" +
                    "Delež pozitivnih: " + (((day.total.positive.today / day.total.performed.today) * 100).toFixed(2)) + "%";
        msgEmbed.addField(weekday + ", " + date, value, true);
    });
    bot.channels.cache.get(msg.channel.id).send(msgEmbed);
  }
});

bot.login(process.env.DISC_AUTH_TOKEN);
