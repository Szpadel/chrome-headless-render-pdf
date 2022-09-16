
# Usage:
```
chrome-headless-render-pdf [OPTIONS] --url=URL --pdf=OUTPUT-FILE [--url=URL2 --pdf=OUTPUT-FILE2] ...
  Options:
    --help                   this screen
    --url                    url to load, for local files use: file:///path/to/file
    --pdf                    output for generated file can be relative to current directory
    --chrome-binary          set chrome location (use this options when autodetection fail)
    --chrome-option          set chrome option, can be used multiple times, e.g. --chrome-option=--no-sandbox
    --remote-host            set chrome host (for remote process)
    --remote-port            set chrome port (for remote process)
    --no-margins             disable default 1cm margins
    --include-background     include elements background
    --landscape              generate pdf in landscape orientation
    --window-size            specify window size, width(,x*)height (e.g. --window-size 1600,1200 or --window-size 1600x1200)
    --paper-width            specify page width in inches (defaults to 8.5 inches)
    --paper-height           specify page height in inches (defaults to 11 inches)
    --page-ranges            specify pages to render default all pages,  e.g. 1-5, 8, 11-13
    --scale                  specify scale of the webpage rendering (defaults to 1)
    --display-header-footer  display text headers and footers
    --header-template        HTML template for the header. Inject variables using the classes "date", "title", "url", "pageNumber" or "totalPages"
    --footerTemplate         HTML template for the footer. Inject variables using the classes "date", "title", "url", "pageNumber" or "totalPages"
    --js-time-budget         Virtual time budget in ms to wait for js execution (default 5000)
    --animation-time-budget  Time budget in ms to wait for in progress animations to finish (default 5000)

  Example:
    Render single pdf file
      chrome-headless-render-pdf --url http://google.com --pdf test.pdf
    Render pdf from local file
      chrome-headless-render-pdf --url file:///tmp/example.html --pdf test.pdf
    Render multiple pdf files
      chrome-headless-render-pdf --url http://google.com --pdf test.pdf --url file:///tmp/example.html --pdf test2.pdf
    Render pdf with custom footer and no header (styles are mandatory)
      chrome-headless-render-pdf --url file:///tmp/example.html --pdf test.pdf --display-header-footer --header-template ' ' --footer-template '<style type="text/css">.footer{font-size:8px;width:100%;text-align:center;color:#000;padding-left:0.65cm;}</style><div class="footer"><span class="pageNumber"></span> / <span class="totalPages"></span></div>'
```

# This tool can be also used programmatically:
```
const RenderPDF = require('chrome-headless-render-pdf');
RenderPDF.generateSinglePdf('http://google.com', 'outputPdf.pdf');
```

```
const RenderPDF = require('chrome-headless-render-pdf');
RenderPDF.generateMultiplePdf([
    {url: 'http://google.com', pdf: 'outputPdf.pdf'},
    {utl: 'http://example.com', pdf: 'outputPdf2.pdf'}
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
RenderPDF.generateSinglePdf('http://google.com', 'outputPdf.pdf');
```

# Motivation
google-chrome currently have option to render pdf files when used with headless option.
But this option contains hardcoded adding header and footer to page rendering it unusable for pdf generation.
This module allows to generate it without those elements.
