import { Sequelize } from 'sequelize';

const generateSlug = (name) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const getCategories = (models) => async (req, res) => {
  try {
    const categories = await models.Category.findAll({
      order: [['display_order', 'ASC'], ['id', 'ASC']]
    });
    return res.json({ success: true, categories });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch categories.', error: error.message });
  }
};

export const adminGetCategories = (models) => async (req, res) => {
  try {
    const categories = await models.Category.findAll({
      include: [
        {
          model: models.Product,
          as: 'products',
          attributes: ['id']
        }
      ],
      order: [['display_order', 'ASC'], ['id', 'ASC']]
    });

    const formatted = categories.map((c) => ({
      ...c.toJSON(),
      product_count: c.products ? c.products.length : 0
    }));

    return res.json({ success: true, categories: formatted });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch admin categories.', error: error.message });
  }
};

export const createCategory = (models) => async (req, res) => {
  try {
    const { name, description, image_url, display_order = 0, is_published = true } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required.' });
    }

    const slug = generateSlug(name);
    const existing = await models.Category.findOne({ where: { slug } });
    const finalSlug = existing ? `${slug}-${Date.now().toString().slice(-4)}` : slug;

    const category = await models.Category.create({
      name,
      slug: finalSlug,
      description: description || '',
      image_url: image_url || null,
      display_order: parseInt(display_order, 10) || 0,
      is_published: !!is_published
    });

    return res.status(201).json({ success: true, message: 'Category created successfully.', category });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create category.', error: error.message });
  }
};

export const updateCategory = (models) => async (req, res) => {
  try {
    const { id } = req.params;
    const category = await models.Category.findByPk(id);

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    const { name, description, image_url, display_order, is_published } = req.body;

    if (name) {
      category.name = name;
      category.slug = generateSlug(name);
    }
    if (description !== undefined) category.description = description;
    if (image_url !== undefined) category.image_url = image_url;
    if (display_order !== undefined) category.display_order = parseInt(display_order, 10);
    if (is_published !== undefined) category.is_published = !!is_published;

    await category.save();

    return res.json({ success: true, message: 'Category updated successfully.', category });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update category.', error: error.message });
  }
};

export const deleteCategory = (models) => async (req, res) => {
  try {
    const { id } = req.params;
    const category = await models.Category.findByPk(id);

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    // Safely unbind products from this category first to prevent foreign key errors
    if (models.Product) {
      await models.Product.update({ category_id: null }, { where: { category_id: id } });
    }

    await category.destroy();
    return res.json({ success: true, message: 'Category deleted successfully.' });
  } catch (error) {
    console.error('Delete category error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete category.', error: error.message });
  }
};

