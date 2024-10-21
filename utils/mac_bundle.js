const fs = require('fs');
const path = require('path');
const $ = require('child_process').sh;

function plist(packageJson) {
    const name = packageJson.name;
    const description = packageJson.description || ' fibjs application';
    const identifier = packageJson.identifier || 'org.fibjs.app';
    const version = packageJson.version || '1.0.0';
    const versions = version.split('.');

    const info = `
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple Computer//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
    <dict>
        <key>CFBundleGetInfoString</key>
        <string>${description}</string>
        <key>CFBundleExecutable</key>
        <string>${name}</string>
        <key>CFBundleIdentifier</key>
        <string>${identifier}</string>
        <key>CFBundleName</key>
        <string>${name}</string>
        <key>CFBundleIconFile</key>
        <string>${name}.icns</string>
        <key>CFBundleShortVersionString</key>
        <string>${version}</string>
        <key>CFBundleInfoDictionaryVersion</key>
        <string>6.0</string>
        <key>CFBundlePackageType</key>
        <string>APPL</string>
        <key>IFMajorVersion</key>
        <integer>${versions[0]}</integer>
        <key>IFMinorVersion</key>
        <integer>${versions[1]}</integer>
    </dict>
</plist>
`;

    return info;
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

    const iconPath = packageJson.icon ? path.resolve(folder, packageJson.icon) : path.join(__dirname, 'app.png');
    fs.mkdir(path.join(outfile, "Contents", "Resources"), { recursive: true });
    console.log(`Copying ${iconPath} \n     to ${path.join(outfile, "Contents", "Resources", packageJson.name + '.icns')} ...`);
    fs.copyFile(iconPath, path.join(outfile, "Contents", "Resources", packageJson.name + '.icns'));
}
