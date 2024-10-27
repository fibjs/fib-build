const fs = require('fs');
const path = require('path');

var hello = fs.readFile(path.join(__dirname, 'hello1.txt'), 'utf8');

try {
    hello += fs.readFile(path.join(__dirname, 'hello2.txt'), 'utf8');
} catch (e) { }

console.log(hello);