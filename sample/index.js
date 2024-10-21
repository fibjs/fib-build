const gui = require("gui");
const path = require("path");

gui.open({
    file: path.resolve(__dirname, "frame.html"),
    icon: path.resolve(__dirname, "toolbox.512.png"),
    caption: false,
    devtools: true,
    onclose: () => {
        console.log("closed");
    }
});
