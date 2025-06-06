// payment.js

const express = require('express');
const router = express.Router();
const { client } = require('../../config/paypal');
const checkoutNodeJssdk = require('@paypal/checkout-server-sdk');
const Prompt = require('../../models/Prompt');
const Razorpay = require('razorpay');

require('dotenv').config();

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  req.session.redirectAfterLogin = req.originalUrl;
  return res.redirect('/auth/google');
}

router.get('/paypal/:productId', ensureAuthenticated, async (req, res) => {

  const productId = req.params.productId;

  try {
    // 🔍 Fetch prompt from DB
    const prompt = await Prompt.findById(productId);
    if (!prompt) {
      return res.status(404).send('Prompt not found');
    }

    // 💵 Check for free prompts (optional)
    if (!prompt.price || prompt.price <= 0) {
      return res.redirect(`/user/download-page?file=${encodeURIComponent(prompt.file)}`);
    }

    // 🛒 Create PayPal order with dynamic price
    const request = new checkoutNodeJssdk.orders.OrdersCreateRequest();
    request.prefer('return=representation');
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: 'USD',
          value: prompt.price.toFixed(2) // ✅ Use prompt.price
        },
        custom_id: productId
      }],
      application_context: {
        return_url: `http://localhost:3000/payment-success?productId=${productId}`,
       cancel_url: `http://localhost:3000/payment-cancel`

      }
    });

    const order = await client().execute(request);
    const approvalUrl = order.result.links.find(link => link.rel === 'approve').href;
    res.redirect(approvalUrl);
  } catch (err) {
    console.error('❌ Error creating order:', err);
    res.status(500).send('Error creating order');
  }
});


router.get('/payment-success', async (req, res) => {
  const { token, PayerID, productId } = req.query;

  if (!token || !PayerID || !productId) {
    return res.status(400).send('Missing token, PayerID, or productId');
  }

  const request = new checkoutNodeJssdk.orders.OrdersCaptureRequest(token);
  request.requestBody({});

  try {
    const capture = await client().execute(request);
    console.log('✅ Payment captured:', JSON.stringify(capture.result, null, 2));


    const prompt = await Prompt.findById(productId);
    if (!prompt) {
      return res.status(404).send('Prompt not found');
    }

 const filename = prompt.file; // e.g., 1748090711772.pdf
    res.redirect(`/user/download-page?file=${encodeURIComponent(filename)}`);


  } catch (err) {
    console.error('❌ Error capturing order:', err);
    res.status(500).send('Error capturing order');
  }
});








const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});



const axios = require('axios');

router.post('/razorpay-order', ensureAuthenticated, async (req, res) => {
  const { productId } = req.body;

  try {
    const prompt = await Prompt.findById(productId);
    if (!prompt) return res.status(404).json({ error: 'Prompt not found' });

    const priceInUSD = prompt.price;
    let usdToInrRate = 83; // fallback rate

    // 1. Fetch USD → INR exchange rate
    try {
      const exchangeRes = await axios.get('https://open.er-api.com/v6/latest/USD');
      if (exchangeRes.data && exchangeRes.data.rates && exchangeRes.data.rates.INR) {
        usdToInrRate = exchangeRes.data.rates.INR; // ✅ FIXED: no "const" here
        console.log("✅ Live exchange rate fetched:", usdToInrRate);
      } else {
        console.warn("⚠️ INR rate missing in API response, using fallback:", usdToInrRate);
      }
    } catch (exErr) {
      console.warn("⚠️ Failed to fetch exchange rate, using fallback:", usdToInrRate);
    }

    // 2. Convert to INR
    const priceInINR = priceInUSD * usdToInrRate;

    // 3. Convert INR to paise
    const amountInPaise = Math.round(priceInINR * 100);

    // 4. Create Razorpay order
    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: {
        productId,
        usdPrice: priceInUSD,
        inrConverted: priceInINR.toFixed(2),
      },
    };

    const order = await razorpay.orders.create(options);

    // 5. Respond with order + pricing info
    res.json({
      ...order,
      usdPrice: priceInUSD,
      inrConverted: priceInINR.toFixed(2),
    });

  } catch (err) {
    console.error('❌ Razorpay order error:', err.message || err);
    res.status(500).json({ error: 'Failed to create Razorpay order' });
  }
});



module.exports = router;  // <--- Add this line!
