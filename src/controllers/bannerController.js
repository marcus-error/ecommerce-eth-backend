export const getBanners = (models) => async (req, res) => {
  try {
    const { type } = req.query;
    const where = { is_active: true };
    if (type) where.type = type;

    const banners = await models.Banner.findAll({
      where,
      order: [['display_order', 'ASC'], ['id', 'ASC']]
    });

    return res.json({ success: true, banners });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch banners.', error: error.message });
  }
};

export const adminGetBanners = (models) => async (req, res) => {
  try {
    const banners = await models.Banner.findAll({
      order: [['display_order', 'ASC'], ['id', 'ASC']]
    });
    return res.json({ success: true, banners });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch admin banners.', error: error.message });
  }
};

export const createBanner = (models) => async (req, res) => {
  try {
    const {
      title,
      subtitle,
      kick = 'The Ethnic Edit',
      button_text = 'Shop the Collection',
      button_link = '#shop',
      desktop_image,
      mobile_image,
      type = 'hero',
      display_order = 0,
      is_active = true
    } = req.body;

    if (!title || !desktop_image) {
      return res.status(400).json({ success: false, message: 'Banner title and desktop image are required.' });
    }

    const banner = await models.Banner.create({
      title,
      subtitle: subtitle || '',
      kick,
      button_text,
      button_link,
      desktop_image,
      mobile_image: mobile_image || desktop_image,
      type,
      display_order: parseInt(display_order, 10) || 0,
      is_active: !!is_active
    });

    return res.status(201).json({ success: true, message: 'Banner created successfully.', banner });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create banner.', error: error.message });
  }
};

export const updateBanner = (models) => async (req, res) => {
  try {
    const { id } = req.params;
    const banner = await models.Banner.findByPk(id);

    if (!banner) {
      return res.status(404).json({ success: false, message: 'Banner not found.' });
    }

    const {
      title,
      subtitle,
      kick,
      button_text,
      button_link,
      desktop_image,
      mobile_image,
      type,
      display_order,
      is_active
    } = req.body;

    if (title) banner.title = title;
    if (subtitle !== undefined) banner.subtitle = subtitle;
    if (kick !== undefined) banner.kick = kick;
    if (button_text !== undefined) banner.button_text = button_text;
    if (button_link !== undefined) banner.button_link = button_link;
    if (desktop_image) banner.desktop_image = desktop_image;
    if (mobile_image !== undefined) banner.mobile_image = mobile_image;
    if (type) banner.type = type;
    if (display_order !== undefined) banner.display_order = parseInt(display_order, 10);
    if (is_active !== undefined) banner.is_active = !!is_active;

    await banner.save();

    return res.json({ success: true, message: 'Banner updated successfully.', banner });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update banner.', error: error.message });
  }
};

export const deleteBanner = (models) => async (req, res) => {
  try {
    const { id } = req.params;
    const banner = await models.Banner.findByPk(id);

    if (!banner) {
      return res.status(404).json({ success: false, message: 'Banner not found.' });
    }

    await banner.destroy();
    return res.json({ success: true, message: 'Banner deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete banner.', error: error.message });
  }
};

export const toggleBanner = (models) => async (req, res) => {
  try {
    const { id } = req.params;
    const banner = await models.Banner.findByPk(id);

    if (!banner) {
      return res.status(404).json({ success: false, message: 'Banner not found.' });
    }

    banner.is_active = !banner.is_active;
    await banner.save();

    return res.json({
      success: true,
      message: `Banner ${banner.is_active ? 'activated' : 'deactivated'} successfully.`,
      is_active: banner.is_active
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to toggle banner.', error: error.message });
  }
};

