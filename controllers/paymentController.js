const db = require("../config/db");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const sendEmail = require("../utils/emailService");
const generateTicket = require("../utils/ticketGenerator");

// ✅ Process Payment (Step 1)
const processPayment = async (req, res) => {
  try {
    const { event_id, amount, paymentMethodId } = req.body;
    const user_id = req.user.id;

    if (!paymentMethodId) return res.status(400).json({ error: "Payment method ID is missing" });
    if (!amount || isNaN(amount)) return res.status(400).json({ error: "Invalid amount" });

    const amountInCents = Math.round(amount * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "usd",
      payment_method: paymentMethodId,
      automatic_payment_methods: { enabled: true },
      metadata: { event_id, user_id },
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      requiresAction: paymentIntent.status === "requires_action",
    });
  } catch (error) {
    console.error("Payment Error:", error);
    res.status(500).json({ error: error.message || "Payment failed" });
  }
};

// ✅ Confirm Payment (Step 2)
const confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId, generateTicketFlag = true } = req.body; // Add a flag to make ticket generation optional
    const user_id = req.user.id;

    if (!paymentIntentId) return res.status(400).json({ error: "Payment Intent ID is missing" });

    const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      return res.status(400).json({ error: "Payment confirmation failed." });
    }

    console.log("✅ Payment Confirmed:", paymentIntent.id);

    // Store payment in the database
    await db.execute(
      "INSERT INTO payments (user_id, event_id, transaction_code, amount) VALUES (?, ?, ?, ?)",
      [user_id, paymentIntent.metadata.event_id, paymentIntent.id, paymentIntent.amount / 100]
    );

    // Fetch event details
    const [event] = await db.execute("SELECT name, date, venue FROM events WHERE id = ?", [
      paymentIntent.metadata.event_id,
    ]);
    if (!event.length) return res.status(404).json({ error: "Event not found" });

    // Fetch user details
    const [user] = await db.execute("SELECT name, email FROM users WHERE id = ?", [user_id]);
    if (!user.length) return res.status(404).json({ error: "User not found" });

    // Send confirmation email
    try {
      await sendEmail(
        user[0].email,
        "Payment Confirmation",
        `Payment successful! Amount: $${paymentIntent.amount / 100}`,
        `<p>Payment successful! Amount: $${paymentIntent.amount / 100}</p>`
      );
    } catch (emailError) {
      console.error("❌ Error sending confirmation email:", emailError);
    }

    // Generate ticket (optional)
    let ticketPath = null;
    if (generateTicketFlag) {
      try {
        ticketPath = await generateTicket(
          event[0].name,
          paymentIntent.id,
          paymentIntent.amount / 100,
          user[0],
          event[0].date,
          event[0].venue
        );

        // Send follow-up email with ticket link if ticket generation is successful
        try {
          await sendEmail(
            user[0].email,
            "Your Ticket is Ready",
            `Your ticket for ${event[0].name} is ready!`,
            `<p>Your ticket for ${event[0].name} is ready!</p>
             <p>Download your ticket <a href="${process.env.FRONTEND_URL}/uploads/tickets/ticket-${paymentIntent.id}.pdf">here</a></p>`
          );
        } catch (ticketEmailError) {
          console.error("❌ Error sending ticket email:", ticketEmailError);
        }
      } catch (ticketError) {
        console.error("❌ Error generating ticket:", ticketError);
        // Ticket generation failed, but payment and email were successful
      }
    }

    res.status(200).json({ message: "Payment successful", paymentIntent, ticketPath });
  } catch (error) {
    console.error("❌ Payment Confirmation Error:", error);
    res.status(500).json({ error: "Payment confirmation failed" });
  }
};

// ✅ Get All Payments (Admin Only)
const getAllPayments = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized access" });
    }

    const [payments] = await db.execute("SELECT * FROM payments");
    res.status(200).json(payments);
  } catch (error) {
    console.error("❌ Error Fetching Payments:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// ✅ Get User Payments (Regular Users)
const getUserPayments = async (req, res) => {
  try {
    const user_id = req.user.id;
    const [payments] = await db.execute("SELECT * FROM payments WHERE user_id = ?", [user_id]);
    res.status(200).json(payments);
  } catch (error) {
    console.error("❌ Error Fetching User Payments:", error);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = { processPayment, confirmPayment, getAllPayments, getUserPayments };
