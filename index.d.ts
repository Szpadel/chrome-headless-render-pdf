interface IRenderPdfOptions {
    printLogs?: boolean;
    printErrors?: boolean;
    chromeBinary?: string;
    chromeOptions?: string[];
    remoteHost?: string;
    remotePort?: string;
    noMargins?: boolean;
    landscape?: boolean;
    includeBackground?: boolean;
    windowSize?: boolean;
    paperWidth?: string;
    paperHeight?: string;
    pageRanges?: string;
    scale?: number;
}

interface IJobPair {
    url: string;
    pdf: string;
}

export default class RenderPDF {
    static generateSinglePdf(url: string, filename: string, options?: IRenderPdfOptions): Promise<void>;
    static generateMultiplePdf(pairs: IJobPair[], options?: IRenderPdfOptions): Promise<void>;
    static generatePdfBuffer(url: string, options?: IRenderPdfOptions): Promise<Buffer>;
}
