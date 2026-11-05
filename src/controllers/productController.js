import { Op } from 'sequelize';

const generateSlug = (name) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') + '-' + Date.now().toString().slice(-4);
};

export const getProducts = (models) => async (req, res) => {
  try {
    const {
      category,
      search,
      sort,
      featured,
      material,
      colour,
      occasion,
      min_price,
      max_price,
      rating,
      collection_type,
      limit = 50,
      page = 1
    } = req.query;

    const where = { is_published: true };

    if (featured === 'true' || featured === true) {
      where.is_featured = true;
    }

    if (collection_type) {
      where.collection_type = { [Op.like]: `%${collection_type}%` };
    }

    if (material) {
      where.material = { [Op.like]: `%${material}%` };
    }

    if (colour) {
      where.colour = { [Op.like]: `%${colour}%` };
    }

    if (occasion) {
      where.occasion = { [Op.like]: `%${occasion}%` };
    }

    if (rating) {
      where.rating = { [Op.gte]: parseFloat(rating) };
    }

    if (min_price || max_price) {
      where.selling_price = {};
      if (min_price) where.selling_price[Op.gte] = parseFloat(min_price);
      if (max_price) where.selling_price[Op.lte] = parseFloat(max_price);
    }

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { sku: { [Op.like]: `%${search}%` } },
        { material: { [Op.like]: `%${search}%` } },
        { occasion: { [Op.like]: `%${search}%` } }
      ];
    }

    if (category && category !== 'all') {
      const cat = await models.Category.findOne({
        where: {
          [Op.or]: [{ slug: category }, { name: category }]
        }
      });
      if (cat) {
        where.category_id = cat.id;
      }
    }

    let order = [['createdAt', 'DESC']];
    if (sort === 'price_asc') order = [['selling_price', 'ASC']];
    if (sort === 'price_desc') order = [['selling_price', 'DESC']];
    if (sort === 'name_asc') order = [['name', 'ASC']];
    if (sort === 'newest') order = [['createdAt', 'DESC']];
    if (sort === 'rating') order = [['rating', 'DESC']];
    if (sort === 'popularity') order = [['reviews_count', 'DESC']];

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const { count, rows: products } = await models.Product.findAndCountAll({
      where,
      include: [
        { model: models.Category, as: 'category', attributes: ['id', 'name', 'slug'] },
        { model: models.ProductImage, as: 'images', attributes: ['id', 'image_url', 'is_primary', 'display_order'] }
      ],
      order,
      limit: parseInt(limit, 10),
      offset
    });

    return res.json({
      success: true,
      total: count,
      page: parseInt(page, 10),
      pages: Math.ceil(count / limit),
      products
    });
  } catch (error) {
    console.error('getProducts error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch products.', error: error.message });
  }
};

export const getProductById = (models) => async (req, res) => {
  try {
    const { id } = req.params;

    const isNumeric = !isNaN(id);
    const where = isNumeric ? { id: parseInt(id, 10) } : { slug: id };

    const product = await models.Product.findOne({
      where,
      include: [
        { model: models.Category, as: 'category' },
        { model: models.ProductImage, as: 'images', order: [['is_primary', 'DESC'], ['display_order', 'ASC']] },
        { model: models.ProductVariant, as: 'variants' }
      ]
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    return res.json({ success: true, product });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch product.', error: error.message });
  }
};

export const adminGetProducts = (models) => async (req, res) => {
  try {
    const { search, category_id, stock_status } = req.query;

    const where = {};
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { sku: { [Op.like]: `%${search}%` } }
      ];
    }
    if (category_id) {
      where.category_id = category_id;
    }
    if (stock_status === 'low') {
      where.stock = { [Op.lte]: 5, [Op.gt]: 0 };
    } else if (stock_status === 'out') {
      where.stock = 0;
    }

    const products = await models.Product.findAll({
      where,
      include: [
        { model: models.Category, as: 'category' },
        { model: models.ProductImage, as: 'images' },
        { model: models.ProductVariant, as: 'variants' }
      ],
      order: [['createdAt', 'DESC']]
    });

    return res.json({ success: true, products });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch admin products.', error: error.message });
  }
};

