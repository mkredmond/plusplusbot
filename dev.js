require('dotenv').config();

const Discord = require("discord.js");
const client = new Discord.Client();
const request = require('request');
const sql = require("sqlite");
sql.open("./databases/database_dev.sqlite");

client.on("ready", () => {
	console.log('Logged in Dev');
	sql.run("CREATE TABLE IF NOT EXISTS scores (userId INTEGER, username TEXT, channelId INTEGER, points INTEGER)").then(() =>{
		console.log('Completed running database setup.');
	}).catch((err) => {
		console.error('Error: ' + err);
	});
});

client.on("message", (message) => {
	if (message.channel.type === "dm") return; // Ignore DM channels.
	if (message.channel.bot) return; // Ignore bots.

	if (message.content.startsWith("!leaders")) {
		sql.all(`SELECT * FROM scores WHERE channelId = ${message.channel.id} ORDER BY points DESC`).then(rows => {
		    let leaderboard = 'User --- Points\n';

		    for (var i = 0, len = rows.length; i < len; i++) {
		    	console.log(`Row ${i}: ${rows[i]}`);
				leaderboard += `[${rows[i].points}] ${rows[i].username}\n`;
			}
			message.channel.send(leaderboard);
	  	}).catch((err) => {
		    console.error(err);
	  	});
	}

	/**
	 * Add a point to one or more users
	 * @param  Array of Discord Users
	 * @return Discord Reply
	 */
	// if (message.content.indexOf("++") > -1) {
	if (/<@(.*?)\>\s(\++)/.test(message.content)) {
		console.log(message.content);
		if (!message.mentions.users) return;

		message.mentions.users.forEach(function(user){
			if (message.author.id === user.id) {
				message.reply('You cannot give yourself points.');
				return;
			}

			sql.get(`SELECT * FROM scores WHERE userId ="${user.id}" AND channelId = "${message.channel.id}"`).then(row => {
				let flair = '';
			    if (!row) {
			      	sql.run("INSERT INTO scores (userId, username, channelId, points) VALUES (?, ?, ?, ?)", [user.id, user.username, message.channel.id, 1]);
			     	message.channel.send(`${user.username} has 1 point.`);
			    } else {
			     	sql.run(`UPDATE scores SET points = ${row.points + 1} WHERE userId = ${user.id} AND channelId = "${message.channel.id}"`);
			     	if (row.points + 1 == 69) { flair = "Grats on the sex."; }
			     	message.channel.send(`${user.username} has ${row.points + 1} points. ${flair}`);
			    }
		  	}).catch((err) => {
			    console.error(err);
		  	});
		});
	}
	/**
	 * Remove a point to one or more users
	 * @param  Array of Discord Users
	 * @return Discord Reply
	 */
	// if (message.content.indexOf("--") > -1) {
	if (/<@(.*?)\>\s(\--)/.test(message.content)) {
		if (!message.mentions.users) return;

		message.mentions.users.forEach(function(user){
			if (message.author.id === user.id) {
				message.reply('You cannot take points away from yourself.');
				return;
			}

			sql.get(`SELECT * FROM scores WHERE userId ="${user.id}" AND channelId = "${message.channel.id}"`).then(row => {
				let flair = '';
			    if (!row) {
			      	sql.run("INSERT INTO scores (userId, username, channelId, points) VALUES (?, ?, ?, ?)", [user.id, user.username, message.channel.id, 1]);
			     	message.channel.send(`${user.username} has 1 point.`);
			    } else {
			    	if (row.points - 1 == 69) { flair = "Grats on the sex."}

			     	sql.run(`UPDATE scores SET points = ${row.points - 1} WHERE userId = ${user.id} AND channelId = "${message.channel.id}"`);
			     	message.channel.send(`${user.username} has ${row.points - 1} points. ${flair}`);
			    }
		  	}).catch((err) => {
			    console.error(err);
		  	});
		});
	}

	// Bitcoin
	if (message.content.startsWith("!btc")) {
		request('https://api.coinbase.com/v2/prices/BTC-USD/spot', (error, response, body) => {
		  if (!error && response.statusCode === 200) {
		    const btc = JSON.parse(body);
		    const USD = btc.data.amount; // Set USD to the latest USD bitcoin price
		    message.reply(`the current Bitcoin market price is: $ ${USD} USD`).catch(console.error); // Send price to user that requested price
		  }
		});
	}

});

client.login(process.env.LOGIN_TOKEN);
