const fs = require('fs');
const path = require('path');

fs.readFile(__filename);
try {
    fs.readFile(path.join(__dirname, 'node_modules', 'fib-build', 'fbuild.js'), 'utf8');
    console.log('fbuild found');
} catch (e) {
    console.log('fbuild not found');
}
