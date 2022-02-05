const { Api } = require("./api");
const { Client, MessageEmbed } = require("discord.js");
const DAY = 24 * 60 * 60 * 1000;
const MINUTE = 1000 * 60;

class Bot {
  // CONSTRUCTOR
  constructor(token) {
    this.prefix = "!";
    this.intervals = [];
    this.authToken = token;
    this.client = new Client();

    // EVENT LISTENERS
    // Event on ready
    this.client.on("ready", () => {
      console.info("COVIDek up and running!");
    });

    // Event on message
    this.client.on("message", async (msg) => {
      if (!msg.content.startsWith(this.prefix)) {
        return;
      }
      const args = msg.content.slice(this.prefix.length).trim().split(" ");
      const command = args.shift().toLowerCase();

      if (command === "activate") {
        this.activate(msg.channel.id);
      } else if (command === "deactivate") {
        this.deactivate(msg.channel.id);
      } else if (command === "update") {
        this.update(msg.channel.id);
      } else if (command === "help") {
        this.help(msg.channel.id);
      }
    });
  }

  // Start bot
  start = () => {
    this.client.login(process.env.DISC_AUTH_TOKEN);
  };

  // METHODS
  // Command: activate
  activate = async (channelId) => {
    if (this.intervals.some((interval) => interval.channelId === channelId)) {
      let msgEmbed = this.constructEmbed(
        "Obvestila že aktivirana",
        "Ta kanal že ima aktivna obvestila."
      );
      this.sendMessage(msgEmbed, channelId);
      return;
    }
    const interval = {
      channelId,
      lastUpdate: 0,
      interval: setInterval(() => {
        this.dailyUpdate(channelId);
        }, 15 * MINUTE),
    };
    this.intervals.push(interval);
    console.info("Current intervals: " + this.intervals.length);
    let msgEmbed = this.constructEmbed(
      "Obvestila aktivirana",
      "Ta kanal je aktiviran za prejemanje dnevnih obvestil."
    );
    this.sendMessage(msgEmbed, channelId);
  };

  // Command: deactivate
  deactivate = async (channelId) => {
    const interval = this.intervals.find(
      (interval) => interval.channelId === channelId
    );
    if (!interval) {
      let msgEmbed = this.constructEmbed(
        "Obvestila niso aktivirana",
        "Ta kanal nima aktivnih obvestil."
      );
      this.sendMessage(msgEmbed, channelId);
      return;
    }
    clearInterval(interval.interval);
    this.intervals = this.intervals.filter(
      (interval) => interval.channelId !== channelId
    );
    let msgEmbed = this.constructEmbed(
      "Obvestila deaktivirana",
      "Ta kanal ne bo več prejemal dnevnih obvestil."
    );
    this.sendMessage(msgEmbed, channelId);
    console.info("Current intervals: " + this.intervals.length);
  };

  // Send data for yesterday
  update = async (channelId) => {
    const yesterday = new Date(
      new Date().getTime() - 1 * DAY
    ).toLocaleDateString("en-US");
    const covidData = await Api.getPositives(yesterday, yesterday);
    if (covidData === null) {
      return;
    }
    if (covidData.length === 0) {
      let msgEmbed = this.constructEmbed(
        "Ni na voljo",
        "Podatki za včerajšnji dan še niso na voljo"
      );
      this.sendMessage(msgEmbed, channelId);
      return;
    }
    const element = covidData.slice(-1)[0];
    let msgEmbed = this.constructEmbed(
      "Rezultati COVID bolezni včeraj",
      "Število opravljenih in pozitivnih testov"
    );
    let date = new Date(`${element.month}.${element.day}.${element.year}`);
    let weekday = date.toLocaleDateString("sl-SI", { weekday: "long" });
    weekday = weekday.toUpperCase();
    date = date.toLocaleDateString("sl-SI");
    let value = this.constructDailyValue(element.data);
    if (value === null) {
      return;
    }
    msgEmbed.addField(weekday + ", " + date, value, true);
    this.sendMessage(msgEmbed, channelId);
  };

