const https = require('https');

https.get('https://www.youtube.com/watch?v=X5febvnrumM', (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        const metaMatch = data.match(/<meta itemprop="genre" content="([^"]+)">/);
        console.log('Genre:', metaMatch ? metaMatch[1] : 'NOT FOUND');

        // see if it has a category in microformat
        const categoryMatch = data.match(/"category":"([^"]+)"/);
        console.log('Category:', categoryMatch ? categoryMatch[1] : 'NOT FOUND');

        // Check duration
        const lengthMatch = data.match(/"lengthSeconds":"([^"]+)"/);
        console.log('Length:', lengthMatch ? lengthMatch[1] : 'NOT FOUND');
    });
}).on('error', (e) => {
    console.error(e);
});
