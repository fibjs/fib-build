const fs = require('fs');
const path = require('path');
const $ = require('child_process').sh;

function plist(packageJson) {
    const name = packageJson.name;
    const description = packageJson.description || 'fibjs application';
    const identifier = packageJson.identifier || 'org.fibjs.app';
    const version = packageJson.version || '1.0.0';
    const versions = version.split('.');

    const info = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>CFBundleGetInfoString</key>
	<string>${description}</string>
	<key>CFBundleExecutable</key>
	<string>Contents/MacOS/${name}</string>
	<key>CFBundleIdentifier</key>
	<string>${identifier}</string>
	<key>CFBundleInfoDictionaryVersion</key>
	<string>6.0</string>
	<key>CFBundleName</key>
	<string>${name}</string>
	<key>CFBundlePackageType</key>
	<string>APPL</string>
	<key>CFBundleShortVersionString</key>
	<string>${version}</string>
	<key>CFBundleIconFile</key>
	<string>${name}.icns</string>
	<key>CFBundleVersion</key>
	<string>${versions[0]}</string>
	<key>UIDeviceFamily</key>
	<array>
		<integer>1</integer>
		<integer>2</integer>
	</array>
	<key>UILaunchStoryboardName</key>
	<string>LaunchScreen</string>
    <key>NSAppTransportSecurity</key>
    <dict>
        <key>NSAllowsArbitraryLoads</key>
        <true/>
    </dict>
</dict>
</plist>
`;

    return info;
}

function copy_folder(src, dest) {
    if (!fs.existsSync(src)) {
        return;
    }

    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest);
    }

    const files = fs.readdirSync(src);
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const srcFile = path.join(src, file);
        const destFile = path.join(dest, file);
        const stat = fs.statSync(srcFile);
        if (stat.isDirectory()) {
            copy_folder(srcFile, destFile);
        } else {
            fs.copyFileSync(srcFile, destFile);
        }
    }
}

module.exports = function (folder, outfile, buffer) {
    const packagePath = path.join(folder, 'package.json');
    const packageJson = fs.exists(packagePath) ? JSON.parse(fs.readFile(packagePath, 'utf8')) : {
        name: path.basename(folder),
    };

    const info = plist(packageJson);

    fs.mkdir(path.join(outfile, "Contents"), { recursive: true });
    console.log(`Writing ${path.join(outfile, "Contents", "Info.plist")} ...`);
    fs.writeFile(path.join(outfile, "Contents", "Info.plist"), info);

    fs.mkdir(path.join(outfile, "Contents", "MacOS"), { recursive: true });
    console.log(`Writing ${path.join(outfile, "Contents", "MacOS", packageJson.name)} ...`);
    fs.writeFile(path.join(outfile, "Contents", "MacOS", packageJson.name), buffer);
    fs.chmod(path.join(outfile, "Contents", "MacOS", packageJson.name), 493);

    fs.mkdir(path.join(outfile, "Contents", "Resources"), { recursive: true });
    console.log(`Copying ${path.join(__dirname, 'Resources')} \n     to ${path.join(outfile, "Contents", "Resources")} ...`);
    copy_folder(path.join(__dirname, 'Resources'), path.join(outfile, "Contents", "Resources"));

    const iconPath = packageJson.icon ? path.resolve(folder, packageJson.icon) : path.join(__dirname, 'app.icns');
    console.log(`Copying ${iconPath} \n     to ${path.join(outfile, "Contents", "Resources", packageJson.name + '.icns')} ...`);
    fs.copyFile(iconPath, path.join(outfile, "Contents", "Resources", packageJson.name + '.icns'));
}
