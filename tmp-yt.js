const https = require('https');

https.get('https://www.youtube.com/watch?v=-ighD6sZG94', (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        const match = data.match(/"category":"(.*?)"/);
        if (match) {
            console.log('Category found:', match[1]);
        } else {
            console.log('Category not found.');
        }

        // Also try to look for microdata
        const metaMatch = data.match(/<meta itemprop="genre" content="(.*?)">/);
        if (metaMatch) {
            console.log('Genre found:', metaMatch[1]);
        }
    });
}).on('error', (e) => {
    console.error(e);
});
