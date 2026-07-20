import puppeteer from 'puppeteer';

export async function generatePdf(html: string, options: { width?: string, height?: string, printBackground?: boolean, margin?: { top?: string, right?: string, bottom?: string, left?: string } } = {}) {

    let browser: any = null;
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.setContent(html);

        // 6. Force wait loop until the browser processes all inline Data URI weights completely
        await page.evaluate(async () => {
            await document.fonts.ready;
        });
        const pdfUint8Array: Uint8Array = await page.pdf(options);
        return {success: true, pdf: pdfUint8Array};
    } catch (error: unknown) {
        console.log('Error generating PDF:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown PDF generation error' }
    } finally {
        if (browser !== null) {
            await browser.close();
        }
    }
}