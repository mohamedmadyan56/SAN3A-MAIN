// Open this HTML file in your browser and press Ctrl+P → Save as PDF
// Or run: npx puppeteer-core scripts/convert-to-pdf.js
// Or use: xdg-open SAN3A_CODE_ANALYSIS_REPORT.html

const fs = require('fs');
const html = fs.readFileSync('SAN3A_CODE_ANALYSIS_REPORT.html', 'utf8');
console.log('📄 HTML Report Ready!');
console.log('📁 Location: SAN3A_CODE_ANALYSIS_REPORT.html');
console.log('');
console.log('To convert to PDF:');
console.log('1. Open the HTML file in your browser');
console.log('2. Press Ctrl+P');
console.log('3. Choose "Save as PDF" as destination');
console.log('4. Set margins to "None" for best result');
console.log('5. Enable "Background graphics" for colors');
