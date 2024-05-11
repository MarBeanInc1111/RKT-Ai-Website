const express = require('express');
const app = express();
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2020-08-27',
  appInfo: {
    name: "AI Product Website",
    version: "0.0.1",
    url: "https://example.com"
  }
});

app.use(express.static(path.resolve(__dirname, 'client')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const baseUrl = process.env.BASE_URL || `http://localhost:4242`;

app.get('/', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'client', 'index.html'));
});

app.get('/products', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'client', 'products.html'));
});

app.get('/products/chatbot', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'client', 'chatbot.html'));
});

app.get('/chatbot', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'client', 'chatbot.html'));
});

// Updated API call for using OpenAI chat completions
app.post('/chat', async (req, res) => {
  const { query, model } = req.body;
  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: model,
      messages: [{ role: 'user', content: query }],
      max_tokens: 100,
      n: 1,
      stop: null,
      temperature: 0.7,
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
    });
    res.json({ response: response.data.choices[0].message.content.trim() });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error processing request');
  }
});

app.post('/create-checkout-session', async (req, res) => {
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        unit_amount: 500,
        currency: 'usd',
        product_data: {
          name: 'AI Product'
        }
      },
      quantity: 1,
    }],
    success_url: `${baseUrl}/success.html?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/canceled.html`,
  });
  res.redirect(303, session.url);
});

app.post('/webhook', async (req, res) => {
  let event;
  const signature = req.headers['stripe-signature'];
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.log('⚠️ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  if (event.type === 'checkout.session.completed') {
    console.log('🔔 Payment received!');
    // Further processing can be added here
  }
  res.sendStatus(200);
});

const PORT = process.env.PORT || 4242;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}!`));