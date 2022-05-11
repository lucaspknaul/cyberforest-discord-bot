# Description

As NFT projects main media is Discord and they usually operate with spam bots, it would be a huge advantage if CyberForest didn't have one, so this bot was created.

# Working

Discord API bots (traditional Discord bots) are not able to enter channels, they need to be invited, so we are using what people call a "selfbot". It's a bot that emulates a normal user.

This bot uses Puppeteer, an automated test technology to open a controllable browser and navigate Discord web.

The person executing it logs in using the bot account, joins some discord servers, then fills the configuration file with the bot login and password along with a message, server names and groups within that server.

The bot when executed enters the servers and sends the specified message to the users in those groups.

# Architecture

This project doesn't have too much of an architecture.

Due to being a simple project that will need to be changed frequently, it was written as a simple scrip in nodejs.

Nodejs was chosen due to its simplicity which makes it easy to write scripts.

Python was also considered for the above reason, but most of the team didn't know Python, so we chose Node.

# Current State

Due to using the web front-end in a very delicate way, any changes in Discord UI break this bot.

Currently, it is not working and needs to be fixed.

# Execution

Enter configurations on `config.yaml` file

run `npm install`

run `node bot.js`

