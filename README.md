# This tool require Google Chrome installed in version min 59 to work!

# Ussage: 
```
chrome-headless-render-pdf [OPTIONS] --url=URL --pdf=OUTPUT-FILE [--url=URL2 --pdf=OUTPUT-FILE2] ...
  Options:
    --help               this screen
    --url                url to load, for local files use: file:///path/to/file
    --pdf                output for generated file can be relative to current directory
    --chrome-binary      set chrome location (use this options when autodetection fail)

  Example:
    Render single pdf file
      chrome-headless-render-pdf --url http://google.com --pdf test.pdf
    Render pdf from local file
      chrome-headless-render-pdf --url file:///tmp/example.html --pdf test.pdf
    Render multiple pdf files
      chrome-headless-render-pdf --url http://google.com --pdf test.pdf --url file:///tmp/example.html --pdf test.pdf
```

# This tool can be also used pragmatically:
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
# Motivation
google-chrome currently have option to render pdf files when used with headless option. 
But this option contains hardcoded adding header and footer to page rendering it unusable for pdf generation.
This module allows to generate it without those elements.
