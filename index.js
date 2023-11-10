const qrcode = require('qrcode-terminal');
const axios = require('axios');
const mime = require('mime-types');
const fs = require('fs-extra');
const {
    Client,
    LocalAuth,
    MessageMedia
} = require('whatsapp-web.js');

const client = new Client({
    authStrategy: new LocalAuth()
});

client.on('qr', qr => {
    qrcode.generate(qr, {
        small: true
    });
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('message', message => {
    if (message.body === '!ping') {
        message.reply('pong');
    }
});
client.on('message', async message => {
    if (message.body === '!tagall') {
        const chat = await message.getChat();
        const participants = await chat.participants;
        let mentionString = '';
        participants.forEach(participant => {
            mentionString += `@${participant.id.user} `;
        });
        chat.sendMessage(mentionString);
    }
});




client.on('message', async message => {
    const content = message.body;
    if (content === '!meme') {
        const meme = await axios("https://meme-api.com/gimme")
        .then(res => res.data);
        client.sendMessage(message.from, await MessageMedia.fromUrl(meme.url));
    } else if (content === '!joke') {
        const joke = await axios("https://v2.jokeapi.dev/joke/Any?blacklistFlags=nsfw,religious,political,racist,sexist,explicit")
        .then(res => res.data);
        const jokMsg = await client.sendMessage(message.from, joke.setup || joke.joke);
        if (joke.delivery) setTimeout(function() {
            jokMsg.reply(joke.delivery)}, 5000);
    } else if (content === '!wiki') {
        const wiki = await axios("https://en.wikipedia.org/w/api.php?action=query&list=random&rnnamespace=0&rnlimit=1&format=json")
        .then(res => res.data);
        client.sendMessage(message.from, wiki.query.random[0].title, wiki.query.random[0].url);
    } else if (content === '!weather') {
        const weather = await axios("https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&current_weather=true&hourly=temperature_2m,relativehumidity_2m,windspeed_10m")
        .then(res => res.data);
        client.sendMessage(message.from, `Current weather in ${weather.name}: ${weather.weather[0].description}, ${weather.main.temp}°C`);
    } else if (content === '!translate') {
        const translation = await axios("https://libretranslate.de/translate", {
            method: 'POST',
            data: {
                q: 'Hello, world!',
                source: 'en',
                target: 'ar'
            }
        }).then(res => res.data);
        client.sendMessage(message.from, `Translation: ${translation.translatedText}`);
    } else if (message.hasMedia && message.type === 'image') {
        message.downloadMedia().then(async media=> {
            if (media) {
                const mediaPath = './downloaded-media';
                if (!fs.existsSync(mediaPath)) {
                    fs.mkdirSync(mediaPath);
                }
                const extenion = mime.extension(media.mimetype);
                const fileName = new Date().getTime();
                const fullFileName = mediaPath + fileName + "." + extenion;
                try {

                    fs.writeFileSync(fullFileName, media.data, {
                        encoding: 'base64'
                    });
                    console.log('File downloaded to', fullFileName);
                    console.log('File name', fileName);
                    const mediaMessage = await MessageMedia.fromFilePath(fullFileName);
                    client.sendMessage(message.from, mediaMessage, {
                        sendMediaAsSticker: true, stickerAuthor: "Created by Bot", stickerName: "DJMO-ALhimyari"
                    });

                } catch(err) {
                    console.log('Error downloading file', err);
                    console.log('File deleted');
                }

            }
        })
    } else if (content === '!help') {
        client.sendMessage(message.from,
            `🤖 *Bot Commands*
            - !meme: Send a random meme.
            - !joke: Send a random joke.
            - !wiki: Send a random Wikipedia article.
            - !help: Show this menu.`, {
                parse_mode: 'Markdown'
            });
    }
});

client.on('message', async message => {
    if (message.body.startsWith('!add ')) {
        // Extract the phone number of the person to be added from the message body
        const phoneNumber = message.body.slice(5) + '@c.us';

        // Add the participant to the group
        const chat = await message.getChat();
        await chat.addParticipants([phoneNumber]);

        // Send a confirmation message to the user
        message.reply(`Successfully added ${phoneNumber} to the group!`);
    }
});

client.initialize();