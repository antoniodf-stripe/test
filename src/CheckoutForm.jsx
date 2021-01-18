import React, { useState, useEffect } from "react";
import {
  CardElement,
  useStripe,
  useElements
} from "@stripe/react-stripe-js";

export default function CheckoutForm() {
  const [succeeded, setSucceeded] = useState(false);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState('');
  const [disabled, setDisabled] = useState(true);
  const [clientSecret, setClientSecret] = useState('');
  const [amount, setAmount] = useState('');
  const stripe = useStripe();
  const elements = useElements();


  useEffect(() => {
    window
      .fetch("/create-payment-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({items: [{ id: "light-doll" }]})
      })
      .then(res => {
        return res.json();
      })
      .then(data => {
        console.log("PaymentIntent data: ", data)
        setClientSecret(data.clientSecret);
      });
  }, []);

  const cardStyle = {
    style: {
      base: {
        color: "#32325d",
        fontFamily: 'Arial, sans-serif',
        fontSmoothing: "antialiased",
        fontSize: "16px",
        "::placeholder": {
          color: "#32325d"
        }
      },
      invalid: {
        color: "#fa755a",
        iconColor: "#fa755a"
      }
    }
  };

  const handleChange = async (event) => {
    setDisabled(event.empty);
    setError(event.error ? event.error.message : "");
  };

  const handleSubmit = async ev => {
    ev.preventDefault();
    console.log("Processing payment");
    setProcessing(true);

    const payload = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement)
      }
    });

    if (payload.error) {
      setError(`Payment failed ${payload.error.message}`);
      setProcessing(false);
    } else {
      setError(null);
      setProcessing(false);
      setSucceeded(true);
      setAmount(payload.paymentIntent.amount);
    }
  };

  return (
    <div>
      <h1 className="ui header">Mom's dolls shop</h1>
    <form id="payment-form" onSubmit={handleSubmit}>
    <div class="ui medium image">
         <img src="/IMG_4621.jpg" />
       </div>
       <p></p>
       <p></p>
       <div class="content">
        <a class="header">The Light Doll</a>
        <p></p>
        <div class="meta">
            <span class="date">Price: $50</span>
        </div>
        <p></p>
        <p></p>
        <div class="description">
        "The Light Doll" brings you into an enchanted world of melancholy
        </div>
    </div>
    <p></p>
      <CardElement id="card-element" options={cardStyle} onChange={handleChange} />
      <button
        disabled={processing || disabled || succeeded}
        id="submit"
      >
        <span id="button-text">
          {processing ? (
            <div className="spinner" id="spinner"></div>
          ) : (
            "Pay"
          )}
        </span>
      </button>
      {error && (
        <div className="card-error" role="alert">
          {error}
        </div>
      )}
      
      <p className={succeeded ? "result-message" : "result-message hidden"}>
      Payment of ${amount/100} succeeded, see the result in your
        <a
          href={`https://dashboard.stripe.com/test/payments`}
        >
          {" "}
          Stripe dashboard.
        </a> Refresh the page to pay again.
      </p>
    </form>
    </div>
  );
}
