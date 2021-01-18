const express = require("express");
const app = express();
const stripe = require("stripe")("sk_test_pZuwhYsoj45Pz2TQ4QSE2puo");
const bodyParser = require('body-parser');
const endpointSecret = 'whsec_vlzs5x18qZxgKIrrrqHo458mcwWx8Q1I';

const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, prettyPrint } = format;

const logger = createLogger({
  format: combine(
    timestamp(),
    format.splat(),
    format.simple()
  ),
  transports: [new transports.File({ filename: 'fullfillments.log' })]
});

app.use(express.static("."));
app.use(express.json());

const calculateOrderAmount = items => {
  console.log('This is',items[0].id)
  if (items[0].id == "light-doll"){
    return 5000;
  } else return 2000; 
};

const fulfillOrder = (session) => {
  logger.log('info', 'You need to fullfill the order with PaymentIntent id %s and amount %s created at ', session.id, session.amount);
  console.log("Fulfilling order", session);
}

app.post("/create-payment-intent", async (req, res) => {
  const { items } = req.body;
  const paymentIntent = await stripe.paymentIntents.create({
    amount: calculateOrderAmount(items),
    currency: "usd",
    metadata: {integration_check: 'accept_a_payment'}
  });

  res.send({
    clientSecret: paymentIntent.client_secret
  });
});

app.post('/webhook', bodyParser.raw({type: 'application/json'}), (request, response) => {
  let event;
  try {
    event = request.body;
  } catch (err) {
    console.log(`⚠️  Webhook error while parsing basic request.`, err.message);
    return response.send();
  }

  // ONLY FOR PRODUCTION
  //
  // if (endpointSecret) {
  //   // Get the signature sent by Stripe
  //   const signature = request.headers['stripe-signature'];
  //   try {
  //     event = stripe.webhooks.constructEvent(
  //       request.body,
  //       signature,
  //       endpointSecret
  //     );
  //   } catch (err) {
  //     console.log(`⚠️  Webhook signature verification failed.`, err.message);
  //     return response.send(200);
  //   }
  // }
  
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log(`PaymentIntent for ${paymentIntent.amount} was successful!`);
      fulfillOrder(paymentIntent);
      break;
    default:
      console.log(`Unhandled event type ${event.type}.`);
  }
  response.send();
});

app.listen(4242, () => console.log('Node server listening on port 4242!'));
