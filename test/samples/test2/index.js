const fs = require('fs');
const path = require('path');

fs.readFile(__filename);
try {
    console.log(fs.readFile(path.join(__dirname, 'node_modules', '.bin', 'test'), 'utf8'));
} catch (e) {
    console.log('test not found');
}
