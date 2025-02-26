const db = require('../config/db');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const sendEmail = require('../utils/emailService');
const PDFDocument = require('pdfkit');
const fs = require('fs');

exports.processPayment = async (req, res) => {
    try {
        const { event_id, amount, stripeToken } = req.body;
        const user_id = req.user.id;

        const charge = await stripe.charges.create({
            amount: amount * 100, // Convert to cents
            currency: 'usd',
            source: stripeToken,
            description: 'Event Booking Payment'
        });

        await db.execute(
            'INSERT INTO payments (user_id, event_id, transaction_code, amount) VALUES (?, ?, ?, ?)',
            [user_id, event_id, charge.id, amount]
        );

        const [event] = await db.execute('SELECT name FROM events WHERE id = ?', [event_id]);
        const doc = new PDFDocument();
        doc.text(`Ticket for ${event[0].name}\nTransaction: ${charge.id}\nAmount: $${amount}`);
        const ticketPath = `./uploads/tickets/ticket-${charge.id}.pdf`;
        doc.pipe(fs.createWriteStream(ticketPath));
        doc.end();

        const [user] = await db.execute('SELECT email FROM users WHERE id = ?', [user_id]);
        await sendEmail(user[0].email, 'Payment Confirmation', `Payment successful! Amount: $${amount}`, `<p>Payment successful! Amount: $${amount}</p><p>Download your ticket <a href="ticket-${charge.id}.pdf">here</a></p>`);

        res.status(200).json({ message: 'Payment successful', charge });
    } catch (error) {
        res.status(500).json({ error: 'Payment failed' });
    }
};

exports.getAllPayments = async (req, res) => {
    try {
        const [payments] = await db.execute('SELECT * FROM payments');
        res.status(200).json(payments);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getUserPayments = async (req, res) => {
    try {
        const user_id = req.user.id;
        const [payments] = await db.execute('SELECT * FROM payments WHERE user_id = ?', [user_id]);
        res.status(200).json(payments);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};