import path from "path";
import fs from "node:fs/promises"; 

export async function generatePdfHtmlFrame(finalHtml: string) {
    const projectRoot = process.cwd();
    const assetsDir = path.join(projectRoot, './assets')
    const tailwindCSS = await fs.readFile(path.join(assetsDir, 'tailwind.min.css'), 'utf8')
    const allFiles = await fs.readdir(assetsDir)
    const fontFiles = allFiles.filter(file => file.endsWith('.woff2') && file.includes('inter-tight'))

    let dynamicFontCSS = ''
    for (const fileName of fontFiles) {
      const weightMatch = fileName.match(/-(\d+)\.woff2$/)
      let weight = '400' 
      if (weightMatch && weightMatch[1]) {
        weight = weightMatch[1]
      } else if (fileName.includes('regular')) {
        weight = '400'
      }

      const fontBuffer = await fs.readFile(path.join(assetsDir, fileName))
      const base64Font = fontBuffer.toString('base64')

      dynamicFontCSS += `
        @font-face {
          font-family: 'InterTightLocal';
          src: url('data:font/woff2;base64,${base64Font}') format('woff2');
          font-weight: ${weight};
          font-style: normal;
        }
      `;
    }

    const customStyles = `
      ${dynamicFontCSS}
      
      .font-sans, body {
        font-family: 'InterTightLocal', sans-serif !important;
      }
      
      ${tailwindCSS}
    `

  return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <style>${customStyles}</style>
      </head>
      <body class="bg-white font-sans antialiased m-0">
        ${finalHtml}
      </body>
      </html>
    `;
}