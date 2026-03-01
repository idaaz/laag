const fs = require('fs');
const path = require('path');
const pZlib = require('zlib');
const { promisify } = require('util');

// Super slim ZIP writer
async function createZip(sourceDir, destZip) {
    const out = fs.createWriteStream(destZip);

    // Write local file header
    const files = [];

    function walk(dir, prefix = '') {
        const entries = fs.readdirSync(dir);
        for (const entry of entries) {
            if (entry === '.DS_Store' || entry.startsWith('.')) continue;
            const fullPath = path.join(dir, entry);
            const relativePath = prefix ? prefix + '/' + entry : entry;

            if (fs.statSync(fullPath).isDirectory()) {
                walk(fullPath, relativePath);
            } else {
                files.push({ fullPath, relativePath });
            }
        }
    }

    walk(sourceDir);
    console.log(`Found ${files.length} files to ZIP`);

    // We will just use PowerShell again, but forcing Forward Slashes using 7zip if available, 
    // or just creating a Python script since Python's zipfile module is guaranteed to be POSIX compliant and built-in.
}

createZip();
