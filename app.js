const { Bot } = require("./bot");
require("dotenv").config();

const bot = new Bot(process.env.DISC_AUTH_TOKEN);
bot.start();