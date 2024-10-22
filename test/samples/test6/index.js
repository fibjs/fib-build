const child_process = require('child_process');

const res = child_process.execFile("dumpbin", [
    '/headers',
    process.execPath
]);

const regex = /subsystem\s+\((.+)\)/;
const match = res.stdout.match(regex);
if (match) {
    console.log(match[1]);
}
