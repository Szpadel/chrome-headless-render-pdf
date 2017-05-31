const CDP = require('chrome-remote-interface');
const fs = require('fs');
const cp = require('child_process');

const l = process.argv.length;
const url = process.argv[l-2];
const file = process.argv[l-1];

const port = Math.floor(Math.random() * 10000 + 1000);

(async () =>{
    const chrome = cp.exec(`google-chrome-unstable --headless --remote-debugging-port=${port} --disable-gpu`);
    await wait(5000);

    CDP({port}, async (client) => {
        console.log(`Opening ${url}`);
        const {Page} = client;
        await Page.enable();
        await Page.navigate({url});
        Page.loadEventFired(async () => {
            const pdf = await Page.printToPDF();
            fs.writeFileSync(file, Buffer.from(pdf.data, 'base64'));
            console.log(`saved ${file}`);
            client.close();
            chrome.kill(cp.SIGKILL);
        });
    });

})();

async function wait(ms) {
    return new Promise((resolve) =>{
        setTimeout(resolve, ms);
    });
}
