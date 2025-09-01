const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const http = require('http');

// Create a new client instance
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

// Load sentences from JSON files
let whatIfSentences = [];
let choicesSentences = [];

try {
    const sentencesData = JSON.parse(fs.readFileSync(path.join(__dirname, 'sentences.json'), 'utf8'));
    whatIfSentences = sentencesData.sentences;
    console.log(`✅ Loaded ${whatIfSentences.length} "ماذا لو" sentences`);
} catch (error) {
    console.error('❌ Error loading "ماذا لو" sentences:', error);
    process.exit(1);
}

try {
    const choicesData = JSON.parse(fs.readFileSync(path.join(__dirname, 'choices.json'), 'utf8'));
    choicesSentences = choicesData.sentences;
    console.log(`✅ Loaded ${choicesSentences.length} "لو خيروك" sentences`);
} catch (error) {
    console.error('❌ Error loading "لو خيروك" sentences:', error);
    process.exit(1);
}

// Functions to get random sentences
function getRandomWhatIfSentence() {
    const randomIndex = Math.floor(Math.random() * whatIfSentences.length);
    return whatIfSentences[randomIndex];
}

function getRandomChoiceSentence() {
    const randomIndex = Math.floor(Math.random() * choicesSentences.length);
    return choicesSentences[randomIndex];
}

// Functions to create styled embeds
function createWhatIfEmbed(sentence, user, guild) {
    const embed = new EmbedBuilder()
        .setTitle('💭 ماذا لو')
        .setDescription(sentence)
        .setColor('#5865F2') // Discord blurple color
        .setTimestamp()
        .setAuthor({
            name: user.displayName || user.username,
            iconURL: user.displayAvatarURL({ dynamic: true, size: 64 })
        })
        .setFooter({
            text: 'بوت ماذا لو',
            iconURL: 'https://cdn.discordapp.com/emojis/🤔.png'
        });
    
    // Add server thumbnail if in a guild
    if (guild && guild.iconURL()) {
        embed.setThumbnail(guild.iconURL({ dynamic: true, size: 128 }));
    }
    
    return embed;
}

function createChoiceEmbed(sentence, user, guild) {
    const embed = new EmbedBuilder()
        .setTitle('🤔 لو خيروك')
        .setDescription(sentence)
        .setColor('#FF9900') // Orange color
        .setTimestamp()
        .setAuthor({
            name: user.displayName || user.username,
            iconURL: user.displayAvatarURL({ dynamic: true, size: 64 })
        })
        .setFooter({
            text: 'بوت لو خيروك',
            iconURL: 'https://cdn.discordapp.com/emojis/🤔.png'
        });
    
    // Add server thumbnail if in a guild
    if (guild && guild.iconURL()) {
        embed.setThumbnail(guild.iconURL({ dynamic: true, size: 128 }));
    }
    
    return embed;
}

// Event when the client is ready
client.once('ready', () => {
    console.log(`🤖 Bot is ready! Logged in as ${client.user.tag}`);
    console.log(`📊 Serving ${client.guilds.cache.size} servers`);
    
    // Set bot status
client.user.setPresence({
        activities: [{ name: 'ماذا لو | لو خيروك', type: 'LISTENING' }],
        status: 'online',
    });
});

// Event when a message is created
client.on('messageCreate', async (message) => {
    // Ignore messages from bots
    if (message.author.bot) return;
    
    try {
        // Check if the message contains "ماذا لو"
        if (message.content.includes('ماذا لو')) {
            // Get a random what-if sentence
            const randomSentence = getRandomWhatIfSentence();
            
            // Create the embed with user and guild info
            const embed = createWhatIfEmbed(randomSentence, message.author, message.guild);
            
            // Send the embed as a reply
            await message.reply({ embeds: [embed] });
            
            console.log(`📝 Sent random "ماذا لو" sentence to ${message.author.tag} in ${message.guild?.name || 'DM'}`);
        }
        // Check if the message contains "لو خيروك"
        else if (message.content.includes('لو خيروك')) {
            // Make sure we have choices sentences to choose from
            if (choicesSentences.length === 0) {
                await message.reply('❌ عذرًا، لا توجد أسئلة "لو خيروك" متاحة حاليًا.');
                return;
            }
            
            // Get a random choice sentence
            const randomSentence = getRandomChoiceSentence();
            
            // Create the embed with user and guild info
            const embed = createChoiceEmbed(randomSentence, message.author, message.guild);
            
            // Send the embed as a reply
            await message.reply({ embeds: [embed] });
            
            console.log(`📝 Sent random "لو خيروك" sentence to ${message.author.tag} in ${message.guild?.name || 'DM'}`);
        }
    } catch (error) {
        console.error('❌ Error sending message:', error);
        
        // Send a simple fallback message if embed fails
        try {
            await message.reply('❌ حدث خطأ أثناء معالجة طلبك.');
        } catch (fallbackError) {
            console.error('❌ Failed to send fallback message:', fallbackError);
        }
    }
});

// Error handling
client.on('error', (error) => {
    console.error('❌ Discord client error:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('❌ Unhandled promise rejection:', error);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught exception:', error);
    process.exit(1);
});

// Login to Discord with your bot's token
// The token will be provided as an environment variable on Render.com
const token = process.env.DISCORD_TOKEN;

if (!token) {
    console.error('❌ DISCORD_TOKEN environment variable is not set!');
    console.error('📝 Please set the DISCORD_TOKEN environment variable on Render.com');
    process.exit(1);
}

// Create a simple HTTP server for Render.com port binding
const port = process.env.PORT || 8888;
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
        status: 'Bot is running! 🤖',
        name: 'ماذا لو | لو خيروك Discord Bot',
        servers: client.guilds ? client.guilds.cache.size : 0,
        uptime: process.uptime(),
        message: 'Type "ماذا لو" or "لو خيروك" in Discord to get a random question!'
    }, null, 2));
});

server.listen(port, '0.0.0.0', () => {
    console.log(`🌐 HTTP server running on port ${port}`);
});

client.login(token);
