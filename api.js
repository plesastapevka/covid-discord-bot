const fetch = require("node-fetch");
const { URLSearchParams } = require("url");


class Api {
    static URL = "https://api.sledilnik.org/api/lab-tests?";
    constructor() {}

    // GET tests from Date to Date
    static getPositives = async (from, to) => {
        const params = new URLSearchParams({ from, to });
        let result = await fetch(this.URL + params);
        let json = await result.json();
        return json;
      };
}

module.exports = { Api };

