const fs = require('fs');
const Jimp = require('jimp');
const path = require('path');

const iconDir = path.join(__dirname, 'url-tracker', 'icons');
const baseIcon = path.join(iconDir, 'icon16.png'); // Assuming icon16 is the source for now, or whatever exists

async function resizeIcons() {
    try {
        const image = await Jimp.read(baseIcon);

        await image.clone().resize(48, 48).writeAsync(path.join(iconDir, 'icon48.png'));
        console.log('Created icon48.png');

        await image.clone().resize(128, 128).writeAsync(path.join(iconDir, 'icon128.png'));
        console.log('Created icon128.png');

    } catch (err) {
        console.error('Error resizing icons:', err);
    }
}

resizeIcons();
