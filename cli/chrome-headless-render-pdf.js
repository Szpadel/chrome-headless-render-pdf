#!/usr/bin/env node

const updateNotifier = require('update-notifier');
let pkg;
try {
    pkg = require('../package.json');
} catch (e) {
    pkg = require('../../package.json');
}
const fs = require('fs');
const os = require('os');

updateNotifier({pkg}).notify();

const RenderPDF = require('../index');
const argv = require('minimist')(process.argv.slice(2), {
    string: [
        'url',
        'pdf',
        'chrome-binary',
        'chrome-flags-file'
    ],
    boolean: [
        'no-margins',
        'include-background',
        'landscape '
    ]
});

if (argv['help'] || !argv['pdf'] || !argv['url']) {
    printHelp();
    process.exit();
}

const urls = typeof argv['url'] === 'string' ? [argv['url']] : argv['url'];
const pdfs = typeof argv['pdf'] === 'string' ? [argv['pdf']] : argv['pdf'];

if (pdfs.length !== urls.length) {
    console.error('ERROR: Unpaired --url or --pdf found\n');
    printHelp();
    process.exit();
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

let extraArgs = [];
if (typeof argv['chrome-flags-file'] === 'string') {
    var chromeFlagsFile = argv['chrome-flags-file'];
 
    console.log('Flags file', chromeFlagsFile);

    fs.readFile(chromeFlagsFile, 'UTF-8', function (err,data) {
        console.log(data);
        data.split(os.EOL).forEach(function(line) {
            if(line.trim().length > 0) {
                extraArgs.push(line.trim());
            }
        });
        startJobs();
    });
} else {
    startJobs();
}

function startJobs() {
    (async () => {
        try {
            const jobs = generateJobList(urls, pdfs);
            await RenderPDF.generateMultiplePdf(jobs, {
                printLogs: true,
                landscape,
                noMargins,
                includeBackground,
                chromeBinary,
                extraArgs
            });
        } catch (e) {
            console.error(e);
        } finally {
            process.exit();
        }
    })();
}

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
    console.log('    --chrome-flags-file      pass line delimited flags from file directly to chrome');
    console.log('');
    console.log('  Example:');
    console.log('    Render single pdf file');
    console.log('      chrome-headless-render-pdf --url http://google.com --pdf test.pdf');
    console.log('    Render pdf from local file');
    console.log('      chrome-headless-render-pdf --url file:///tmp/example.html --pdf test.pdf');
    console.log('    Render multiple pdf files');
    console.log('      chrome-headless-render-pdf --url http://google.com --pdf test.pdf --url file:///tmp/example.html --pdf test.pdf');
    console.log('    Pass line delimited flags from file directly to chrome');
    console.log('      chrome-headless-render-pdf --chrome-flags-file chrome.flags --url http://google.com --pdf test.pdf');
}
