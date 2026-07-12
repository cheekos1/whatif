const { Client, GatewayIntentBits, EmbedBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { generateCompatibilityGif } = require('./compatibility');
const { generateQuestionImage } = require('./questionImage');

const ADMIN_ID = '1515763420081819678';

function loadCompatibilityData() {
    return JSON.parse(fs.readFileSync(path.join(__dirname, 'compatibility_data.json'), 'utf8'));
}

function saveCompatibilityData(data) {
    fs.writeFileSync(path.join(__dirname, 'compatibility_data.json'), JSON.stringify(data, null, 2));
}

function buildPanelEmbed() {
    const data = loadCompatibilityData();
    let pairsText = data.special_pairs.length > 0
        ? data.special_pairs.map((p, i) => `${i + 1}. <@${p[0]}> + <@${p[1]}>`).join('\n')
        : 'لا يوجد أزواج';
    let zeroText = data.always_zero.length > 0
        ? data.always_zero.map((id, i) => `${i + 1}. <@${id}>`).join('\n')
        : 'لا يوجد مستخدمون';

    return new EmbedBuilder()
        .setTitle('⚙️ ضبط التطابق')
        .addFields(
            { name: '💯 الأزواج (100%)', value: pairsText, inline: true },
            { name: '🚫 المستخدمون (0%)', value: zeroText, inline: true }
        )
        .setColor('#FF69B4')
        .setTimestamp();
}

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
let menAktharSentences = [];

let whatIfIndex = 0;
let choicesIndex = 0;
let menAktharIndex = 0;

function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

try {
    const sentencesData = JSON.parse(fs.readFileSync(path.join(__dirname, 'whatif_sentences.json'), 'utf8'));
    whatIfSentences = shuffleArray(sentencesData.sentences);
    console.log(`✅ Loaded ${whatIfSentences.length} "ماذا لو" sentences`);
} catch (error) {
    console.error('❌ Error loading "ماذا لو" sentences:', error);
    process.exit(1);
}

try {
    const choicesData = JSON.parse(fs.readFileSync(path.join(__dirname, 'choices_sentences.json'), 'utf8'));
    choicesSentences = shuffleArray(choicesData.sentences);
    console.log(`✅ Loaded ${choicesSentences.length} "لو خيروك" sentences`);
} catch (error) {
    console.error('❌ Error loading "لو خيروك" sentences:', error);
    process.exit(1);
}

try {
    const menAktharData = JSON.parse(fs.readFileSync(path.join(__dirname, 'men_akthar_sentences.json'), 'utf8'));
    menAktharSentences = shuffleArray(menAktharData.sentences);
    console.log(`✅ Loaded ${menAktharSentences.length} "من أكثر" sentences`);
} catch (error) {
    console.error('❌ Error loading "من أكثر" sentences:', error);
    process.exit(1);
}

// Functions to get next sentence (shuffle and cycle)
function getRandomWhatIfSentence() {
    if (whatIfIndex >= whatIfSentences.length) {
        whatIfSentences = shuffleArray(whatIfSentences);
        whatIfIndex = 0;
    }
    return whatIfSentences[whatIfIndex++];
}

function getRandomChoiceSentence() {
    if (choicesIndex >= choicesSentences.length) {
        choicesSentences = shuffleArray(choicesSentences);
        choicesIndex = 0;
    }
    return choicesSentences[choicesIndex++];
}

function getRandomMenAktharSentence() {
    if (menAktharIndex >= menAktharSentences.length) {
        menAktharSentences = shuffleArray(menAktharSentences);
        menAktharIndex = 0;
    }
    return menAktharSentences[menAktharIndex++];
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

function createMenAktharEmbed(sentence, user, guild) {
    const embed = new EmbedBuilder()
        .setTitle('🔥 من أكثر')
        .setDescription(sentence)
        .setColor('#E91E63') // Pink color
        .setTimestamp()
        .setAuthor({
            name: user.displayName || user.username,
            iconURL: user.displayAvatarURL({ dynamic: true, size: 64 })
        })
        .setFooter({
            text: 'بوت من أكثر',
            iconURL: 'https://cdn.discordapp.com/emojis/🔥.png'
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
        activities: [{ name: 'ماذا لو | لو خيروك | من أكثر', type: 'LISTENING' }],
        status: 'online',
    });
});

// Event when a message is created
client.on('messageCreate', async (message) => {
    // Ignore messages from bots
    if (message.author.bot) return;
    
    try {
        // Check for admin panel command
        if (message.content === 'ضبط تطابق') {
            if (message.author.id !== ADMIN_ID) {
                await message.reply('❌ هذا الأمر متاح للمسؤول فقط.');
                return;
            }

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('compat_add_pair')
                    .setLabel('➕ إضافة زوج 100%')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('compat_add_zero')
                    .setLabel('➕ إضافة مستخدم 0%')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('compat_remove')
                    .setLabel('🗑️ حذف')
                    .setStyle(ButtonStyle.Secondary)
            );

            await message.reply({ embeds: [buildPanelEmbed()], components: [row] });
            return;
        }

        // Check if the message contains "تطابق"
        if (message.content.includes('تطابق')) {
            let user1 = message.author;
            let user2 = null;

            // Check if it's a reply
            if (message.reference && message.reference.messageId) {
                try {
                    const repliedMessage = await message.channel.messages.fetch(message.reference.messageId);
                    user2 = repliedMessage.author;
                } catch (error) {
                    console.error('❌ Error fetching replied message:', error);
                }
            }

            // Check if there's a mention
            if (!user2 && message.mentions.users.size > 0) {
                user2 = message.mentions.users.first();
            }

            if (!user2) {
                await message.reply('❌ يجب ذكر شخص أو الرد على رسالة للتطابق.');
                return;
            }

            if (user1.id === user2.id) {
                await message.reply('❌ لا يمكنك التطابق مع نفسك!');
                return;
            }

            if (user1.bot || user2.bot) {
                await message.reply('❌ لا يمكنك التطابق مع البوتات!');
                return;
            }

            try {
                await message.channel.sendTyping();

                const avatar1 = user1.displayAvatarURL({ extension: 'png', size: 256 });
                const avatar2 = user2.displayAvatarURL({ extension: 'png', size: 256 });

                const gifBuffer = await generateCompatibilityGif(avatar1, avatar2, user1.id, user2.id);

                const attachment = new AttachmentBuilder(gifBuffer, { name: 'compatibility.gif' });

                const embed = new EmbedBuilder()
                    .setTitle('💕 التطابق')
                    .setDescription(`${user1.displayName} 💗 ${user2.displayName}`)
                    .setColor('#FF69B4')
                    .setImage('attachment://compatibility.gif')
                    .setTimestamp();

                await message.reply({ embeds: [embed], files: [attachment] });
            } catch (error) {
                console.error('❌ Error generating compatibility GIF:', error);
                await message.reply('❌ حدث خطأ أثناء إنشاء GIF التطابق.');
            }
        }
        // Check if the message contains "ماذا لو"
        else if (message.content.includes('ماذا لو')) {
            const randomSentence = getRandomWhatIfSentence();
            const avatarUrl = message.author.displayAvatarURL({ extension: 'png', size: 256 });
            const imageBuffer = await generateQuestionImage(randomSentence, avatarUrl);
            const attachment = new AttachmentBuilder(imageBuffer, { name: 'question.jpg' });
            await message.reply({ files: [attachment] });
            console.log(`📝 Sent random "ماذا لو" sentence to ${message.author.tag} in ${message.guild?.name || 'DM'}`);
        }
        // Check if the message contains "لو خيروك"
        else if (message.content.includes('لو خيروك')) {
            if (choicesSentences.length === 0) {
                await message.reply('❌ عذرًا، لا توجد أسئلة "لو خيروك" متاحة حاليًا.');
                return;
            }
            const randomSentence = getRandomChoiceSentence();
            const avatarUrl = message.author.displayAvatarURL({ extension: 'png', size: 256 });
            const imageBuffer = await generateQuestionImage(randomSentence, avatarUrl);
            const attachment = new AttachmentBuilder(imageBuffer, { name: 'question.jpg' });
            await message.reply({ files: [attachment] });
            console.log(`📝 Sent random "لو خيروك" sentence to ${message.author.tag} in ${message.guild?.name || 'DM'}`);
        }
        // Check if the message contains "من أكثر"
        else if (message.content.includes('من اكثر')) {
            if (menAktharSentences.length === 0) {
                await message.reply('❌ عذرًا، لا توجد أسئلة "من أكثر" متاحة حاليًا.');
                return;
            }
            const randomSentence = getRandomMenAktharSentence();
            const avatarUrl = message.author.displayAvatarURL({ extension: 'png', size: 256 });
            const imageBuffer = await generateQuestionImage(randomSentence, avatarUrl);
            const attachment = new AttachmentBuilder(imageBuffer, { name: 'question.jpg' });
            await message.reply({ files: [attachment] });
            console.log(`📝 Sent random "من أكثر" sentence to ${message.author.tag} in ${message.guild?.name || 'DM'}`);
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

// Handle button interactions
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;
    if (interaction.user.id !== ADMIN_ID) {
        await interaction.reply({ content: '❌ هذا الأمر متاح للمسؤول فقط.', ephemeral: true });
        return;
    }

    try {
        if (interaction.customId === 'compat_add_pair') {
            const modal = new ModalBuilder()
                .setCustomId('modal_add_pair')
                .setTitle('إضافة زوج 100%');

            const id1Input = new TextInputBuilder()
                .setCustomId('id1')
                .setLabel('معرف المستخدم الأول')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const id2Input = new TextInputBuilder()
                .setCustomId('id2')
                .setLabel('معرف المستخدم الثاني')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            modal.addComponents(
                new ActionRowBuilder().addComponents(id1Input),
                new ActionRowBuilder().addComponents(id2Input)
            );

            await interaction.showModal(modal);
        }

        if (interaction.customId === 'compat_add_zero') {
            const modal = new ModalBuilder()
                .setCustomId('modal_add_zero')
                .setTitle('إضافة مستخدم 0%');

            const idInput = new TextInputBuilder()
                .setCustomId('id')
                .setLabel('معرف المستخدم')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            modal.addComponents(new ActionRowBuilder().addComponents(idInput));
            await interaction.showModal(modal);
        }

        if (interaction.customId === 'compat_remove') {
            const data = loadCompatibilityData();
            const rows = [];

            if (data.special_pairs.length > 0) {
                const pairOptions = data.special_pairs.map((p, i) => ({
                    label: `${p[0]} + ${p[1]}`,
                    value: `pair_${i}`
                }));

                const pairSelect = new ActionRowBuilder().addComponents(
                    new (require('discord.js').StringSelectMenuBuilder)()
                        .setCustomId('remove_pair')
                        .setPlaceholder('حذف زوج 100%')
                        .addOptions(pairOptions)
                );
                rows.push(pairSelect);
            }

            if (data.always_zero.length > 0) {
                const zeroOptions = data.always_zero.map((id, i) => ({
                    label: id,
                    value: `zero_${i}`
                }));

                const zeroSelect = new ActionRowBuilder().addComponents(
                    new (require('discord.js').StringSelectMenuBuilder)()
                        .setCustomId('remove_zero')
                        .setPlaceholder('حذف مستخدم 0%')
                        .addOptions(zeroOptions)
                );
                rows.push(zeroSelect);
            }

            if (rows.length === 0) {
                await interaction.reply({ content: '❌ لا يوجد عناصر للحذف.', ephemeral: true });
                return;
            }

            await interaction.reply({ content: 'اختر العنصر الذي تريد حذفه:', components: rows, ephemeral: true });
        }
    } catch (error) {
        console.error('❌ Error handling button:', error);
    }
});

// Handle modals
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isModalSubmit()) return;
    if (interaction.user.id !== ADMIN_ID) return;

    try {
        if (interaction.customId === 'modal_add_pair') {
            const id1 = interaction.fields.getTextInputValue('id1').trim();
            const id2 = interaction.fields.getTextInputValue('id2').trim();

            if (id1 === id2) {
                await interaction.reply({ content: '❌ المعرفين مختلفين.', ephemeral: true });
                return;
            }

            const data = loadCompatibilityData();
            const exists = data.special_pairs.some(p => p.includes(id1) && p.includes(id2));
            if (exists) {
                await interaction.reply({ content: '❌ هذا الزوج موجود بالفعل.', ephemeral: true });
                return;
            }

            data.special_pairs.push([id1, id2]);
            saveCompatibilityData(data);
            await interaction.reply({ embeds: [buildPanelEmbed()], components: [
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('compat_add_pair').setLabel('➕ إضافة زوج 100%').setStyle(ButtonStyle.Success),
                    new ButtonBuilder().setCustomId('compat_add_zero').setLabel('➕ إضافة مستخدم 0%').setStyle(ButtonStyle.Danger),
                    new ButtonBuilder().setCustomId('compat_remove').setLabel('🗑️ حذف').setStyle(ButtonStyle.Secondary)
                )
            ]});
        }

        if (interaction.customId === 'modal_add_zero') {
            const id = interaction.fields.getTextInputValue('id').trim();
            const data = loadCompatibilityData();

            if (data.always_zero.includes(id)) {
                await interaction.reply({ content: '❌ هذا المستخدم موجود بالفعل.', ephemeral: true });
                return;
            }

            data.always_zero.push(id);
            saveCompatibilityData(data);
            await interaction.reply({ embeds: [buildPanelEmbed()], components: [
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('compat_add_pair').setLabel('➕ إضافة زوج 100%').setStyle(ButtonStyle.Success),
                    new ButtonBuilder().setCustomId('compat_add_zero').setLabel('➕ إضافة مستخدم 0%').setStyle(ButtonStyle.Danger),
                    new ButtonBuilder().setCustomId('compat_remove').setLabel('🗑️ حذف').setStyle(ButtonStyle.Secondary)
                )
            ]});
        }
    } catch (error) {
        console.error('❌ Error handling modal:', error);
    }
});

// Handle select menus for removal
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isStringSelectMenu()) return;
    if (interaction.user.id !== ADMIN_ID) return;

    try {
        const data = loadCompatibilityData();

        if (interaction.customId === 'remove_pair') {
            const index = parseInt(interaction.values[0].replace('pair_', ''));
            data.special_pairs.splice(index, 1);
            saveCompatibilityData(data);
            await interaction.update({ embeds: [buildPanelEmbed()], components: [] });
        }

        if (interaction.customId === 'remove_zero') {
            const index = parseInt(interaction.values[0].replace('zero_', ''));
            data.always_zero.splice(index, 1);
            saveCompatibilityData(data);
            await interaction.update({ embeds: [buildPanelEmbed()], components: [] });
        }
    } catch (error) {
        console.error('❌ Error handling select menu:', error);
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
        name: 'ماذا لو | لو خيروك | من أكثر Discord Bot',
        servers: client.guilds ? client.guilds.cache.size : 0,
        uptime: process.uptime(),
        message: 'Type "ماذا لو", "لو خيروك", or "من أكثر" in Discord to get a random question!'
    }, null, 2));
});

server.listen(port, '0.0.0.0', () => {
    console.log(`🌐 HTTP server running on port ${port}`);
});

client.login(token);
