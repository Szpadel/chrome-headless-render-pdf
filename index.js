const CDP = require('chrome-remote-interface');
const fs = require('fs');
const cp = require('child_process');
const net = require('net');
const commandExists = require('command-exists');

class RenderPDF {
    constructor(options) {
        this.setOptions(options || {});
        this.chrome = null;
        this.port = Math.floor(Math.random() * 10000 + 1000);
    }

    setOptions(options) {
        this.options = {
            printLogs: def('printLogs', false),
            printErrors: def('printErrors', true),
            chromeBinary: def('chromeBinary', null),
            chromeOptions: def('chromeOptions', []),
            noMargins: def('noMargins', false),
            landscape: def('landscape', undefined),
            paperWidth: def('paperWidth', undefined),
            paperHeight: def('paperHeight', undefined),
            includeBackground: def('includeBackground', undefined)
        };

        this.commandLineOptions = {
            windowSize: def('windowSize', undefined),
        };

        function def(key, defaultValue) {
            return options[key] === undefined ? defaultValue : options[key];
        }
    }

    static async generateSinglePdf(url, filename, options) {
        const renderer = new RenderPDF(options);
        await renderer.spawnChrome();
        await renderer.waitForDebugPort();
        try {
            const buff = await renderer.renderPdf(url, renderer.generatePdfOptions());
            fs.writeFileSync(filename, buff);
            renderer.log(`Saved ${filename}`);
        } catch (e) {
            renderer.error('error:', e);
        }
        renderer.killChrome();
    }

    static async generatePdfBuffer(url, options) {
        const renderer = new RenderPDF(options);
        await renderer.spawnChrome();
        await renderer.waitForDebugPort();
        try {
            return renderer.renderPdf(url, renderer.generatePdfOptions());
        } catch (e) {
            renderer.error('error:', e);
        } finally {
            renderer.killChrome();
        }
    }

    static async generateMultiplePdf(pairs, options) {
        const renderer = new RenderPDF(options);
        await renderer.spawnChrome();
        await renderer.waitForDebugPort();
        for (const job of pairs) {
            try {
                const buff = await renderer.renderPdf(job.url, renderer.generatePdfOptions());
                fs.writeFileSync(job.pdf, buff);
                renderer.log(`Saved ${job.pdf}`);
            } catch (e) {
                renderer.error('error:', e);
            }
        }
        renderer.killChrome();
    }

    async renderPdf(url, options) {
        return new Promise((resolve) => {
            CDP({port: this.port}, async (client) => {
                this.log(`Opening ${url}`);
                const {Page, Emulation, LayerTree} = client;
                await Page.enable();
                await LayerTree.enable();

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

                await this.profileScope('Wait for animations', async () => {
                    await new Promise((resolve) => {
                        setTimeout(resolve, 5000); // max waiting time
                        let timeout = setTimeout(resolve, 100);
                        LayerTree.layerPainted(() => {
                            clearTimeout(timeout);
                            timeout = setTimeout(resolve, 100);
                        });
                    });
                });


                const pdf = await Page.printToPDF(options);
                const buff = Buffer.from(pdf.data, 'base64');
                client.close();
                resolve(buff);
            });
        });
    }

    generatePdfOptions() {
        const options = {};
        if (this.options.landscape !== undefined) {
            options.landscape = !!this.options.landscape;
        }

        if (this.options.noMargins) {
            options.marginTop = 0;
            options.marginBottom = 0;
            options.marginLeft = 0;
            options.marginRight = 0;
        }

        if (this.options.includeBackground !== undefined) {
            options.printBackground = !!this.options.includeBackground;
        }

        if(this.options.paperWidth !== undefined) {
            options.paperWidth = parseFloat(this.options.paperWidth);
        }

        if(this.options.paperHeight !== undefined) {
            options.paperHeight = parseFloat(this.options.paperHeight);
        }
        return options;
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

    async spawnChrome() {
        const chromeExec = this.options.chromeBinary || await this.detectChrome();
        this.log('Using', chromeExec);
        const commandLineOptions = [
             '--headless',
             `--remote-debugging-port=${this.port}`,
             '--disable-gpu',
             ...this.options.chromeOptions
            ];

        if (this.commandLineOptions.windowSize !== undefined ) {
          commandLineOptions.push(`--window-size=${this.commandLineOptions.windowSize[0]},${this.commandLineOptions.windowSize[1]}`);

        }
        this.chrome = cp.spawn(
            chromeExec,
            commandLineOptions
        );
        this.chrome.on('close', (code) => {
            this.log(`Chrome stopped (${code})`);
            this.browserLog('out', this.chrome.stdout.toString());
            this.browserLog('err', this.chrome.stderr.toString());
        });
    }

    async isCommandExists(cmd) {
        return new Promise((resolve, reject) => {
            commandExists(cmd, (err, exists) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(exists);
                }
            })
        });
    }

    async detectChrome() {
        if (await this.isCommandExists('google-chrome-unstable')) {
            return 'google-chrome-unstable';
        }
        if (await this.isCommandExists('google-chrome-beta')) {
            return 'google-chrome-beta';
        }
        if (await this.isCommandExists('google-stable')) {
            return 'google-stable';
        }
        if (await this.isCommandExists('google-chrome')) {
            return 'google-chrome';
        }
        if (await this.isCommandExists('chromium')) {
            return 'chromium';
        }
        // windows
        if (await this.isCommandExists('chrome')) {
            return 'chrome';
        }
        // macos
        if (await this.isCommandExists('/Applications/Google\ Chrome\ Canary.app/Contents/MacOS/Google\ Chrome')) {
            return '/Applications/Google\ Chrome\ Canary.app/Contents/MacOS/Google\ Chrome';
        }
        if (await this.isCommandExists('/Applications/Google\ Chrome\ Dev.app/Contents/MacOS/Google\ Chrome')) {
            return '/Applications/Google\ Chrome\ Dev.app/Contents/MacOS/Google\ Chrome';
        }
        if (await this.isCommandExists('/Applications/Google\ Chrome\ Beta.app/Contents/MacOS/Google\ Chrome')) {
            return '/Applications/Google\ Chrome\ Beta.app/Contents/MacOS/Google\ Chrome';
        }
        if (await this.isCommandExists('/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome')) {
            return '/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome';
        }
        throw Error('Couldn\'t detect chrome version installed! use --chrome-binary to pass custom location');
    }

    killChrome() {
        this.chrome.kill(cp.SIGKILL);
    }

    async waitForDebugPort() {
        this.log('Waiting for chrome to became available');
        while (true) {
            try {
                await this.isPortOpen('localhost', this.port);
                this.log('Connected!');
                await this.checkChromeVersion();
                return;
            } catch (e) {
                await this.wait(10);
            }
        }
    }

    async checkChromeVersion() {
        return new Promise((resolve) => {
            CDP({port: this.port}, async (client) => {
                const {Browser} = client;
                const version = await Browser.getVersion();
                if(version.product.search('/64.') !== -1) {
                    console.error('     ===== WARNING =====');
                    console.error('  Detected Chrome in version 64.x');
                    console.error('  This version is known to contain bug in remote api that prevents this tool to work');
                    console.error('  This issue is resolved in version 65');
                    console.error('  More info: https://github.com/Szpadel/chrome-headless-render-pdf/issues/22');
                }
                resolve();
            });
        });
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
module.exports.default = RenderPDF;
