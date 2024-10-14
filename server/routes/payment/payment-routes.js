
const express = require("express");
const Stripe = require("stripe");
const router = express.Router();

const stripe = Stripe("sk_test_51Q8gC4K1RhQaSjCjkrx6PSRWQyXgjtzBh34TlqiBxCfsI9S8J04oi5az95ZU2JaFmHIBY86RYsEAsvAjVtBgcbQv002z5WlxSe"); // Make sure to set this in your .env file

router.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency } = req.body; // Amount and currency will come from the frontend
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // amount in smallest currency unit (e.g., cents for USD)
      currency: currency,
      payment_method_types: ['card'],
    });
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
