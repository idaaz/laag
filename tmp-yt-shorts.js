const https = require('https');

https.get('https://www.youtube.com/shorts/_HPqTt3EHTo', (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        // Also try to look for microdata
        const metaMatch = data.match(/<meta itemprop="genre" content="(.*?)">/);
        if (metaMatch) {
            console.log('Shorts Genre found:', metaMatch[1]);
        } else {
            console.log('Shorts Genre not found.');
        }
    });
}).on('error', (e) => {
    console.error(e);
});
