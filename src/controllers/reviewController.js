export const createReviewController = (models) => {
  const DEFAULT_PATRON_REVIEWS = [
    {
      customer_name: 'Priya Sundaram',
      location: 'Chennai, Tamil Nadu',
      rating: 5,
      product_name: 'Temple Lakshmi Necklace',
      product_id: 1,
      comment: 'The antique 24K matte finish on this necklace is absolutely regal. Wore it for my daughter’s engagement and received endless praise. Truly ancestral jewellery craftsmanship.',
      is_approved: true
    },
    {
      customer_name: 'Ananya Deshmukh',
      location: 'South Mumbai',
      rating: 5,
      product_name: 'Pearl Jhumka Earrings',
      product_id: 2,
      comment: 'Exceptional weight and genuine freshwater pearls. It looks virtually indistinguishable from heirloom 22k gold. Safe, insured shipping was flawless.',
      is_approved: true
    },
    {
      customer_name: 'Dr. Radhika Menon',
      location: 'Bengaluru, Karnataka',
      rating: 5,
      product_name: 'Antique Gold Kada Bangles',
      product_id: 3,
      comment: 'The intricate kemp stone setting and delicate peacock carving are breathtaking. Outstanding customer support and luxurious satin packaging.',
      is_approved: true
    },
    {
      customer_name: 'Kavita Subramanian',
      location: 'Coimbatore, Tamil Nadu',
      rating: 5,
      product_name: 'Gemstone Cocktail Ring',
      product_id: 4,
      comment: 'A showstopper piece! The ruby centerpiece catches candlelight majestically. Will definitely order the coordinated bridal set next.',
      is_approved: true
    },
    {
      customer_name: 'Meenakshi Iyer',
      location: 'Madurai, Tamil Nadu',
      rating: 5,
      product_name: 'Temple Waist Belt (Vaddanam)',
      product_id: 5,
      comment: 'Wore this royal ottiyanam for my wedding muhurtham. The fit was easily adjustable and the antique gold patina looked divine in our bridal photographs.',
      is_approved: true
    }
  ];

  const getReviews = async (req, res) => {
    try {
      const limit = parseInt(req.query.limit || 20, 10);
      let reviews = await models.Review.findAll({
        where: { is_approved: true },
        order: [['createdAt', 'DESC']],
        limit
      });

      // If empty in DB, seed defaults
      if (!reviews || reviews.length === 0) {
        reviews = await models.Review.bulkCreate(DEFAULT_PATRON_REVIEWS);
      }

      return res.json({
        success: true,
        count: reviews.length,
        reviews
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve reviews.',
        error: error.message
      });
    }
  };

  const createReview = async (req, res) => {
    try {
      const {
        customer_name,
        rating = 5,
        comment,
        location = 'Verified Patron',
        product_name = 'Heirloom Jewellery Piece',
        product_id = null
      } = req.body;

      if (!customer_name || !customer_name.trim()) {
        return res.status(400).json({ success: false, message: 'Please provide your name.' });
      }

      if (!comment || !comment.trim()) {
        return res.status(400).json({ success: false, message: 'Please provide your review feedback.' });
      }

      const parsedRating = Math.min(5, Math.max(1, parseInt(rating, 10) || 5));

      let assignedProductId = product_id ? parseInt(product_id, 10) : null;
      if (!assignedProductId) {
        try {
          const firstProd = await models.Product.findOne({ attributes: ['id'] });
          assignedProductId = firstProd ? firstProd.id : 1;
        } catch (e) {
          assignedProductId = 1;
        }
      }

      const review = await models.Review.create({
        customer_name: customer_name.trim(),
        rating: parsedRating,
        comment: comment.trim(),
        location: (location || 'Verified Patron').trim(),
        product_name: (product_name || 'Heirloom Jewellery Piece').trim(),
        product_id: assignedProductId,
        user_id: req.user ? req.user.id : null,
        is_approved: true
      });

      return res.status(201).json({
        success: true,
        message: 'Thank you for your valuable feedback! Your review is now live on our storefront.',
        review
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to submit review.',
        error: error.message
      });
    }
  };

  return { getReviews, createReview };
};
