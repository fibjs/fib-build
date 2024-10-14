const fs = require('fs');
const path = require('path');

fs.readFile(__filename);
try {
    fs.readFile(path.join(__dirname, 'node_modules', 'postject', 'package.json'), 'utf8');
    console.log('postject found');
} catch (e) {
    console.log('postject not found');
}
