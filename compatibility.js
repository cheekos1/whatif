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

function getEmojisForPercentage(percent) {
    if (percent < 25) return ['💔', '😭', '😢', '💔', '😿'];
    if (percent < 50) return ['🤔', '😐', '🤷', '❔', '😑'];
    if (percent < 75) return ['😊', '💫', '⭐', '🌟', '✨'];
    return ['❤️', '💕', '💗', '💖', '💘'];
}

function drawHeart(ctx, x, y, size, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y + size * 0.3);
    ctx.bezierCurveTo(x, y, x - size, y, x - size, y + size * 0.3);
    ctx.bezierCurveTo(x - size, y + size * 0.6, x, y + size, x, y + size * 1.2);
    ctx.bezierCurveTo(x, y + size, x + size, y + size * 0.6, x + size, y + size * 0.3);
    ctx.bezierCurveTo(x + size, y, x, y, x, y + size * 0.3);
    ctx.fill();
    ctx.restore();
}

function drawStar(ctx, x, y, size, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
        const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
        const px = x + size * Math.cos(angle);
        const py = y + size * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

function drawBrokenHeart(ctx, x, y, size, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y + size * 0.3);
    ctx.bezierCurveTo(x, y, x - size, y, x - size, y + size * 0.3);
    ctx.bezierCurveTo(x - size, y + size * 0.6, x, y + size, x, y + size * 1.2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x, y + size * 0.3);
    ctx.bezierCurveTo(x, y, x + size, y, x + size, y + size * 0.3);
    ctx.bezierCurveTo(x + size, y + size * 0.6, x, y + size, x, y + size * 1.2);
    ctx.fill();
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 2, y);
    ctx.lineTo(x - 3, y + size);
    ctx.stroke();
    ctx.restore();
}

function drawSparkle(ctx, x, y, size, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.lineTo(x + size * 0.3, y - size * 0.3);
    ctx.lineTo(x + size, y);
    ctx.lineTo(x + size * 0.3, y + size * 0.3);
    ctx.lineTo(x, y + size);
    ctx.lineTo(x - size * 0.3, y + size * 0.3);
    ctx.lineTo(x - size, y);
    ctx.lineTo(x - size * 0.3, y - size * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

const shapeDrawers = [drawHeart, drawStar, drawBrokenHeart, drawSparkle];

function initParticles(count, width, height) {
    const particles = [];
    for (let i = 0; i < count; i++) {
        particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            size: 6 + Math.random() * 10,
            speed: 0.5 + Math.random() * 1.5,
            wobble: Math.random() * Math.PI * 2,
            wobbleSpeed: 0.02 + Math.random() * 0.04,
            shapeIndex: Math.floor(Math.random() * shapeDrawers.length),
            opacity: 0.3 + Math.random() * 0.5,
        });
    }
    return particles;
}

function drawParticles(ctx, particles, width, height, frame) {
    const shapeColors = ['#ff6b6b', '#ffd700', '#ff4757', '#ffffff'];
    for (const p of particles) {
        p.y -= p.speed;
        p.wobble += p.wobbleSpeed;
        const wx = Math.sin(p.wobble) * 15;

        if (p.y < -p.size * 2) {
            p.y = height + p.size * 2;
            p.x = Math.random() * width;
        }

        ctx.globalAlpha = p.opacity;
        shapeDrawers[p.shapeIndex](ctx, p.x + wx, p.y, p.size, shapeColors[p.shapeIndex]);
    }
    ctx.globalAlpha = 1;
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

    const particles = initParticles(15, width, height);

    const encoder = new GIFEncoder(width, height);
    encoder.start();
    encoder.setRepeat(0);
    encoder.setDelay(40);
    encoder.setQuality(10);

    const totalFrames = 20;
    const avatarRadius = 60;

    for (let frame = 0; frame <= totalFrames; frame++) {
        const progress = frame / totalFrames;
        const currentPercent = Math.floor(progress * finalPercent);

        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, width, height);

        drawParticles(ctx, particles, width, height, frame);

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