  // Send data for yesterday
  help = async (channelId) => {
    let msgEmbed = this.constructEmbed("Pomoč", "");
    msgEmbed.addField(
      "!activate",
      "Aktivira dnevna obvestila za trenutni kanal",
      true
    );
    msgEmbed.addField(
      "!deactivate",
      "Ustavi dnevna obvestila za trenutni kanal",
      true
    );
    msgEmbed.addField("!update", "Podatki za prejšnji dan", true);
    msgEmbed.addField("!help", "To sporočilo", true);
    this.sendMessage(msgEmbed, channelId);
  };

  // Send message to channel
  sendMessage = (msg, channelId) => {
    this.client.channels.cache.get(channelId).send(msg);
  };

  // Daily update when yesterday's data is available
  dailyUpdate = async (channelId) => {
    let interval = this.intervals.find(
      (interval) => interval.channelId === channelId
    );
    const from = new Date(new Date().getTime() - 7 * DAY).toLocaleDateString(
      "en-US"
    );
    const today = new Date().toLocaleDateString("en-US");
    const covidData = await Api.getPositives(from, today);
    if (covidData === null) {
      return;
    }
    if (covidData.length !== 7 || interval.lastUpdate === today) {
      return;
    }
    let msgEmbed = this.constructEmbed(
      "Rezultati COVID bolezni pretekle dni",
      "Število okužb preteklih dni. Prikazani so dnevi, ki imajo vnešene podatke, največ 7 dni nazaj"
    );
    await covidData.forEach((day) => {
      let date = new Date(`${day.month}.${day.day}.${day.year}`);
      let weekday = date.toLocaleDateString("sl-SI", { weekday: "long" });
      weekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
      date = date.toLocaleDateString("sl-SI");
      let value = this.constructDailyValue(day.data);
      if (value === null) {
        return;
      }
      msgEmbed.addField(weekday + ", " + date, value, true);
    });
    this.sendMessage(msgEmbed, channelId);
    interval.lastUpdate = today;
    console.info(`Last update for channel ${channelId}: ${today}`);
  };

  // Construct Message Embed for updates
  constructEmbed = (title, desc) => {
    let msgEmbed = new MessageEmbed()
      .setColor("#0099ff")
      .setTitle(title)
      .setDescription(desc)
      .setTimestamp()
      .setFooter("COVIDek");
    return msgEmbed;
  };

  // Construct value field for message embed
  constructDailyValue = (element) => {
    const regularPerformed = element.regular.performed.today;
    const regularPositive = element.regular.positive.today;
    const hagtPerformed = element.hagt.performed.today;
    const hagtPositive = element.hagt.positive.today;
    if (
      isNaN(regularPerformed) ||
      regularPerformed === null ||
      isNaN(regularPositive) ||
      regularPositive === null ||
      isNaN(hagtPerformed) ||
      hagtPerformed === null ||
      isNaN(hagtPositive) ||
      hagtPositive === null
    ) {
      return null;
    }
    return (
      "PCR\n" +
      "Opravljeni: " +
      element.regular.performed.today +
      "\n" +
      "Pozitivni: " +
      element.regular.positive.today +
      "\n" +
      "Delež pozitivnih: " +
      (
        (element.regular.positive.today / element.regular.performed.today) *
        100
      ).toFixed(2) +
      "%\n\n" +
      "HAGT\n" +
      "Opravljeni: " +
      element.hagt.performed.today +
      "\n" +
      "Pozitivni: " +
      element.hagt.positive.today +
      "\n" +
      "Delež pozitivnih: " +
      (
        (element.hagt.positive.today / element.hagt.performed.today) *
        100
      ).toFixed(2) +
      "%\n\n" +
      "SKUPAJ\n" +
      "Opravljeni: " +
      (element.regular.performed.today + element.hagt.performed.today) +
      "\n" +
      "Pozitivni: " +
      (element.regular.positive.today + element.hagt.positive.today) +
      "\n" +
      "Delež pozitivnih: " +
      (
        ((element.hagt.positive.today + element.regular.positive.today) /
          (element.hagt.performed.today + element.regular.performed.today)) *
        100
      ).toFixed(2) +
      "%"
    );
  };
}

module.exports = { Bot };
