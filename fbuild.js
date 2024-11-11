#!/usr/bin/env fibjs

const zip = require('zip');
const fs = require('fs');
const io = require('io');
const path = require('path');
const $ = require('child_process').sh;

const finject = require('fib-inject');

const mac_bundle = require('./utils/mac_bundle.js');
const ignore = require('./utils/ignore.js');

const usage = `\n\x1b[1mUsage:\x1b[0m
    fibjs fbuild <folder> <outfile> [--execfile=<file>] [--legacy]

\x1b[1mOptions:\x1b[0m
    <folder>             The folder to package, required
    <outfile>            The output file, required

    --execfile=<file>    The base executable file, default is the current executable

    --gui                Enable GUI mode
    --legacy             Use legacy mode to append data to the end of outfile
    --overwrite          Overwrite the output file if it exists

    --help               Show this help message
`;

if (process.argv.length < 3) {
    console.log(usage);
    process.exit(1);
}

const sentinelFuse = "FIBJS_FUSE_fe21d3488eb4cdf267e5ea624f2006ce";
var execfile = process.execPath;
var folder = process.argv[2];
var outfile = process.argv[3];
var legacyMode = false;
var guiMode = false;
var overwrite = false;
const ignores = ignore();

function config() {
    for (var i = 4; i < process.argv.length; i++) {
        var arg = process.argv[i];
        if (arg.startsWith('--execfile=')) {
            execfile = arg.substr(11);
        } else if (arg === '--gui') {
            guiMode = true;
        } else if (arg === '--legacy') {
            legacyMode = true;
        } else if (arg === '--overwrite') {
            overwrite = true;
        } else {
            if (arg !== '--help') {
                console.log(`Unknown option: ${arg}`);
                console.log("");
            }

            console.log(usage);
            process.exit(1);
        }
    }

    if (legacyMode && guiMode) {
        console.log("Cannot use both --gui and --legacy options at the same time.");
        console.log("");
        console.log(usage);
        process.exit(1);
    }

    folder = path.resolve(folder);
    execfile = path.resolve(execfile);

    outfile = path.resolve(outfile);
    if (process.platform === 'win32' && !outfile.endsWith('.exe'))
        outfile += '.exe';
    else if (guiMode && process.platform === 'darwin' && guiMode && !outfile.endsWith('.app'))
        outfile += '.app';

    console.log(`
folder:      ${folder}
execfile:    ${execfile}
outfile:     ${outfile}
GUI Mode:    ${guiMode ? 'Enabled' : 'Disabled'}
Legacy Mode: ${legacyMode ? 'Enabled' : 'Disabled'}
`);

    if (__dirname.startsWith(folder + path.sep))
        ignores.add(__dirname.substring(folder.length + 1) + path.sep);

    for (var inject_folder in module.require.cache) {
        if (inject_folder.startsWith(folder + path.sep)) {
            const module_folder = path.join('node_modules', 'fib-inject');
            var pos = inject_folder.indexOf(module_folder);
            if (pos > 0) {
                inject_folder = inject_folder.substring(0, pos + module_folder.length + 1);
                if (inject_folder.startsWith(folder + path.sep)) {
                    ignores.add(inject_folder.substring(folder.length + 1));
                    break;
                }
            }
        }
    }

    var packageJson;
    try {
        packageJson = JSON.parse(fs.readFileSync(path.join(folder, 'package.json'), 'utf8'));
    } catch (e) {
    }

    if (packageJson && packageJson.ignore)
        ignores.add(packageJson.ignore);
}

async function build() {
    function make_sentinel(buffer) {
        const firstSentinel = buffer.indexOf(sentinelFuse);

        if (firstSentinel === -1) {
            throw new Error(
                `Could not find the sentinel ${sentinelFuse} in the binary`
            );
        }

        const lastSentinel = buffer.lastIndexOf(sentinelFuse);

        if (firstSentinel !== lastSentinel) {
            throw new Error(
                `Multiple occurences of sentinel "${sentinelFuse}" found in the binary`
            );
        }

        const colonIndex = firstSentinel + sentinelFuse.length;
        if (buffer[colonIndex] !== ":".charCodeAt(0)) {
            throw new Error(
                `Value at index ${colonIndex} must be ':' but '${buffer[
                    colonIndex
                ].charCodeAt(0)}' was found`
            );
        }

        const hasResourceIndex = firstSentinel + sentinelFuse.length + 1;
        const hasResourceValue = buffer[hasResourceIndex];
        if (hasResourceValue === "0".charCodeAt(0)) {
            buffer[hasResourceIndex] = "2".charCodeAt(0);
        } else {
            throw new Error("Sentinel already exists");
        }

        buffer;
    }

    function is_ignore(file) {
        if (file.startsWith('.'))
            return true;

        if (file.indexOf(path.sep + '.') > 0)
            return true;

        return ignores.ignores(file);
    }

    if (!overwrite && fs.exists(outfile)) {
        console.log(`${outfile} already exists, please remove it first.\n`);
        process.exit(1);
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

    var executable = fs.readFileSync(execfile);

    if (!legacyMode) {
        try {
            const { executableFormat, buffer } = finject.injectBuffer(executable, 'APP', data, {
                sentinelFuse,
                subsystem: guiMode ? 'gui' : 'cui'
            });

            if (executableFormat === finject.ExecutableFormat.kMachO) {
                if (guiMode) {
                    mac_bundle(folder, outfile, buffer);
                } else {
                    fs.writeFile(outfile, buffer);
                    if (process.platform !== 'win32')
                        fs.chmod(outfile, 493);
                }

                if (process.platform === 'darwin') {
                    console.log(`Signing ${outfile} ...\n`);
                    console.log($`codesign -s - ${outfile}`);
                }
            } else {
                fs.writeFile(outfile, buffer);
                if (process.platform !== 'win32')
                    fs.chmod(outfile, 493);
            }
        } catch (e) {
            try {
                fs.unlink(outfile);
            } catch (e) { }

            console.log(e);
            legacyMode = true;
        }
    }

    if (legacyMode) {
        make_sentinel(executable);
        fs.writeFile(outfile, executable);
        if (process.platform !== 'win32')
            fs.chmod(outfile, 493);

        if (process.platform === 'darwin' && finject.is_macho(executable)) {
            console.log(`Signing ${outfile} ...\n`);
            console.log($`codesign -s - ${outfile}`);
        }

        fs.appendFile(outfile, data);
    }

    console.log("Done.\n");
}

config();
build();
