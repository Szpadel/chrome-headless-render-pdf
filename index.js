const CDP = require('chrome-remote-interface');
const fs = require('fs');
const cp = require('child_process');
const net = require('net');

const l = process.argv.length;
const url = process.argv[l - 2];
const file = process.argv[l - 1];

class RenderPDF {
    constructor() {
        this.chrome = null;
        this.client = null;
        this.port = Math.floor(Math.random() * 10000 + 1000);
    }

    static async generateSinglePdf(url, filename){
        const renderer = new RenderPDF();
        renderer.spawnChrome();
        await renderer.waitForDebugPort();
        await renderer.renderPdf(url, filename);
        renderer.killChrome();
    }

    async renderPdf(url, pdfFile, options) {
        return new Promise((resolve) => {
            CDP({port: this.port}, async (client) => {
                console.log(`Opening ${url}`);
                const {Page} = client;
                await Page.enable();
                await Page.navigate({url});
                Page.loadEventFired(async () => {
                    const pdf = await Page.printToPDF(options);
                    fs.writeFileSync(pdfFile, Buffer.from(pdf.data, 'base64'));
                    console.log(`Saved ${pdfFile}`);
                    client.close();
                    resolve();
                });
            });
        });
    }

    spawnChrome() {
        console.log('Starting chrome');
        this.chrome = cp.exec(`google-chrome-unstable --headless --remote-debugging-port=${this.port} --disable-gpu`);
    }

    killChrome() {
        this.chrome.kill(cp.SIGKILL)
    }

    async waitForDebugPort() {
        console.log('Waiting for chrome to became available');
        while (true) {
            try{
                await this.isPortOpen('localhost', this.port);
                console.log('Connected!');
                return;
            }catch(e) {
                await this.wait(10);
            }
        }
    }

    async isPortOpen(host, port) {
        return new Promise(function (resolve, reject) {
            const connection = new net.Socket();
            connection.connect({host, port});
            connection.on('connect', () => {
                connection.end();
                resolve();
            });
            connection.on('error', () => {
                reject();
            })
        });
    }

    async wait(ms) {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }
}

RenderPDF.generateSinglePdf(url, file);
