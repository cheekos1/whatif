const { createCanvas, loadImage } = require('canvas');
const GIFEncoder = require('gif-encoder-2');
const https = require('https');
const http = require('http');

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

function drawCircularAvatar(ctx, image, x, y, radius) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(image, x - radius, y - radius, radius * 2, radius * 2);
    ctx.restore();
}

function drawCircularProgressBar(ctx, x, y, radius, progress, color) {
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + (Math.PI * 2 * progress);

    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 10;
    ctx.stroke();

    if (progress > 0) {
        ctx.beginPath();
        ctx.arc(x, y, radius, startAngle, endAngle);
        ctx.strokeStyle = color;
        ctx.lineWidth = 10;
        ctx.lineCap = 'round';
        ctx.stroke();
    }
    ctx.restore();
}

function getColorFromPercentage(percent) {
    if (percent < 25) return '#ff4444';
    if (percent < 50) return '#ffaa00';
    if (percent < 75) return '#44bb44';
    return '#ff69b4';
}

async function generateCompatibilityGif(avatar1Url, avatar2Url) {
    const width = 400;
    const height = 400;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    const avatar1 = await loadImage(await fetchImage(avatar1Url));
    const avatar2 = await loadImage(await fetchImage(avatar2Url));

    const finalPercent = Math.floor(Math.random() * 101);
    const color = getColorFromPercentage(finalPercent);

    const encoder = new GIFEncoder(width, height);
    encoder.start();
    encoder.setRepeat(0);
    encoder.setDelay(30);
    encoder.setQuality(10);

    const totalFrames = 40;
    const avatarRadius = 60;

    for (let frame = 0; frame <= totalFrames; frame++) {
        const progress = frame / totalFrames;
        const currentPercent = Math.floor(progress * finalPercent);

        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, width, height);

        drawCircularAvatar(ctx, avatar1, 100, 160, avatarRadius);
        ctx.beginPath();
        ctx.arc(100, 160, avatarRadius + 3, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = 4;
        ctx.stroke();

        drawCircularAvatar(ctx, avatar2, 300, 160, avatarRadius);
        ctx.beginPath();
        ctx.arc(300, 160, avatarRadius + 3, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = 4;
        ctx.stroke();

        const barRadius = 80;
        drawCircularProgressBar(ctx, 200, 200, barRadius, progress, color);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${currentPercent}%`, 200, 200);

        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = color;
        ctx.fillText('التطابق', 200, 350);

        if (frame < totalFrames) {
            encoder.addFrame(ctx.getImageData(0, 0, width, height).data);
        }
    }

    for (let i = 0; i < 30; i++) {
        encoder.addFrame(ctx.getImageData(0, 0, width, height).data);
    }

    encoder.finish();
    return encoder.out.getData();
}

module.exports = { generateCompatibilityGif };
