export const applyCoupon = (models) => async (req, res) => {
  try {
    const { code, subtotal } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: 'Coupon code is required.' });
    }

    const coupon = await models.Coupon.findOne({
      where: { code: code.trim().toUpperCase(), is_active: true }
    });

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Invalid or inactive coupon code.' });
    }

    if (coupon.expiry_date && new Date(coupon.expiry_date) < new Date()) {
      return res.status(400).json({ success: false, message: 'This coupon has expired.' });
    }

    if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
      return res.status(400).json({ success: false, message: 'This coupon has reached its maximum usage limit.' });
    }

    const orderSubtotal = parseFloat(subtotal || 0);
    if (orderSubtotal < parseFloat(coupon.min_order_value || 0)) {
      return res.status(400).json({
        success: false,
        message: `Minimum order value of ₹${parseFloat(coupon.min_order_value).toLocaleString('en-IN')} required for this coupon.`
      });
    }

    let discount = 0;
    if (coupon.type === 'percentage') {
      discount = (orderSubtotal * parseFloat(coupon.value)) / 100;
      if (coupon.max_discount && discount > parseFloat(coupon.max_discount)) {
        discount = parseFloat(coupon.max_discount);
      }
    } else {
      discount = parseFloat(coupon.value);
    }

    discount = Math.min(discount, orderSubtotal);

    return res.json({
      success: true,
      message: `Coupon "${coupon.code}" applied! You saved ₹${discount.toLocaleString('en-IN')}`,
      discount_amount: discount,
      discount: discount,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        discount_amount: discount,
        discount
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to apply coupon.', error: error.message });
  }
};

export const adminGetCoupons = (models) => async (req, res) => {
  try {
    const coupons = await models.Coupon.findAll({
      order: [['createdAt', 'DESC']]
    });
    return res.json({ success: true, coupons });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch coupons.', error: error.message });
  }
};

export const createCoupon = (models) => async (req, res) => {
  try {
    const {
      code,
      type = 'percentage',
      value,
      min_order_value = 0,
      max_discount,
      usage_limit = 100,
      expiry_date,
      is_active = true
    } = req.body;

    if (!code || value === undefined) {
      return res.status(400).json({ success: false, message: 'Coupon code and discount value are required.' });
    }

    const existing = await models.Coupon.findOne({ where: { code: code.trim().toUpperCase() } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'A coupon with this code already exists.' });
    }

    const coupon = await models.Coupon.create({
      code: code.trim().toUpperCase(),
      type,
      value: parseFloat(value),
      min_order_value: parseFloat(min_order_value || 0),
      max_discount: max_discount ? parseFloat(max_discount) : null,
      usage_limit: parseInt(usage_limit, 10) || 100,
      expiry_date: expiry_date || null,
      is_active: !!is_active
    });

    return res.status(201).json({ success: true, message: 'Coupon created successfully.', coupon });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create coupon.', error: error.message });
  }
};

export const deleteCoupon = (models) => async (req, res) => {
  try {
    const { id } = req.params;
    const coupon = await models.Coupon.findByPk(id);

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found.' });
    }

    await coupon.destroy();
    return res.json({ success: true, message: 'Coupon deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete coupon.', error: error.message });
  }
};

export const toggleCoupon = (models) => async (req, res) => {
  try {
    const { id } = req.params;
    const coupon = await models.Coupon.findByPk(id);

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found.' });
    }

    coupon.is_active = !coupon.is_active;
    await coupon.save();

    return res.json({
      success: true,
      message: `Coupon ${coupon.is_active ? 'activated' : 'deactivated'}.`,
      is_active: coupon.is_active
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to toggle coupon.', error: error.message });
  }
};

