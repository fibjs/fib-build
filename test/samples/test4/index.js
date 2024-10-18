const fs = require('fs');
const path = require('path');

fs.readFile(__filename);
try {
    fs.readFile(path.join(__dirname, 'node_modules', 'fib-inject', 'package.json'), 'utf8');
    console.log('fib-inject found');
} catch (e) {
    console.log('fib-inject not found');
}
