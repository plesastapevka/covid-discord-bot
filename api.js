const fetch = require("node-fetch");
const { URLSearchParams } = require("url");

class Api {
  static URL = "https://api.sledilnik.org/api/lab-tests?";
  constructor() {}

  // GET tests from Date to Date
  static getPositives = async (from, to) => {
    const params = new URLSearchParams({ from, to });
    try {
      let result = await fetch(this.URL + params);
      let json = await result.json();
      return json;
    } catch (e) {
      console.error(e);
      return null;
    }
  };
}

module.exports = { Api };
