const test = require('test');
test.setup();

const fs = require('fs');
const path = require('path');
const child_process = require('child_process');
const win32_cli = require('internal/helpers/win32_cli');
const $ = child_process.sh;

describe('fib-build', () => {
    var current_folder;

    function rm(fname) {
        if (fs.exists(fname)) {
            if (fs.stat(fname).isDirectory()) {
                fs.readdir(fname).forEach(f => {
                    rm(path.join(fname, f));
                });
                fs.rmdir(fname);
            } else {
                fs.unlink(fname);
            }
        }
    }

    function cp(src, dst) {
        if (fs.stat(src).isDirectory()) {
            fs.mkdir(dst, { recursive: true });
            fs.readdir(src).forEach(f => {
                cp(path.join(src, f), path.join(dst, f));
            });
        } else {
            fs.mkdir(path.dirname(dst), { recursive: true });
            fs.copyFile(src, dst);
        }
    }

    afterEach(() => {
        rm(path.join(current_folder, 'hello.exe'));
        rm(path.join(current_folder, 'hello.exe.app'));
        rm(path.join(current_folder, 'node_modules'));
    });

    function prepare(fname) {
        current_folder = path.join(__dirname, 'samples', fname);
        cp(path.join(__dirname, '..', 'node_modules'), path.join(current_folder, 'node_modules'));

        cp(path.join(__dirname, '..', 'fbuild.js'), path.join(current_folder, 'node_modules', 'fib-build', 'fbuild.js'));
        cp(path.join(__dirname, '..', 'utils'), path.join(current_folder, 'node_modules', 'fib-build', 'utils'));
        fs.mkdir(path.join(current_folder, 'node_modules', '.bin'), { recursive: true });

        if (process.platform === 'win32') {
            const scripts = win32_cli("fibjs", "..\\fib-build\\fbuild.js");
            fs.writeFile(path.join(current_folder, 'node_modules', '.bin', 'fbuild'), scripts.sh);
        } else {
            fs.symlink(path.join(current_folder, 'node_modules', 'fib-build', 'fbuild.js'), path.join(current_folder, 'node_modules', '.bin', 'fbuild'));
            fs.chmod(path.join(current_folder, 'node_modules', '.bin', 'fbuild'), 493);
        }

        rm(path.join(current_folder, 'hello.exe'));
    }

    function test_one(args_ = [], app) {
        const args = [
            'fbuild',
            '.',
            'hello.exe',
            ...args_
        ];

        const res = child_process.execFile(process.execPath, args, { cwd: current_folder });

        if (res.exitCode !== 0)
            throw new Error(res.stdout ? res.stdout : res.stderr);

        // console.log(res.stdout);

        return [
            child_process.execFile(process.execPath, [current_folder]).stdout.trim(),
            app ? child_process.execFile(path.join(current_folder, 'hello.exe.app'), ["-v"]).stdout.trim()
                : child_process.execFile(path.join(current_folder, 'hello.exe'), ["-v"]).stdout.trim()
        ];
    }

    it("do not overwrite", () => {
        prepare("test0");
        fs.writeFile(path.join(__dirname, 'samples', 'test0', 'hello.exe'), 'hello');

        assert.throws(() => {
            test_one()
        });
    });

    it("Hello World!", () => {
        prepare("test1");
        assert.deepEqual(test_one(), [
            'Hello, World!',
            'Hello, World!'
        ]);
    });

    it("ignore .bin", () => {
        prepare("test2");
        fs.writeFile(path.join(current_folder, 'node_modules', '.bin', 'test'), 'test');

        assert.deepEqual(test_one(), [
            "test",
            "test not found"
        ]);
    });

    it("ignore fib-build", () => {
        prepare("test3");
        assert.deepEqual(test_one(), [
            "fbuild found",
            "fbuild not found"
        ]);
    });

    it("ignore fib-inject", () => {
        prepare("test4");
        assert.deepEqual(test_one(), [
            "fib-inject found",
            "fib-inject not found"
        ]);
    });

    it("ignores in package.json", () => {
        prepare("test8");
        assert.deepEqual(test_one(), [
            "Hello, World!Hello, fibjs!",
            "Hello, World!"
        ]);
    });

    it("Legacy Mode", () => {
        prepare("test5");
        assert.deepEqual(test_one([
            "--legacy"
        ]), [
            'Hello, World!',
            'Hello, World!'
        ]);
    });

    if (process.platform === 'win32') {
        it("GUI Mode on Windows", () => {
            prepare("test6");
            assert.deepEqual(test_one([
                "--gui"
            ]), [
                'Windows CUI',
                'Windows GUI'
            ]);
        });
    }

    if (process.platform === 'darwin') {
        it("GUI Mode on Mac", () => {
            prepare("test7");
            const args = [
                'fbuild',
                '.',
                'hello.exe',
                "--gui"
            ];

            const res = child_process.execFile(process.execPath, args, { cwd: current_folder });
            if (res.exitCode !== 0)
                throw new Error(res.stdout ? res.stdout : res.stderr);

            // console.log(res.stdout);

            assert.deepEqual(fs.readFile(path.join(current_folder, 'hello.exe.app/Contents/Resources/test7.icns')),
                fs.readFile(path.join(__dirname, '../utils/app.icns')));

        });
    }
});

test.run(console.DEBUG);
