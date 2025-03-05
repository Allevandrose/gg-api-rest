const db = require('../config/db');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const sendEmail = require('../utils/emailService');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

exports.processPayment = async (req, res) => {
    try {
        // Extract request data
        const { event_id, amount, stripeToken } = req.body;
        const user_id = req.user.id;

        console.log("Received Payment Request:", { event_id, amount, stripeToken });

        // Validate required fields
        if (!stripeToken) {
            return res.status(400).json({ error: "Payment token (stripeToken) is missing" });
        }
        if (!amount || isNaN(amount)) {
            return res.status(400).json({ error: "Invalid amount. Amount must be a number." });
        }

        // Convert amount to cents
        const amountInCents = Math.round(amount * 100);

        // Process Stripe payment
        const charge = await stripe.charges.create({
            amount: amountInCents,
            currency: 'usd',
            source: stripeToken,
            description: 'Event Booking Payment'
        });

        console.log("Stripe Charge Successful:", charge);

        // Insert payment record into the database
        await db.execute(
            'INSERT INTO payments (user_id, event_id, transaction_code, amount) VALUES (?, ?, ?, ?)',
            [user_id, event_id, charge.id, amount]
        );

        // Fetch event name
        const [event] = await db.execute('SELECT name FROM events WHERE id = ?', [event_id]);
        if (!event.length) {
            return res.status(404).json({ error: "Event not found" });
        }

        // Ensure the 'uploads/tickets' directory exists
        const ticketsDir = path.join(__dirname, '../uploads/tickets');
        if (!fs.existsSync(ticketsDir)) {
            fs.mkdirSync(ticketsDir, { recursive: true });
        }

        // Generate a ticket PDF
        const ticketPath = path.join(ticketsDir, `ticket-${charge.id}.pdf`);
        const doc = new PDFDocument();
        doc.pipe(fs.createWriteStream(ticketPath));
        doc.text(`Ticket for ${event[0].name}\nTransaction: ${charge.id}\nAmount: $${amount}`);
        doc.end();

        // Fetch user email
        const [user] = await db.execute('SELECT email FROM users WHERE id = ?', [user_id]);
        if (!user.length) {
            return res.status(404).json({ error: "User not found" });
        }

        // Send confirmation email with ticket download link
        await sendEmail(
            user[0].email,
            'Payment Confirmation',
            `Payment successful! Amount: $${amount}`,
            `<p>Payment successful! Amount: $${amount}</p>
             <p>Download your ticket <a href="/tickets/ticket-${charge.id}.pdf">here</a></p>`
        );

        res.status(200).json({ message: 'Payment successful', charge, ticketPath });
    } catch (error) {
        console.error("Payment Error:", error);
        res.status(500).json({ error: error.message || 'Payment failed' });
    }
};

// Fetch all payments (Admin only)
exports.getAllPayments = async (req, res) => {
    try {
        const [payments] = await db.execute('SELECT * FROM payments');
        res.status(200).json(payments);
    } catch (error) {
        console.error("Error Fetching Payments:", error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Fetch user-specific payments
exports.getUserPayments = async (req, res) => {
    try {
        const user_id = req.user.id;
        const [payments] = await db.execute('SELECT * FROM payments WHERE user_id = ?', [user_id]);
        res.status(200).json(payments);
    } catch (error) {
        console.error("Error Fetching User Payments:", error);
        res.status(500).json({ error: 'Server error' });
    }
};
