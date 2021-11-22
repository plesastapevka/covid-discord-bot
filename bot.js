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
      console.log("COVIDek up and running!");
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
      } else {
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
    console.log("Current intervals: " + this.intervals.length);
  };

  // Command: deactivate
  deactivate = async (channelId) => {
    const interval = this.intervals.find(
      (interval) => interval.channelId === channelId
    );
    clearInterval(interval.interval);
    this.intervals = this.intervals.filter(
      (interval) => interval.channelId !== channelId
    );
    console.log("Current intervals: " + this.intervals.length);
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
    const element = covidData.slice(-1)[0];
    const todayFromData = new Date(
      `${element.year}-${element.month}-${element.day}`
    ).toLocaleDateString("en-US");
    console.log(todayFromData);
    if (covidData.length !== 7 || interval.lastUpdate === today) {
      console.log("Skipping update");
      return;
    }
    let msgEmbed = new MessageEmbed()
      .setColor("#0099ff")
      .setTitle("Rezultati COVID bolezni")
      .setDescription("Število okužb za določene dni")
      .setTimestamp()
      .setFooter("COVIDek");
    await covidData.forEach((day) => {
      let date = new Date(`${day.month}.${day.day}.${day.year}`);
      let weekday = date.toLocaleDateString("sl-SI", { weekday: "long" });
      weekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
      date = date.toLocaleDateString("sl-SI");
      let value =
        "Opravljeni testi: " +
        day.total.performed.today +
        "\n" +
        "Pozitivni: " +
        day.total.positive.today +
        "\n" +
        "Delež pozitivnih: " +
        ((day.total.positive.today / day.total.performed.today) * 100).toFixed(
          2
        ) +
        "%";
      msgEmbed.addField(weekday + ", " + date, value, true);
    });
    this.sendMessage(msgEmbed, channelId);
    interval.lastUpdate = today;
  };
}

module.exports = { Bot };
