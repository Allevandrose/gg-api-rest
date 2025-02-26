const PDFDocument = require('pdfkit');
const fs = require('fs');

const generateTicket = (eventName, transactionCode, amount, outputPath) => {
    const doc = new PDFDocument();
    doc.pipe(fs.createWriteStream(outputPath));
    doc.text(`Ticket for ${eventName}\nTransaction: ${transactionCode}\nAmount: $${amount}`);
    doc.end();
};

module.exports = generateTicket;