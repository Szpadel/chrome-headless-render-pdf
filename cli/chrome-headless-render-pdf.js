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
        'window-size'
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

(async () => {
    try {
        const jobs = generateJobList(urls, pdfs);
        await RenderPDF.generateMultiplePdf(jobs, {
            printLogs: true,
            landscape,
            noMargins,
            includeBackground,
            chromeBinary,
            windowSize
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
    console.log('    --no-margins             disable default 1cm margins');
    console.log('    --include-background     include elements background');
    console.log('    --landscape              generate pdf in landscape orientation');
    console.log('    --window-size            specify window size, width(,x*)height (e.g. --window-size 1600,1200 or --window-size 1600x1200)');
    console.log('');
    console.log('  Example:');
    console.log('    Render single pdf file');
    console.log('      chrome-headless-render-pdf --url http://google.com --pdf test.pdf');
    console.log('    Render pdf from local file');
    console.log('      chrome-headless-render-pdf --url file:///tmp/example.html --pdf test.pdf');
    console.log('    Render multiple pdf files');
    console.log('      chrome-headless-render-pdf --url http://google.com --pdf test.pdf --url file:///tmp/example.html --pdf test.pdf');
}
