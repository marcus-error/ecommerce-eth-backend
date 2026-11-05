import bcrypt from 'bcryptjs';

export const seedDatabase = async (models) => {
  try {
    const userCount = await models.User.count();
    if (userCount > 0) {
      console.log('ℹ️ [DB] Database already initialized with records.');
      // Check if we need to ensure all 14 categories exist
      const catCount = await models.Category.count();
      if (catCount >= 14) {
        return;
      }
    }

    console.log('🌱 [DB] Seeding/Updating database with all 14 Imitation Jewellery categories & products...');

    // 1. Seed Users if not present
    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash('admin123', salt);
    const customerPassword = await bcrypt.hash('customer123', salt);

    const [adminUser] = await models.User.findOrCreate({
      where: { email: 'admin@theethnicedit.com' },
      defaults: {
        name: 'Store Administrator',
        email: 'admin@theethnicedit.com',
        password: adminPassword,
        role: 'admin',
        phone: '+91 98765 43210'
      }
    });

    const [demoCustomer] = await models.User.findOrCreate({
      where: { email: 'customer@theethnicedit.com' },
      defaults: {
        name: 'Nivetha Priyadharshini',
        email: 'customer@theethnicedit.com',
        password: customerPassword,
        role: 'customer',
        phone: '+91 91234 56789',
        address: 'No. 42, Heritage Enclave, T. Nagar, Chennai, Tamil Nadu - 600017'
      }
    });

    // 2. All 14 Imitation Jewellery Categories (from Flipkart-inspired prompt)
    const categoriesData = [
      { name: 'Earrings', slug: 'earrings', description: 'Antique kemp jhumkas, chandbalis, and pearl drop studs.', image_url: '/uploads/earring.png', display_order: 1 },
      { name: 'Necklaces', slug: 'necklaces', description: 'Heirloom temple chokers, mango malas and royal bridal necklaces.', image_url: '/uploads/necklaces.png', display_order: 2 },
      { name: 'Necklace Sets', slug: 'necklace-sets', description: 'Coordinated necklace and earring bridal sets.', image_url: '/uploads/jewels.png', display_order: 3 },
      { name: 'Bangles', slug: 'bangles', description: 'Traditional kada bangles, valayal sets, and antique floral cuffs.', image_url: '/uploads/bangles.png', display_order: 4 },
      { name: 'Bracelets', slug: 'bracelets', description: 'Dainty gold plated charm bracelets and cuff bangles.', image_url: '/uploads/bangles.png', display_order: 5 },
      { name: 'Rings', slug: 'rings', description: 'Exquisite statement cocktail rings and Navratna gemstone bands.', image_url: '/uploads/rings.png', display_order: 6 },
      { name: 'Anklets', slug: 'anklets', description: 'Antique payal and delicate bell ghungroo anklets.', image_url: '/uploads/Royal Gold Jewellery Collection.png', display_order: 7 },
      { name: 'Mangalsutra', slug: 'mangalsutra', description: 'Traditional black bead gold plated mangalsutras and modern pendant chains.', image_url: '/uploads/necklaces.png', display_order: 8 },
      { name: 'Bridal Jewellery', slug: 'bridal-jewellery', description: 'Complete grand bridal trousseau collections for wedding muhurthams.', image_url: '/uploads/Royal Gold Jewellery Collection.png', display_order: 9 },
      { name: 'Temple Jewellery', slug: 'temple-jewellery', description: 'Traditional nakshi carved South Indian deity motifs.', image_url: '/uploads/necklaces.png', display_order: 10 },
      { name: 'Antique Jewellery', slug: 'antique-jewellery', description: '24k matte antique gold patina finish jewellery.', image_url: '/uploads/jewels.png', display_order: 11 },
      { name: 'American Diamond Jewellery', slug: 'american-diamond-jewellery', description: 'High-sparkle zircon and CZ crystal glamour pieces.', image_url: '/uploads/rings.png', display_order: 12 },
      { name: 'Daily Wear Jewellery', slug: 'daily-wear-jewellery', description: 'Lightweight anti-tarnish everyday earrings, chains, and rings.', image_url: '/uploads/earring.png', display_order: 13 },
      { name: 'Festive Collections', slug: 'festive-collections', description: 'Statement festive jewellery for Diwali, Pongal, Navratri, and weddings.', image_url: '/uploads/jewels.png', display_order: 14 }
    ];

    const createdCategories = {};
    for (const cat of categoriesData) {
      const [c] = await models.Category.findOrCreate({
        where: { slug: cat.slug },
        defaults: cat
      });
      createdCategories[cat.slug] = c.id;
    }

    // 3. Seed Imitation Jewellery Products across categories
    const productsData = [
      {
        name: 'Temple Lakshmi Royal Choker & Necklace',
        slug: 'temple-lakshmi-necklace',
        short_description: 'Intricately handcrafted Goddess Lakshmi motif with antique kemp stones.',
        description: 'This temple necklace is an ode to timeless South Indian bridal grandeur. Featuring an ornate central pendant of Goddess Lakshmi flanked by dancing peacocks, accented with deep red kemp stones and natural freshwater pearls. Plated in 24k antique matte gold finish.',
        original_price: 54900,
        selling_price: 48500,
        sku: 'TEE-NCK-001',
        stock: 12,
        material: '24k Antique Matte Gold Plating',
        colour: 'Ruby Red & Gold',
        occasion: 'Bridal & Muhurtham',
        collection_type: 'Temple Heritage',
        weight: '128g',
        dimensions: 'Length: 22cm, Width: 6.5cm',
        rating: 4.9,
        reviews_count: 142,
        is_featured: true,
        category_id: createdCategories['necklaces'],
        images: ['/uploads/necklaces.png', '/uploads/jewels.png']
      },
      {
        name: 'South Indian Antique Pearl Jhumka Earrings',
        slug: 'pearl-jhumka-earrings',
        short_description: 'Tiered temple jhumkis with delicate seed pearl clusters.',
        description: 'Classic bell-shaped jhumkas suspended from an intricate floral ear stud. Finished with a fringe of micro seed pearls that sway gently with every step. Perfect for festive celebrations and wedding receptions.',
        original_price: 21500,
        selling_price: 18900,
        sku: 'TEE-EAR-002',
        stock: 18,
        material: 'Hypoallergenic Brass with Dual Gold Wash',
        colour: 'Antique Gold & Pearl White',
        occasion: 'Festive & Sangeet',
        collection_type: 'Best Seller',
        weight: '42g',
        dimensions: 'Drop Length: 6.5cm, Width: 3.2cm',
        rating: 4.8,
        reviews_count: 98,
        is_featured: true,
        category_id: createdCategories['earrings'],
        images: ['/uploads/earring.png']
      },
      {
        name: 'Royal Heritage Antique Gold Filigree Bangles',
        slug: 'antique-gold-bangles',
        short_description: 'Pair of handcrafted filigree kadas with floral motifs.',
        description: 'Pair of solid kada bangles showcasing openwork filigree craft inspired by temple architecture. Screw-fastened for a comfortable, secure fit on wrist sizes 2.4 to 2.8.',
        original_price: 36000,
        selling_price: 32400,
        sku: 'TEE-BNG-003',
        stock: 8,
        material: 'Cast Artisan Brass with 24k Gold Layering',
        colour: 'Antique Gold',
        occasion: 'Bridal & Festive',
        collection_type: 'Trending',
        weight: '96g',
        dimensions: 'Width: 2.8cm, Fits wrist size 2.4-2.8',
        rating: 4.9,
        reviews_count: 76,
        is_featured: true,
        category_id: createdCategories['bangles'],
        images: ['/uploads/bangles.png']
      },
      {
        name: 'Kemp Gemstone Floral Cocktail Ring',
        slug: 'gemstone-cocktail-ring',
        short_description: 'Statement ruby and polki flower ring on vintage gold band.',
        description: 'Centred with an oval cabochon synthetic ruby surrounded by floral petals encrusted with un-cut polki crystals. The adjustable band ensures effortless styling across fingers.',
        original_price: 14500,
        selling_price: 12600,
        sku: 'TEE-RNG-004',
        stock: 25,
        material: 'Copper-Brass Alloy with Micro Gold Finish',
        colour: 'Ruby Red & Polki White',
        occasion: 'Party & Cocktail',
        collection_type: 'Top-Rated',
        weight: '18g',
        dimensions: 'Ring Crown Diameter: 3.4cm',
        rating: 4.7,
        reviews_count: 54,
        is_featured: true,
        category_id: createdCategories['rings'],
        images: ['/uploads/Ornate Ruby Floral Ring on Purple Velvet.png', '/uploads/rings.png']
      },
      {
        name: 'Temple Goddess Lakshmi Bridal Vaddanam Waist Belt',
        slug: 'temple-waist-belt',
        short_description: 'Bridal ottiyanam featuring Nakshi carvings and pearl latkans.',
        description: 'An heirloom vaddanam waist belt crafted for the contemporary bride. The central panel depicts Goddess Lakshmi surrounded by miniature carved deities, ending in flowing pearl drop tassels with an adjustable link chain.',
        original_price: 62000,
        selling_price: 54900,
        sku: 'TEE-BLT-005',
        stock: 6,
        material: 'Solid Core Brass with 24k Matte Gold Plate',
        colour: 'Antique Matte Gold',
        occasion: 'Bridal Muhurtham',
        collection_type: 'Bridal Jewellery',
        weight: '210g',
        dimensions: 'Span: 85cm with 20cm extender',
        rating: 5.0,
        reviews_count: 45,
        is_featured: true,
        category_id: createdCategories['bridal-jewellery'],
        images: ['/uploads/waist belt.png', '/uploads/Royal Gold Jewellery Collection.png']
      },
      {
        name: 'Maharani Brass Heirloom Jewellery Chest',
        slug: 'heirloom-jewellery-chest',
        short_description: 'Handcrafted velvet-lined wooden chest for heirloom preservation.',
        description: 'Designed exclusively for keeping your precious temple jewellery tarnishing-free. Featuring carved brass fittings, secret velvet drawers, and custom dividers for necklaces, bangles, and rings.',
        original_price: 10500,
        selling_price: 8900,
        sku: 'TEE-BOX-006',
        stock: 15,
        material: 'Sheesham Rosewood & Brass Fittings',
        colour: 'Rich Walnut & Crimson Velvet',
        occasion: 'Gifting & Keepsake',
        collection_type: 'Festive Special',
        weight: '2.8kg',
        dimensions: '32cm x 22cm x 18cm',
        rating: 4.9,
        reviews_count: 83,
        is_featured: true,
        category_id: createdCategories['festive-collections'],
        images: ['/uploads/Royal Gold Jewellery Collection.png']
      },
      {
        name: 'Royal Heritage Grand Bridal Necklace Set',
        slug: 'royal-heritage-necklace-set',
        short_description: 'Grand matching choker, long haram, and matching jhumkis.',
        description: 'A complete bridal trousseau package comprising a grand guttapusalu choker, peacock haram, matching tiered jhumkas, and maang tikka.',
        original_price: 78000,
        selling_price: 68500,
        sku: 'TEE-SET-007',
        stock: 5,
        material: '24K Antique Matte Gold Micro-Plating',
        colour: 'Emerald Green & Kemp Ruby',
        occasion: 'Bridal Wedding',
        collection_type: 'Bridal Jewellery',
        weight: '280g',
        dimensions: 'Choker & Long Haram Set',
        rating: 5.0,
        reviews_count: 38,
        is_featured: true,
        category_id: createdCategories['necklace-sets'],
        images: ['/uploads/jewels.png']
      },
      {
        name: 'Traditional Kemp Ghungroo Payal Anklets',
        slug: 'kemp-ghungroo-payal-anklets',
        short_description: 'Pair of melodic temple bell anklets with kemp floral clusters.',
        description: 'Exquisite antique gold anklets handcrafted with soothing musical ghungroo bells and ruby kemp stones.',
        original_price: 15500,
        selling_price: 13200,
        sku: 'TEE-ANK-008',
        stock: 14,
        material: 'Jeweller Brass Alloy with Anti-Tarnish Finish',
        colour: 'Antique Gold',
        occasion: 'Festive & Classical Dance',
        collection_type: 'Trending',
        weight: '65g',
        dimensions: 'Length: 26cm (Pair)',
        rating: 4.8,
        reviews_count: 42,
        is_featured: true,
        category_id: createdCategories['anklets'],
        images: ['/uploads/Royal Gold Jewellery Collection.png']
      },
      {
        name: 'Auspicious Lakshmi Gold Plated Mangalsutra',
        slug: 'lakshmi-gold-mangalsutra',
        short_description: 'Traditional double line black bead chain with auspicious Lakshmi thali pendant.',
        description: 'Hand-knotted black beads on gold wire featuring a sacred Goddess Lakshmi motif pendant flanked by basra pearls.',
        original_price: 18000,
        selling_price: 15400,
        sku: 'TEE-MNG-009',
        stock: 20,
        material: '24k Micron Gold Plated Silver & Brass',
        colour: 'Black & Gold',
        occasion: 'Daily & Auspicious',
        collection_type: 'Daily Wear',
        weight: '24g',
        dimensions: 'Chain Length: 30 inches',
        rating: 4.9,
        reviews_count: 91,
        is_featured: true,
        category_id: createdCategories['mangalsutra'],
        images: ['/uploads/necklaces.png']
      },
      {
        name: 'American Diamond Solitaire Halo Cocktail Ring',
        slug: 'american-diamond-cocktail-ring',
        short_description: 'Cubic Zirconia brilliant cut statement halo ring in rose-gold tone.',
        description: 'Premium American Diamond round brilliant solitaire surrounded by a double cushion halo of micro pavé crystals.',
        original_price: 9500,
        selling_price: 7800,
        sku: 'TEE-ADR-010',
        stock: 22,
        material: 'Rhodium & Rose Gold Plated Jeweller Brass',
        colour: 'Diamond White & Rose Gold',
        occasion: 'Reception & Evening Party',
        collection_type: 'American Diamond',
        weight: '12g',
        dimensions: 'Center Stone: 2 Carat equivalent',
        rating: 4.7,
        reviews_count: 67,
        is_featured: true,
        category_id: createdCategories['american-diamond-jewellery'],
        images: ['/uploads/rings.png']
      },
      {
        name: 'Dainty Daily Wear Floral Stud Earrings',
        slug: 'daily-wear-floral-studs',
        short_description: 'Lightweight everyday ruby flower studs with Bombay screw back.',
        description: 'Minimalist floral studs crafted for daily comfort. Skin-friendly hypoallergenic plating suitable for continuous wear.',
        original_price: 6500,
        selling_price: 5200,
        sku: 'TEE-DLY-011',
        stock: 35,
        material: 'Hypoallergenic Brass with Nickel-Free Plating',
        colour: 'Ruby & Antique Gold',
        occasion: 'Daily Wear & Office',
        collection_type: 'Budget-Friendly',
        weight: '8g',
        dimensions: '1.2cm diameter',
        rating: 4.8,
        reviews_count: 110,
        is_featured: false,
        category_id: createdCategories['daily-wear-jewellery'],
        images: ['/uploads/earring.png']
      },
      {
        name: 'Navratna Royal Openable Kada Bracelet',
        slug: 'navratna-kada-bracelet',
        short_description: 'Nine planetary gemstones embedded in an openable hinge cuff bracelet.',
        description: 'Traditional Navratna kada bracelet featuring authentic planetary gemstone hues set on an intricately engraved floral gold cuff.',
        original_price: 24000,
        selling_price: 20500,
        sku: 'TEE-BRC-012',
        stock: 11,
        material: 'Artisan Brass with Antique Gold Patina',
        colour: 'Multi-Colour Gemstones & Gold',
        occasion: 'Festive & Auspicious',
        collection_type: 'Trending',
        weight: '48g',
        dimensions: 'Openable Free-Size',
        rating: 4.9,
        reviews_count: 53,
        is_featured: true,
        category_id: createdCategories['bracelets'],
        images: ['/uploads/bangles.png']
      }
    ];

    for (const pData of productsData) {
      const { images, ...pFields } = pData;
      const [product, created] = await models.Product.findOrCreate({
        where: { slug: pFields.slug },
        defaults: pFields
      });

      if (created && images && images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          await models.ProductImage.create({
            product_id: product.id,
            image_url: images[i],
            is_primary: i === 0,
            display_order: i
          });
        }
      }
    }

    // 4. Seed Banners
    const bannersCount = await models.Banner.count();
    if (bannersCount === 0) {
      await models.Banner.create({
        title: 'Tradition, Beautifully Curated.',
        subtitle: 'Timeless imitation jewellery for every celebration, crafted in 24k antique gold.',
        kick: 'The Ethnic Edit',
        button_text: 'Shop the Collection',
        button_link: '/shop',
        desktop_image: '/uploads/jewels.png',
        mobile_image: '/uploads/jewels.png',
        type: 'hero',
        display_order: 1,
        is_active: true
      });

      await models.Banner.create({
        title: 'Bridal Grandeur Showcase.',
        subtitle: 'Temple Lakshmi Chokers, Vaddanams, and Kemp Jhumkas for the bride.',
        kick: 'South Indian Heritage',
        button_text: 'Explore Bridal',
        button_link: '/category/bridal-jewellery',
        desktop_image: '/uploads/Royal Gold Jewellery Collection.png',
        mobile_image: '/uploads/Royal Gold Jewellery Collection.png',
        type: 'hero',
        display_order: 2,
        is_active: true
      });
    }

    // 5. Seed Coupons
    await models.Coupon.findOrCreate({
      where: { code: 'WELCOME10' },
      defaults: {
        code: 'WELCOME10',
        type: 'percentage',
        value: 10,
        min_order_value: 5000,
        max_discount: 5000,
        usage_limit: 500,
        is_active: true
      }
    });

    await models.Coupon.findOrCreate({
      where: { code: 'ETHNIC20' },
      defaults: {
        code: 'ETHNIC20',
        type: 'percentage',
        value: 20,
        min_order_value: 15000,
        max_discount: 10000,
        usage_limit: 200,
        is_active: true
      }
    });

    console.log('✓ [DB] Seeding completed successfully!');
  } catch (error) {
    console.error('❌ [DB] Seeding error:', error);
  }
};
