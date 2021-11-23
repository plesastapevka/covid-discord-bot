# COVIDek - Discord bot based on COVID-19 Sledilnik API
*Versions:*
- *Node: 16*

All data is fetched via COVID-19 Sledilnik.
- [COVID-19 Sledilnik official website](https://covid-19.sledilnik.org/)
- [COVID-19 Sledilnik official GitHub](https://github.com/sledilnik)

---

## Add COVIDek to Server
You can add COVIDek to your server [here](https://discord.com/api/oauth2/authorize?client_id=910486812349308978&permissions=274877996032&scope=bot).

<br>

## Run COVIDek with Node.js
```
node app.js
```

<br>

## Run COVIDek in Docker
In project root, first build the image:

```
docker build -t covid-discord-bot .
```

Then run the built image:

```
docker run -d --restart=always --env-file /path/to/.env --name covid-discord-bot covid-discord-bot
```
<br>

## Environment file

`.env` file should look like this:
```
DISC_PUB_KEY=<your discord pub key>
DISC_APP_ID=<your discord app id>
DISC_AUTH_TOKEN=<your discord authorization token>
CLIENT_ID=<your client id>
```
On where to find these values, please refer to [Discord developer portal](https://discord.com/developers/docs/topics/oauth2).

<br>

## Usage
To execute a command, use prefix `!` and one of the below commandsin a channel where COVIDek is added.

### List of available commands:

- `!activate` - Activate COVIDek for current channel. COVIDek automatically checks for new data every 15 minutes and sends updates to activated channels everyday when the data gets updated.

- `!deactivate` - Deactivate COVIDek for current channel.

- `!update` - Get data for the last 7 days if available.