# ماذا لو Discord Bot

A Discord bot that responds with random "What if" questions in Arabic when users type "ماذا لو" in any text channel.

## Features

- 🤖 Responds to "ماذا لو" messages with random Arabic questions
- 💎 Beautiful embed messages with custom styling
- 🎲 Random sentence selection from a curated list
- 🌍 Full Arabic text support
- ☁️ Ready for cloud deployment on Render.com

## Setup Instructions

### 1. Create a Discord Bot

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and give it a name (e.g., "ماذا لو Bot")
3. Go to the "Bot" section in the left sidebar
4. Click "Add Bot" and confirm
5. Copy the bot token (you'll need this for deployment)
6. Under "Privileged Gateway Intents", enable:
   - Message Content Intent

### 2. Invite Bot to Your Server

1. Go to the "OAuth2" > "URL Generator" section
2. Select these scopes:
   - `bot`
3. Select these bot permissions:
   - Send Messages
   - Use Slash Commands
   - Embed Links
   - Read Message History
4. Copy the generated URL and visit it to invite the bot to your server

### 3. Deploy to Render.com

1. **Create a new account** on [Render.com](https://render.com) if you don't have one
2. **Connect your GitHub repo** (push this code to a GitHub repository first)
3. **Create a new Web Service** on Render:
   - Choose your repository
   - Set **Build Command**: `npm install`
   - Set **Start Command**: `npm start`
   - Set **Environment**: `Node.js`
4. **Add Environment Variable**:
   - Key: `DISCORD_TOKEN`
   - Value: (paste your Discord bot token here)
5. **Deploy** the service

### 4. Alternative: Local Development

If you want to test locally first:

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file in the project root:
   ```
   DISCORD_TOKEN=your_discord_bot_token_here
   ```

3. Run the bot:
   ```bash
   npm start
   ```

## Usage

Once the bot is running and invited to your Discord server:

1. Type "ماذا لو" in any text channel
2. The bot will respond with a random "What if" question in Arabic
3. Each response is styled as an embed with a nice appearance

## File Structure

```
whatif-discord-bot/
├── index.js           # Main bot file
├── sentences.json     # Arabic sentences data
├── package.json       # Node.js project configuration
└── README.md         # This file
```

## Customization

### Adding More Sentences

Edit `sentences.json` to add more "ماذا لو" questions:

```json
{
  "sentences": [
    "ماذا لو كان بإمكانك السفر عبر الزمن؟",
    "ماذا لو كانت الحيوانات تتكلم؟",
    // Add more sentences here...
  ]
}
```

### Changing Bot Appearance

Edit the `createWhatIfEmbed` function in `index.js` to customize:
- Embed color
- Title
- Footer text
- Emojis

## Troubleshooting

### Bot Not Responding
- Check that the bot has "Message Content Intent" enabled in Discord Developer Portal
- Verify the bot has proper permissions in your Discord server
- Check Render.com logs for any error messages

### Arabic Text Issues
- The bot is designed to handle Arabic text properly
- Make sure your Discord client supports Arabic text display

### Deployment Issues
- Ensure `DISCORD_TOKEN` environment variable is set correctly on Render.com
- Check that all files are properly uploaded to your repository
- Verify the start command is set to `npm start`

## Support

If you encounter any issues, check the logs on Render.com or run the bot locally to see detailed error messages.

---

Made with ❤️ for the Arabic Discord community
