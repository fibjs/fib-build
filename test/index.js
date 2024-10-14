const test = require('test');
test.setup();

const fs = require('fs');
const path = require('path');
const child_process = require('child_process');
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
        rm(path.join(current_folder, 'node_modules'));
    });

    function prepare(fname) {
        current_folder = path.join(__dirname, 'samples', fname);
        cp(path.join(__dirname, '..', 'node_modules'), path.join(current_folder, 'node_modules'));

        cp(path.join(__dirname, '..', 'fbuild.js'), path.join(current_folder, 'node_modules', 'fib-build', 'fbuild.js'));
        fs.symlink(path.join(current_folder, 'node_modules', 'fib-build', 'fbuild.js'), path.join(current_folder, 'node_modules', '.bin', 'fbuild'));
        fs.chmod(path.join(current_folder, 'node_modules', '.bin', 'fbuild'), 493);
    }

    function test_one() {
        const res = child_process.execFile(process.execPath,
            [
                'fbuild',
                '.',
                '--outfile=hello.exe'
            ], {
            cwd: current_folder
        });

        console.log(res.stdout);

        return [
            $`${process.execPath} ${current_folder}`,
            $`${path.join(current_folder, 'hello.exe')}`
        ];
    }

    it("Hello World!", () => {
        prepare("test1");
        assert.deepEqual(test_one("test1"), [
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

    it("ignore postject", () => {
        prepare("test4");
        assert.deepEqual(test_one(), [
            "postject found",
            "postject not found"
          ]);
    });
});

test.run();
