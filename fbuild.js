#!/usr/bin/env fibjs

const zip = require('zip');
const fs = require('fs');
const io = require('io');
const path = require('path');
const $ = require('child_process').sh;

const { inject } = require('postject');

const usage = `\n\x1b[1mUsage:\x1b[0m
    fibjs fbuild <folder> --outfile=<file>

\x1b[1mOptions:\x1b[0m
    --outfile=<file>     The output file, required
    --execfile=<file>    The base executable file, default is the current executable
`;

if (process.argv.length < 3) {
    console.log(usage);
    process.exit(1);
}

var execfile = process.execPath;
var outfile;
var folder = process.argv[2];
const ignores = [];

function config() {
    for (var i = 3; i < process.argv.length; i++) {
        var arg = process.argv[i];
        if (arg.startsWith('--execfile=')) {
            execfile = arg.substr(11);
        } else if (arg.startsWith('--outfile=')) {
            outfile = arg.substr(10);
        } else {
            console.log(`Unknown option: ${arg}`);
            console.log("");

            console.log(usage);
            process.exit(1);
        }
    }

    if (!outfile) {
        console.log(usage);
        process.exit(1);
    }

    folder = path.resolve(folder);
    execfile = path.resolve(execfile);
    outfile = path.resolve(outfile);

    console.log(`
    folder:   ${folder}
    execfile: ${execfile}
    outfile:  ${outfile}
    `);


    if (__dirname.startsWith(folder + path.sep))
        ignores.push(__dirname.substring(folder.length + 1) + path.sep);

    var postject_folder = Object.keys(module.require.cache).pop();
    if (postject_folder.startsWith(folder + path.sep)) {
        const module_folder = path.join('node_modules', 'postject');
        var pos = postject_folder.indexOf(module_folder);
        if (pos > 0) {
            postject_folder = postject_folder.substring(0, pos + module_folder.length + 1);
            if (postject_folder.startsWith(folder + path.sep))
                ignores.push(postject_folder.substring(folder.length + 1));
        }
    }
}

async function build() {
    function is_ignore(file) {
        if (file.startsWith('.'))
            return true;

        if (file.indexOf('/.') > 0)
            return true;

        for (var i = 0; i < ignores.length; i++) {
            if (file.startsWith(ignores[i]))
                return true;
        }

        return false;
    }

    console.log("Building...\n");

    console.log(`Packaging ${folder} ...\n`);
    var ms = new io.MemoryStream();
    var zf = zip.open(ms, 'w');

    var files = fs.readdir(folder, { recursive: true });
    files.forEach(file => {
        if (is_ignore(file)) {
            console.log(`  \x1b[9m${file}\x1b[0m`);
        } else {
            var fullname = path.resolve(folder, file);
            var stat = fs.stat(fullname);
            if (stat.isFile()) {
                let color;
                if (stat.size > 16 * 1024) {
                    color = '\x1b[1m\x1b[31m'; // Bold Red
                } else if (stat.size > 4 * 1024) {
                    color = '\x1b[33m'; // Yellow
                } else {
                    color = '\x1b[0m'; // Default
                }
                console.log(`  ${color}${file} ${stat.size} bytes\x1b[0m`);
                zf.write(fs.readFile(fullname), file);
            }
        }
    });

    zf.close();

    ms.rewind();

    const data = ms.readAll();

    console.log(`\nPackaged ${folder} ${data.length} bytes\n`);

    console.log(`Injecting ${outfile} ...\n`);

    fs.copyFile(execfile, outfile, fs.constants.COPYFILE_EXCL);
    if (process.platform !== 'win32')
        fs.chmod(outfile, 493);

    await inject(outfile, 'APP', data, {
        sentinelFuse: "FIBJS_FUSE_fe21d3488eb4cdf267e5ea624f2006ce",
        overwrite: true
    });

    if (process.platform === 'darwin' && $`file ${outfile}`.indexOf('Mach-O') > 0) {
        console.log(`Signing ${outfile} ...\n`);
        console.log($`codesign -s - ${outfile}`);
    }

    console.log("Done.\n");
}

config();
build();