export const createProduct = (models) => async (req, res) => {
  try {
    const {
      name,
      description,
      short_description,
      original_price,
      selling_price,
      sku,
      stock = 10,
      category_id,
      material,
      colour,
      occasion,
      collection_type,
      weight,
      dimensions,
      rating = 4.8,
      reviews_count = 50,
      is_featured = false,
      is_published = true,
      images = [],
      variants = []
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Product name is required.' });
    }

    // Ensure unique slug
    let slug = generateSlug(name.trim());
    let slugExists = await models.Product.findOne({ where: { slug } });
    if (slugExists) {
      slug = `${slug}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    // Ensure unique SKU
    let finalSku = (sku && sku.trim()) || `TEE-${Date.now().toString().slice(-6)}`;
    let skuExists = await models.Product.findOne({ where: { sku: finalSku } });
    if (skuExists) {
      finalSku = `${finalSku}-${Math.floor(100 + Math.random() * 900)}`;
    }

    // Resolve category_id safely
    let validCategoryId = null;
    if (category_id) {
      if (!isNaN(category_id)) {
        validCategoryId = parseInt(category_id, 10);
      } else {
        const foundCat = await models.Category.findOne({
          where: { [Op.or]: [{ slug: category_id }, { name: category_id }] }
        });
        if (foundCat) validCategoryId = foundCat.id;
      }
    }
    if (!validCategoryId) {
      const firstCat = await models.Category.findOne();
      if (firstCat) validCategoryId = firstCat.id;
    }

    const parsedOriginal = (original_price !== undefined && original_price !== '' && !isNaN(parseFloat(original_price)))
      ? parseFloat(original_price)
      : 12000;
    const parsedSelling = (selling_price !== undefined && selling_price !== '' && !isNaN(parseFloat(selling_price)))
      ? parseFloat(selling_price)
      : parsedOriginal;
    const parsedStock = (!isNaN(parseInt(stock, 10)) && parseInt(stock, 10) >= 0)
      ? parseInt(stock, 10)
      : 10;

    const product = await models.Product.create({
      name,
      slug,
      description: description || '',
      short_description: short_description || '',
      original_price: parsedOriginal,
      selling_price: parsedSelling,
      sku: finalSku,
      stock: parsedStock,
      category_id: validCategoryId,
      material: material || '24k Antique Gold Plated',
      colour: colour || 'Antique Gold',
      occasion: occasion || 'Bridal & Festive',
      collection_type: collection_type || 'Temple Jewellery',
      weight: weight || '50g',
      dimensions: dimensions || '',
      rating: parseFloat(rating || 4.8),
      reviews_count: parseInt(reviews_count || 50, 10),
      is_featured: !!is_featured,
      is_published: !!is_published
    });

    // Save Images
    const validImages = (Array.isArray(images) ? images : [images])
      .map((img) => (typeof img === 'string' ? img.trim() : img?.image_url))
      .filter(Boolean);

    if (validImages.length > 0) {
      const imgRecords = validImages.map((imgUrl, idx) => ({
        product_id: product.id,
        image_url: imgUrl,
        is_primary: idx === 0,
        display_order: idx
      }));
      await models.ProductImage.bulkCreate(imgRecords);
    } else {
      // Default placeholder if none provided
      await models.ProductImage.create({
        product_id: product.id,
        image_url: '/uploads/necklaces.png',
        is_primary: true,
        display_order: 0
      });
    }

    // Save Variants
    if (Array.isArray(variants) && variants.length > 0) {
      const varRecords = variants.map((v) => ({
        product_id: product.id,
        title: v.title,
        sku: v.sku || `${finalSku}-${v.title.slice(0, 3).toUpperCase()}`,
        price_adjustment: parseFloat(v.price_adjustment || 0),
        stock: parseInt(v.stock || parsedStock, 10)
      }));
      await models.ProductVariant.bulkCreate(varRecords);
    }

    // Record initial inventory transaction safely
    try {
      await models.InventoryTransaction.create({
        product_id: product.id,
        type: 'IN',
        quantity: parsedStock,
        reason: 'Initial stock on product creation',
        created_by: req.user?.email || 'admin@theethnicedit.com'
      });
    } catch (invErr) {
      console.warn('Inventory log notice:', invErr.message);
    }

    const fullProduct = await models.Product.findByPk(product.id, {
      include: [
        { model: models.Category, as: 'category' },
        { model: models.ProductImage, as: 'images' },
        { model: models.ProductVariant, as: 'variants' }
      ]
    });

    return res.status(201).json({
      success: true,
      message: 'Product created and published successfully!',
      product: fullProduct
    });
  } catch (error) {
    console.error('createProduct error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to create product.', error: error.message });
  }
};

export const updateProduct = (models) => async (req, res) => {
  try {
    const { id } = req.params;
    const product = await models.Product.findByPk(id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const {
      name,
      description,
      short_description,
      original_price,
      selling_price,
      sku,
      stock,
      category_id,
      material,
      colour,
      occasion,
      collection_type,
      weight,
      dimensions,
      rating,
      reviews_count,
      is_featured,
      is_published,
      images,
      variants
    } = req.body;

    if (name) product.name = name;
    if (description !== undefined) product.description = description;
    if (short_description !== undefined) product.short_description = short_description;
    if (original_price !== undefined) product.original_price = parseFloat(original_price);
    if (selling_price !== undefined) product.selling_price = parseFloat(selling_price);
    if (sku) product.sku = sku;
    if (category_id !== undefined) product.category_id = category_id ? parseInt(category_id, 10) : null;
    if (is_featured !== undefined) product.is_featured = !!is_featured;
    if (is_published !== undefined) product.is_published = !!is_published;
    if (material !== undefined) product.material = material;
    if (colour !== undefined) product.colour = colour;
    if (occasion !== undefined) product.occasion = occasion;
    if (collection_type !== undefined) product.collection_type = collection_type;
    if (weight !== undefined) product.weight = weight;
    if (dimensions !== undefined) product.dimensions = dimensions;
    if (rating !== undefined) product.rating = parseFloat(rating);
    if (reviews_count !== undefined) product.reviews_count = parseInt(reviews_count, 10);

    if (stock !== undefined && parseInt(stock, 10) !== product.stock) {
      const diff = parseInt(stock, 10) - product.stock;
      await models.InventoryTransaction.create({
        product_id: product.id,
        type: diff > 0 ? 'IN' : 'ADJUSTMENT',
        quantity: Math.abs(diff),
        reason: 'Stock updated via Product Edit',
        created_by: req.user?.email || 'admin'
      });
      product.stock = parseInt(stock, 10);
    }

    await product.save();

    // If images array provided, replace
    if (Array.isArray(images)) {
      await models.ProductImage.destroy({ where: { product_id: product.id } });
      const imgRecords = images.map((img, idx) => ({
        product_id: product.id,
        image_url: typeof img === 'string' ? img : img.image_url,
        is_primary: idx === 0,
        display_order: idx
      }));
      await models.ProductImage.bulkCreate(imgRecords);
    }

    // If variants array provided, replace
    if (Array.isArray(variants)) {
      await models.ProductVariant.destroy({ where: { product_id: product.id } });
      const varRecords = variants.map((v) => ({
        product_id: product.id,
        title: v.title,
        sku: v.sku || `${product.sku}-${v.title.slice(0, 3).toUpperCase()}`,
        price_adjustment: parseFloat(v.price_adjustment || 0),
        stock: parseInt(v.stock || product.stock, 10)
      }));
      await models.ProductVariant.bulkCreate(varRecords);
    }

    const updated = await models.Product.findByPk(product.id, {
      include: [
        { model: models.Category, as: 'category' },
        { model: models.ProductImage, as: 'images' },
        { model: models.ProductVariant, as: 'variants' }
      ]
    });

    return res.json({ success: true, message: 'Product updated successfully.', product: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update product.', error: error.message });
  }
};

export const deleteProduct = (models) => async (req, res) => {
  try {
    const { id } = req.params;
    const product = await models.Product.findByPk(id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    await product.destroy();
    return res.json({ success: true, message: 'Product deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete product.', error: error.message });
  }
};

export const togglePublish = (models) => async (req, res) => {
  try {
    const { id } = req.params;
    const product = await models.Product.findByPk(id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    product.is_published = !product.is_published;
    await product.save();

    return res.json({
      success: true,
      message: `Product ${product.is_published ? 'published' : 'unpublished'} successfully.`,
      is_published: product.is_published
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to toggle product status.', error: error.message });
  }
};

