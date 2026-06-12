/* ============================================
   PRAJAPATI ELECTRICAL — Razorpay Integration
   ============================================ */

/**
 * Initialize a Razorpay payment flow.
 * Note: Actual order creation should happen securely on the backend (Edge Function).
 * This function simulates the frontend flow of receiving an order_id and opening Razorpay.
 * 
 * @param {number} amount - Amount in INR
 * @param {string} orderId - Optional order ID from your backend
 * @param {object} customerDetails - { name, email, contact }
 * @param {function} onSuccess - Callback when payment succeeds
 */
async function initiateRazorpayPayment(amount, orderId, customerDetails, onSuccess) {
  // In a real application, you'd fetch the Key ID securely or use an env variable injected by the build
  // Since credentials will be provided by the user later, we'll use a test key or placeholder.
  const RAZORPAY_KEY = window.ENV?.RAZORPAY_KEY || 'rzp_test_placeholder_key'; 

  const options = {
    "key": RAZORPAY_KEY, 
    "amount": amount * 100, // Amount is in currency subunits (paise)
    "currency": "INR",
    "name": "Prajapati Electrical",
    "description": "Secure Payment Portal",
    "image": "images/logo.png",
    "order_id": orderId, // This is a sample Order ID. Pass the `id` obtained in the response of Step 1
    "handler": function (response){
        // Provide the payment confirmation to your backend securely here.
        console.log("Payment successful", response);
        if (onSuccess) {
            onSuccess(response);
        }
    },
    "prefill": {
        "name": customerDetails.name || "",
        "email": customerDetails.email || "",
        "contact": customerDetails.contact || ""
    },
    "notes": {
        "address": "Prajapati Electrical Corporate Office"
    },
    "theme": {
        "color": "#FF6B00"
    }
  };

  const rzp1 = new window.Razorpay(options);
  
  rzp1.on('payment.failed', function (response){
      console.error("Payment failed", response.error);
      alert("Payment failed: " + response.error.description);
  });

  rzp1.open();
}

window.initiateRazorpayPayment = initiateRazorpayPayment;
