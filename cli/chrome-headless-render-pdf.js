#!/usr/bin/env node

const updateNotifier = require('update-notifier');
let pkg;
try {
    pkg = require('../package.json');
} catch (e) {
    pkg = require('../../package.json');
}

updateNotifier({pkg}).notify();

const RenderPDF = require('../index');
const argv = require('minimist')(process.argv.slice(2), {
    string: [
        'url',
        'pdf',
        'chrome-binary',
        'chrome-option',
        'remote-host',
        'remote-port',
        'window-size',
        'paper-width',
        'paper-height',
        'page-ranges'
    ],
    boolean: [
        'no-margins',
        'include-background',
        'landscape '
    ]
});

if (argv['help'] || !argv['pdf'] || !argv['url']) {
    printHelp();
    process.exit(2);
}

const urls = typeof argv['url'] === 'string' ? [argv['url']] : argv['url'];
const pdfs = typeof argv['pdf'] === 'string' ? [argv['pdf']] : argv['pdf'];

let windowSize;
if (typeof argv['window-size'] === 'string') {
    windowSize = argv['window-size'].match(/^([0-9]+)[,x*]([0-9]+)$/);
    if (windowSize === null) {
      console.error('ERROR: Missing or bad input for --window-size \n');
      printHelp();
      process.exit(1);
    }
    windowSize = windowSize.splice(1,3);
}


if (pdfs.length !== urls.length) {
    console.error('ERROR: Unpaired --url or --pdf found\n');
    printHelp();
    process.exit(1);
}

let chromeBinary = null;
if (typeof argv['chrome-binary'] === 'string') {
    chromeBinary = argv['chrome-binary'];
}

let chromeOptions = undefined;
if (Array.isArray(argv['chrome-option'])) {
  chromeOptions = argv['chrome-option'];
} else if (typeof argv['chrome-option'] === 'string') {
  chromeOptions = [argv['chrome-option']];
}

let [remoteHost, remotePort] = [undefined, undefined];
if (typeof argv['remote-host'] === 'string') {
    remoteHost = argv['remote-host'];
}
if (typeof argv['remote-port'] === 'string') {
    remotePort = argv['remote-port'];
}

let paperWidth = undefined;
if (typeof argv['paper-width'] === 'string') {
    paperWidth = argv['paper-width'];
}

let paperHeight = undefined;
if (typeof argv['paper-height'] === 'string') {
    paperHeight = argv['paper-height'];
}

let landscape;
if (argv['landscape']) {
    landscape = true;
}

let noMargins;
if (argv['margins'] !== undefined) {
    noMargins = !argv['margins'];
}

let includeBackground;
if (argv['include-background']) {
    includeBackground = true;
}

let pageRanges;
if(typeof argv['page-ranges'] === 'string') {
    pageRanges = argv['page-ranges'];
}

(async () => {
    try {
        const jobs = generateJobList(urls, pdfs);
        await RenderPDF.generateMultiplePdf(jobs, {
            printLogs: true,
            landscape,
            noMargins,
            includeBackground,
            chromeBinary,
            chromeOptions,
            remoteHost,
            remotePort,
            windowSize,
            paperWidth,
            paperHeight,
            pageRanges,
        });
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
    process.exit();
})();


function generateJobList(urls, pdfs) {
    const jobs = [];
    for (let j = 0; j < urls.length; j++) {
        jobs.push({
            url: urls[j],
            pdf: pdfs[j]
        });
    }
    return jobs;
}

function printHelp() {
    console.log('chrome-headless-render-pdf [OPTIONS] --url=URL --pdf=OUTPUT-FILE [--url=URL2 --pdf=OUTPUT-FILE2] ...');
    console.log('  Options:');
    console.log('    --help                   this screen');
    console.log('    --url                    url to load, for local files use: file:///path/to/file');
    console.log('    --pdf                    output for generated file can be relative to current directory');
    console.log('    --chrome-binary          set chrome location (use this options when autodetection fail)');
    console.log('    --chrome-option          set chrome option, can be used multiple times, e.g. --chrome-option=--no-sandbox');
    console.log('    --remote-host            set chrome host (for remote process)');
    console.log('    --remote-port            set chrome port (for remote process)');
    console.log('    --no-margins             disable default 1cm margins');
    console.log('    --include-background     include elements background');
    console.log('    --landscape              generate pdf in landscape orientation');
    console.log('    --window-size            specify window size, width(,x*)height (e.g. --window-size 1600,1200 or --window-size 1600x1200)');
    console.log('    --paper-width            specify page width in inches (defaults to 8.5 inches)');
    console.log('    --paper-height           specify page height in inches (defaults to 11 inches)');
    console.log('    --page-ranges            specify pages to render default all pages,  e.g. 1-5, 8, 11-13');
    console.log('');
    console.log('  Example:');
    console.log('    Render single pdf file');
    console.log('      chrome-headless-render-pdf --url http://google.com --pdf test.pdf');
    console.log('    Render pdf from local file');
    console.log('      chrome-headless-render-pdf --url file:///tmp/example.html --pdf test.pdf');
    console.log('    Render multiple pdf files');
    console.log('      chrome-headless-render-pdf --url http://google.com --pdf test.pdf --url file:///tmp/example.html --pdf test.pdf');
}
