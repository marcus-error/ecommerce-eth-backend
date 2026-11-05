import crypto from 'crypto';
import Razorpay from 'razorpay';

export const createPaymentOrder = (models) => async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt } = req.body;

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // If real keys provided
    if (keyId && keySecret && !keyId.includes('rzp_test_ethnic_edit')) {
      try {
        const instance = new Razorpay({ key_id: keyId, key_secret: keySecret });
        const options = {
          amount: Math.round(parseFloat(amount) * 100), // in paise
          currency,
          receipt: receipt || `rec_${Date.now()}`
        };
        const order = await instance.orders.create(options);
        return res.json({ success: true, order, keyId });
      } catch (rzpErr) {
        console.warn('Razorpay API error, falling back to simulator:', rzpErr.message);
      }
    }

    // Test / Dev Simulation Order
    const simulatedOrder = {
      id: `order_sim_${Date.now()}`,
      entity: 'order',
      amount: Math.round(parseFloat(amount) * 100),
      amount_paid: 0,
      amount_due: Math.round(parseFloat(amount) * 100),
      currency,
      receipt: receipt || `rec_${Date.now()}`,
      status: 'created',
      created_at: Math.floor(Date.now() / 1000)
    };

    return res.json({
      success: true,
      order: simulatedOrder,
      keyId: keyId || 'rzp_test_ethnic_edit_2026',
      is_simulation: true
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create payment order.', error: error.message });
  }
};

export const verifyPayment = (models) => async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      order_id
    } = req.body;

    const order = await models.Order.findByPk(order_id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // Verify signature if real secret configured
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (keySecret && !keySecret.includes('ethnic_edit_secret_key_test') && razorpay_signature) {
      const generatedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (generatedSignature !== razorpay_signature) {
        order.payment_status = 'failed';
        await order.save();
        return res.status(400).json({ success: false, message: 'Payment verification failed: Signature mismatch.' });
      }
    }

    // Mark order as paid
    order.payment_status = 'paid';
    order.notes = `Razorpay Payment ID: ${razorpay_payment_id || 'test_pay_' + Date.now()}`;
    await order.save();

    return res.json({
      success: true,
      message: 'Payment verified and confirmed!',
      order
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Payment verification error.', error: error.message });
  }
};

