const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const QRCode = require("qrcode");

const generateTicket = async (eventName, transactionCode, amount, user, eventDate, venue) => {
  const doc = new PDFDocument({ layout: "landscape", size: "A6" });

  const ticketsDir = path.join(__dirname, "../uploads/tickets");
  const ticketPath = path.join(ticketsDir, `ticket-${transactionCode}.pdf`);

  if (!fs.existsSync(ticketsDir)) {
    fs.mkdirSync(ticketsDir, { recursive: true });
  }

  const qrData = `Event: ${eventName}\nTransaction: ${transactionCode}\nUser: ${user.email}`;
  const qrPath = path.join(ticketsDir, `qr-${transactionCode}.png`);
  await QRCode.toFile(qrPath, qrData);

  doc.pipe(fs.createWriteStream(ticketPath));

  doc.rect(0, 0, doc.page.width, doc.page.height).fill("#f3f4f6");

  doc
    .font("Helvetica-Bold")
    .fontSize(18)
    .fill("#1e3a8a")
    .text("EVENT TICKET", 50, 30, { align: "center" });

  doc
    .font("Helvetica")
    .fontSize(12)
    .fill("#333")
    .text(`Event: ${eventName}`, 30, 70)
    .text(`Date: ${new Date(eventDate).toLocaleDateString()}`, 30, 90)
    .text(`Venue: ${venue}`, 30, 110)
    .text(`Price: $${amount}`, 30, 130);

  doc.image(qrPath, 200, 60, { width: 120, align: "right" }).text(
    "Scan for verification",
    200,
    190,
    { width: 120, align: "center" }
  );

  doc
    .fontSize(10)
    .fill("#555")
    .text(`Issued to: ${user.name}`, 30, 160)
    .text(`Email: ${user.email}`, 30, 175);

  doc
    .rect(0, doc.page.height - 40, doc.page.width, 40)
    .fill("#1e3a8a");
  doc
    .fontSize(10)
    .fill("white")
    .text("Thank you for your purchase!", 50, doc.page.height - 30);

  doc.end();

  // Clean up QR code file
  fs.unlink(qrPath, (err) => {
    if (err) console.error("Error deleting QR file:", err);
  });

  return ticketPath;
};

module.exports = generateTicket;