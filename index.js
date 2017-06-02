const CDP = require('chrome-remote-interface');
const fs = require('fs');
const cp = require('child_process');
const net = require('net');

class RenderPDF {
    constructor(options) {
        this.setOptions(options || {});
        this.chrome = null;
        this.client = null;
        this.port = Math.floor(Math.random() * 10000 + 1000);
    }

    setOptions(options) {
        this.options = {
            printLogs: def('printLogs', false),
            printErrors: def('printErrors', true)
        };

        function def(key, defaultValue) {
            return options[key] === undefined ? defaultValue : options[key];
        }
    }

    static async generateSinglePdf(url, filename, options) {
        const renderer = new RenderPDF(options);
        renderer.spawnChrome();
        await renderer.waitForDebugPort();
        try {
            await renderer.renderPdf(url, filename);
        } catch (e) {
            this.error('error:', e);
        }
        renderer.killChrome();
    }

    static async generateMultiplePdf(pairs, options) {
        const renderer = new RenderPDF(options);
        renderer.spawnChrome();
        await renderer.waitForDebugPort();
        for(const job of pairs) {
            try {
                await renderer.renderPdf(job.url, job.pdf);
            } catch (e) {
                this.error('error:', e);
            }
        }
        renderer.killChrome();
    }

    async renderPdf(url, pdfFile, options) {
        return new Promise((resolve) => {
            CDP({port: this.port}, async (client) => {
                this.log(`Opening ${url}`);
                const {Page, Emulation, Animation} = client;
                await Page.enable();
                await Animation.enable();

                await Page.navigate({url});
                await Emulation.setVirtualTimePolicy({policy: 'pauseIfNetworkFetchesPending', budget: 5000});

                const loaded = this.cbToPromise(Page.loadEventFired);
                const jsDone = this.cbToPromise(Emulation.virtualTimeBudgetExpired);

                await this.profileScope('Wait for load', async () => {
                    await loaded;
                });

                await this.profileScope('Wait for js execution', async () => {
                    await jsDone;
                });

                const pdf = await Page.printToPDF(options);
                fs.writeFileSync(pdfFile, Buffer.from(pdf.data, 'base64'));
                this.log(`Saved ${pdfFile}`);
                client.close();
                resolve();
            });
        });
    }

    error(...msg) {
        if (this.options.printErrors) {
            console.error(...msg);
        }
    }

    log(...msg) {
        if (this.options.printLogs) {
            console.log(...msg);
        }
    }

    async cbToPromise(cb) {
        return new Promise((resolve) => {
            cb((resp) => {
                resolve(resp);
            })
        });
    }

    getPerfTime(prev) {
        const time = process.hrtime(prev);
        return time[0] * 1e3 + time[1] / 1e6;
    }

    async profileScope(msg, cb) {
        const start = process.hrtime();
        await cb();
        this.log(msg, `took ${Math.round(this.getPerfTime(start))}ms`);
    }

    browserLog(type, msg) {
        const lines = msg.split('\n');
        for (const line of lines) {
            this.log(`(chrome) (${type}) ${line}`);
        }
    }

    spawnChrome() {
        this.log('Starting chrome');
        this.chrome = cp.exec(`google-chrome-unstable --headless --remote-debugging-port=${this.port} --disable-gpu`, (err, stdout, stderr) => {
            this.browserLog('out', stdout);
            this.browserLog('err', stderr);
        });
        this.chrome.on('exit', () => {
            this.log('Chrome stopped');
        })
    }

    killChrome() {
        this.chrome.kill(cp.SIGKILL)
    }

    async waitForDebugPort() {
        this.log('Waiting for chrome to became available');
        while (true) {
            try {
                await this.isPortOpen('localhost', this.port);
                this.log('Connected!');
                return;
            } catch (e) {
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

module.exports = RenderPDF;
