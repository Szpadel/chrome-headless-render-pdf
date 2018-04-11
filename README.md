This tool require Google Chrome installed in version >59 to work, 
but latest version is recommended.

# Usage: 
```
chrome-headless-render-pdf [OPTIONS] --url=URL --pdf=OUTPUT-FILE [--url=URL2 --pdf=OUTPUT-FILE2] ...
  Options:
    --help                   this screen
    --url                    url to load, for local files use: file:///path/to/file
    --pdf                    output for generated file can be relative to current directory
    --chrome-binary          set chrome location (use this options when autodetection fail)
    --chrome-option          set chrome option, can be used multiple times, e.g. --chrome-option=--no-sandbox
    --no-margins             disable default 1cm margins
    --include-background     include elements background
    --landscape              generate pdf in landscape orientation
    --window-size            specify window size, width(,x*)height (e.g. --window-size 1600,1200 or --window-size 1600x1200)
    --paper-width            specify page width in inches (defaults to 8.5 inches)
    --paper-height           specify page height in inches (defaults to 11 inches)
    --page-ranges            specify pages to render default all pages,  e.g. 1-5, 8, 11-13

  Example:
    Render single pdf file
      chrome-headless-render-pdf --url http://google.com --pdf test.pdf
    Render pdf from local file
      chrome-headless-render-pdf --url file:///tmp/example.html --pdf test.pdf
    Render multiple pdf files
      chrome-headless-render-pdf --url http://google.com --pdf test.pdf --url file:///tmp/example.html --pdf test.pdf
```

# This tool can be also used programmatically:
```
const RenderPDF = require('chrome-headless-render-pdf');
RenderPDF.generateSinglePdf('http://google.com', 'outputPdf.pdf'});
```

```
const RenderPDF = require('chrome-headless-render-pdf');
RenderPDF.generateMultiplePdf([
    {'http://google.com', 'outputPdf.pdf'},
    {'http://example.com', 'outputPdf2.pdf'}
]);
```

```
const RenderPDF = require('chrome-headless-render-pdf');
RenderPDF.generatePdfBuffer('http://google.com')
    .then((pdfBuffer) => {
      console.log(pdfBuffer);
    });
```

# you can also use it from typescript or es6
```
import RenderPDF from 'chrome-headless-render-pdf';
RenderPDF.generateSinglePdf('http://google.com', 'outputPdf.pdf'});
```

# Motivation
google-chrome currently have option to render pdf files when used with headless option. 
But this option contains hardcoded adding header and footer to page rendering it unusable for pdf generation.
This module allows to generate it without those elements.
