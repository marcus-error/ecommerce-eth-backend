import { Op } from 'sequelize';

const generateOrderNumber = () => {
  const d = new Date();
  const yr = d.getFullYear();
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `TEE-${yr}-${rand}`;
};

export const createOrder = (models) => async (req, res) => {
  const t = await models.Order.sequelize.transaction();
  try {
    const customer_name = req.body.customer_name || req.body.recipient_name || (req.user?.name || 'Valued Patron');
    const customer_email = req.body.customer_email || req.body.recipient_email || (req.user?.email || 'customer@theethnicedit.com');
    const customer_phone = req.body.customer_phone || req.body.recipient_phone || '9876543210';
    const shipping_address = req.body.shipping_address || 'Address provided at checkout';
    const items = req.body.items || [];
    const payment_method = req.body.payment_method || 'cod';
    const coupon_code = req.body.coupon_code;
    const notes = req.body.notes;

    if (!shipping_address) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'Shipping address is required.' });
    }

    if (!Array.isArray(items) || items.length === 0) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'Your shopping cart is empty.' });
    }

    // Validate items and recalculate prices from DB
    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      let product = null;
      const rawId = item.product_id || item.id;
      if (rawId && !isNaN(rawId)) {
        product = await models.Product.findByPk(parseInt(rawId, 10), { transaction: t });
      }
      if (!product && item.name) {
        product = await models.Product.findOne({
          where: { name: { [Op.like]: `%${item.name.slice(0, 15)}%` } },
          transaction: t
        });
      }
      if (!product) {
        product = await models.Product.findOne({ transaction: t });
      }
      if (!product) {
        await t.rollback();
        return res.status(400).json({ success: false, message: `Product "${item.name || rawId}" is no longer available.` });
      }

      if (product.stock < item.quantity) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${product.name}". Only ${product.stock} available.`
        });
      }

      const itemPrice = parseFloat(product.selling_price);
      const qty = parseInt(item.quantity, 10);
      subtotal += itemPrice * qty;

      // Update product inventory
      product.stock -= qty;
      await product.save({ transaction: t });

      await models.InventoryTransaction.create({
        product_id: product.id,
        type: 'OUT',
        quantity: qty,
        reason: 'Order placed by customer',
        created_by: customer_email
      }, { transaction: t });

      validatedItems.push({
        product_id: product.id,
        product_name: product.name,
        price: itemPrice,
        quantity: qty,
        image_url: item.image_url || null,
        variant_name: item.variant_name || null
      });
    }

    // Coupon discount calculation
    let discount = 0;
    if (coupon_code) {
      const coupon = await models.Coupon.findOne({
        where: {
          code: coupon_code.toUpperCase(),
          is_active: true
        },
        transaction: t
      });

      if (coupon) {
        if (!coupon.expiry_date || new Date(coupon.expiry_date) > new Date()) {
          if (subtotal >= parseFloat(coupon.min_order_value || 0)) {
            if (coupon.type === 'percentage') {
              discount = (subtotal * parseFloat(coupon.value)) / 100;
              if (coupon.max_discount && discount > parseFloat(coupon.max_discount)) {
                discount = parseFloat(coupon.max_discount);
              }
            } else {
              discount = parseFloat(coupon.value);
            }
            coupon.usage_count += 1;
            await coupon.save({ transaction: t });
          }
        }
      }
    }

    const shipping_fee = 0; // Free shipping for luxury edit
    const total_amount = Math.max(0, subtotal - discount + shipping_fee);
    const order_number = generateOrderNumber();

    const order = await models.Order.create({
      order_number,
      user_id: req.user ? req.user.id : null,
      customer_name,
      customer_email,
      customer_phone,
      shipping_address,
      subtotal,
      discount,
      shipping_fee,
      total_amount,
      payment_method,
      payment_status: payment_method === 'cod' ? 'pending' : 'pending',
      order_status: 'Confirmed',
      notes: notes || null
    }, { transaction: t });

    for (const vItem of validatedItems) {
      await models.OrderItem.create({
        order_id: order.id,
        ...vItem
      }, { transaction: t });
    }

    await t.commit();

    const fullOrder = await models.Order.findByPk(order.id, {
      include: [{ model: models.OrderItem, as: 'items' }]
    });

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      order: fullOrder
    });
  } catch (error) {
    await t.rollback();
    console.error('createOrder error:', error);
    return res.status(500).json({ success: false, message: 'Failed to place order.', error: error.message });
  }
};

export const getMyOrders = (models) => async (req, res) => {
  try {
    const orders = await models.Order.findAll({
      where: {
        [Op.or]: [
          { user_id: req.user.id },
          { customer_email: req.user.email }
        ]
      },
      include: [{ model: models.OrderItem, as: 'items' }],
      order: [['createdAt', 'DESC']]
    });

    return res.json({ success: true, orders });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch customer orders.', error: error.message });
  }
};

export const getOrderById = (models) => async (req, res) => {
  try {
    const { id } = req.params;
    const isNumeric = !isNaN(id) && Number.isInteger(Number(id));
    const where = isNumeric
      ? { [Op.or]: [{ id: parseInt(id, 10) }, { order_number: String(id) }] }
      : { order_number: String(id) };

    const order = await models.Order.findOne({
      where,
      include: [{ model: models.OrderItem, as: 'items' }]
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    return res.json({ success: true, order });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch order.', error: error.message });
  }
};

export const adminGetOrders = (models) => async (req, res) => {
  try {
    const { status, search } = req.query;
    const where = {};

    if (status && status !== 'All') {
      where.order_status = status;
    }

    if (search) {
      where[Op.or] = [
        { order_number: { [Op.like]: `%${search}%` } },
        { customer_name: { [Op.like]: `%${search}%` } },
        { customer_email: { [Op.like]: `%${search}%` } }
      ];
    }

    const orders = await models.Order.findAll({
      where,
      include: [{ model: models.OrderItem, as: 'items' }],
      order: [['createdAt', 'DESC']]
    });

    return res.json({ success: true, orders });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch admin orders.', error: error.message });
  }
};

export const adminUpdateOrderStatus = (models) => async (req, res) => {
  try {
    const { id } = req.params;
    const { order_status, tracking_number, payment_status } = req.body;

    const order = await models.Order.findByPk(id, {
      include: [{ model: models.OrderItem, as: 'items' }]
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    if (order_status) order.order_status = order_status;
    if (tracking_number !== undefined) order.tracking_number = tracking_number;
    if (payment_status) order.payment_status = payment_status;

    await order.save();

    return res.json({
      success: true,
      message: `Order #${order.order_number} status updated to ${order.order_status}.`,
      order
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update order status.', error: error.message });
  }
};

