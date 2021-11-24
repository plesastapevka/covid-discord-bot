const { Api } = require("./api");
const { Client, MessageEmbed, ReactionUserManager } = require("discord.js");
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
      } else if (command === "update") {
        this.update(msg.channel.id);
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
      }, 1000),
    };
    this.intervals.push(interval);
    console.log("Current intervals: " + this.intervals.length);
  };

  // Command: deactivate
  deactivate = async (channelId) => {
    const interval = this.intervals.find(
      (interval) => interval.channelId === channelId
    );
    if (!interval) {
      console.log("Does not exist");
      return;
    }
    clearInterval(interval.interval);
    this.intervals = this.intervals.filter(
      (interval) => interval.channelId !== channelId
    );
    console.log("Current intervals: " + this.intervals.length);
  };

  // Command: update
  update = async (channelId) => {
    this.dailyUpdate(channelId);
  };

  // Send message to channel
  sendMessage = (msg, channelId) => {
    this.client.channels.cache.get(channelId).send(msg);
  };

  // Send data for yesterday
  update = async (channelId) => {
    const yesterday = new Date(
      new Date().getTime() - 1 * DAY
    ).toLocaleDateString("en-US");
    const covidData = await Api.getPositives(yesterday, yesterday);
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
      "Število opravljenih testov in pozitivnih"
    );
    let date = new Date(`${element.month}.${element.day}.${element.year}`);
    let weekday = date.toLocaleDateString("sl-SI", { weekday: "long" });
    weekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
    date = date.toLocaleDateString("sl-SI");
    let value =
      "Opravljeni testi: " +
      element.total.performed.today +
      "\n" +
      "Pozitivni: " +
      element.total.positive.today +
      "\n" +
      "Delež pozitivnih: " +
      (
        (element.total.positive.today / element.total.performed.today) *
        100
      ).toFixed(2) +
      "%";
    msgEmbed.addField(weekday + ", " + date, value, true);
    this.sendMessage(msgEmbed, channelId);
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
    if (covidData.length !== 7 || interval.lastUpdate === today) {
      return;
    }
    let msgEmbed = this.constructEmbed(
      "Rezultati COVID bolezni preteklih 7 dni",
      "Število okužb za določene dni"
    );
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
    console.log(`Last update for channel ${channelId}: ${today}`);
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
}

module.exports = { Bot };
