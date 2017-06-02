const RenderPDF = require('../index');
const argv = require('minimist')(process.argv.slice(2));

if (argv['help'] || !argv['pdf'] || !argv['url']) {
    printHelp();
    process.exit();
}

const urls = typeof argv['url'] === 'string' ? [argv['url']] : argv['url'];
const pdfs = typeof argv['pdf'] === 'string'? [argv['pdf']] : argv['pdf'];

if (pdfs.length !== urls.length) {
    console.error('ERROR: Unpaired --url or --pdf found\n');
    printHelp();
    process.exit();
}

const jobs = generateJobList(urls, pdfs);
RenderPDF.generateMultiplePdf(jobs, {
    printLogs: true
});

function generateJobList(urls, pdfs) {
    const jobs = [];
    for(let j =0; j < urls.length; j++) {
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
    console.log('    --help         this screen');
    console.log('    --url          url to load, for local files use: file:///path/to/file');
    console.log('    --pdf          output for generated file can be relative to current directory');
    console.log('');
    console.log('  Example:');
    console.log('    Render single pdf file');
    console.log('      chrome-headless-render-pdf --url http://google.com --pdf test.pdf');
    console.log('    Render pdf from local file');
    console.log('      chrome-headless-render-pdf --url file:///tmp/example.html --pdf test.pdf');
    console.log('    Render multiple pdf files');
    console.log('      chrome-headless-render-pdf --url http://google.com --pdf test.pdf --url file:///tmp/example.html --pdf test.pdf');
}
