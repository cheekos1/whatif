const { createCanvas, loadImage, registerFont } = require('canvas');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');

registerFont(path.join(__dirname, 'Tajawal-Bold.ttf'), { family: 'Tajawal', weight: 'bold' });
registerFont(path.join(__dirname, 'Tajawal-Regular.ttf'), { family: 'Tajawal', weight: 'normal' });

function fetchImage(url) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        client.get(url, (res) => {
            const chunks = [];
            res.on('data', (chunk) => chunks.push(chunk));
            res.on('end', () => resolve(Buffer.concat(chunks)));
            res.on('error', reject);
        }).on('error', reject);
    });
}

function stripEmojis(text) {
    return text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/gu, '').trim();
}

function wrapText(ctx, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    for (const word of words) {
        const testLine = currentLine ? currentLine + ' ' + word : word;
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
        } else {
            currentLine = testLine;
        }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
}

async function generateQuestionImage(questionText, avatarUrl) {
    const width = 1200;
    const height = 675;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    const templateBuffer = fs.readFileSync(path.join(__dirname, 'template.png'));
    const template = await loadImage(templateBuffer);
    ctx.drawImage(template, 0, 0, width, height);

    if (avatarUrl) {
        const avatar = await loadImage(await fetchImage(avatarUrl));
        const circleX = 580;
        const circleY = 126;
        const circleW = 155;
        const circleH = 161;

        ctx.save();
        ctx.beginPath();
        ctx.arc(circleX + circleW / 2, circleY + circleH / 2, Math.min(circleW, circleH) / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, circleX, circleY, circleW, circleH);
        ctx.restore();
    }

    const maxWidth = 860;
    const fontSize = 38;
    ctx.font = `bold ${fontSize}px Tajawal`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    const cleanText = stripEmojis(questionText);
    const lines = wrapText(ctx, cleanText, maxWidth);
    const lineHeight = fontSize * 1.5;
    const totalTextHeight = lines.length * lineHeight;
    const startY = 400 + (180 - totalTextHeight) / 2;

    for (let i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], width / 2, startY + i * lineHeight);
    }

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    return canvas.toBuffer('image/jpeg', { quality: 0.85 });
}

module.exports = { generateQuestionImage };
