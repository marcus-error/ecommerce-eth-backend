import { DataTypes } from 'sequelize';

export const defineModels = (sequelize) => {
  // 1. User
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(120),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
      validate: { isEmail: true }
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('admin', 'customer'),
      defaultValue: 'customer'
    },
    phone: {
      type: DataTypes.STRING(30),
      allowNull: true
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'users',
    timestamps: true
  });

  // 2. Category
  const Category = sequelize.define('Category', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    slug: {
      type: DataTypes.STRING(120),
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    image_url: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    display_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    is_published: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'categories',
    timestamps: true
  });

  // 3. Product
  const Product = sequelize.define('Product', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    slug: {
      type: DataTypes.STRING(220),
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    short_description: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    original_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    selling_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    sku: {
      type: DataTypes.STRING(80),
      allowNull: true,
      unique: true
    },
    stock: {
      type: DataTypes.INTEGER,
      defaultValue: 10
    },
    material: {
      type: DataTypes.STRING(120),
      allowNull: true,
      defaultValue: '24K Antique Matte Gold Plating'
    },
    colour: {
      type: DataTypes.STRING(80),
      allowNull: true,
      defaultValue: 'Antique Gold & Ruby'
    },
    occasion: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: 'Bridal & Festive'
    },
    collection_type: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: 'Temple Heritage'
    },
    weight: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: '85 grams'
    },
    dimensions: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: 'Standard Adjustable'
    },
    rating: {
      type: DataTypes.DECIMAL(3, 1),
      defaultValue: 4.8
    },
    reviews_count: {
      type: DataTypes.INTEGER,
      defaultValue: 72
    },
    is_featured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    is_published: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    tableName: 'products',
    timestamps: true
  });

  // 4. Product Image
  const ProductImage = sequelize.define('ProductImage', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    image_url: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    is_primary: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    display_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    original_filename: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  }, {
    tableName: 'product_images',
    timestamps: true
  });

  // 5. Product Variant
  const ProductVariant = sequelize.define('ProductVariant', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    title: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    sku: {
      type: DataTypes.STRING(80),
      allowNull: true
    },
    price_adjustment: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    stock: {
      type: DataTypes.INTEGER,
      defaultValue: 10
    }
  }, {
    tableName: 'product_variants',
    timestamps: true
  });

  // 6. Banner
  const Banner = sequelize.define('Banner', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING(180),
      allowNull: false
    },
    subtitle: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    kick: {
      type: DataTypes.STRING(80),
      defaultValue: 'The Ethnic Edit'
    },
    button_text: {
      type: DataTypes.STRING(60),
      defaultValue: 'Shop the Collection'
    },
    button_link: {
      type: DataTypes.STRING(200),
      defaultValue: '#shop'
    },
    desktop_image: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    mobile_image: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    type: {
      type: DataTypes.ENUM('hero', 'promo', 'arches'),
      defaultValue: 'hero'
    },
    display_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'banners',
    timestamps: true
  });

  // 7. Order
  const Order = sequelize.define('Order', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    order_number: {
      type: DataTypes.STRING(40),
      allowNull: false,
      unique: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    customer_name: {
      type: DataTypes.STRING(120),
      allowNull: false
    },
    customer_email: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
    customer_phone: {
      type: DataTypes.STRING(30),
      allowNull: false
    },
    shipping_address: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    total_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    discount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    shipping_fee: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    payment_method: {
      type: DataTypes.STRING(40),
      defaultValue: 'cod'
    },
    payment_status: {
      type: DataTypes.ENUM('pending', 'paid', 'failed', 'refunded'),
      defaultValue: 'pending'
    },
    order_status: {
      type: DataTypes.ENUM(
        'Pending',
        'Confirmed',
        'Processing',
        'Packed',
        'Shipped',
        'Out for delivery',
        'Delivered',
        'Cancelled'
      ),
      defaultValue: 'Pending'
    },
    tracking_number: {
      type: DataTypes.STRING(80),
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'orders',
    timestamps: true
  });

  // 8. Order Item
  const OrderItem = sequelize.define('OrderItem', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    order_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    product_name: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    image_url: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    variant_name: {
      type: DataTypes.STRING(100),
      allowNull: true
    }
  }, {
    tableName: 'order_items',
    timestamps: true
  });

  // 9. Coupon
  const Coupon = sequelize.define('Coupon', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    code: {
      type: DataTypes.STRING(40),
      allowNull: false,
      unique: true
    },
    type: {
      type: DataTypes.ENUM('percentage', 'fixed'),
      defaultValue: 'percentage'
    },
    value: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    min_order_value: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    max_discount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    usage_limit: {
      type: DataTypes.INTEGER,
      defaultValue: 100
    },
    usage_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    expiry_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'coupons',
    timestamps: true
  });

  // 10. Inventory Transaction
  const InventoryTransaction = sequelize.define('InventoryTransaction', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('IN', 'OUT', 'ADJUSTMENT'),
      allowNull: false
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    reason: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    created_by: {
      type: DataTypes.STRING(100),
      defaultValue: 'system'
    }
  }, {
    tableName: 'inventory_transactions',
    timestamps: true
  });

  // 11. Review
  const Review = sequelize.define('Review', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    customer_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    location: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: 'Verified Patron'
    },
    product_name: {
      type: DataTypes.STRING(150),
      allowNull: true
    },
    rating: {
      type: DataTypes.INTEGER,
      defaultValue: 5
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    is_approved: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'reviews',
    timestamps: true
  });

  // 12. Store Setting
  const StoreSetting = sequelize.define('StoreSetting', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    key: {
      type: DataTypes.STRING(80),
      allowNull: false,
      unique: true
    },
    value: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'store_settings',
    timestamps: true
  });

  // 13. Audit Log
  const AuditLog = sequelize.define('AuditLog', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    action: {
      type: DataTypes.STRING(120),
      allowNull: false
    },
    details: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    ip_address: {
      type: DataTypes.STRING(50),
      allowNull: true
    }
  }, {
    tableName: 'audit_logs',
    timestamps: true
  });

  // Associations
  Category.hasMany(Product, { foreignKey: 'category_id', as: 'products', onDelete: 'SET NULL' });
  Product.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });

  Product.hasMany(ProductImage, { foreignKey: 'product_id', as: 'images', onDelete: 'CASCADE' });
  ProductImage.belongsTo(Product, { foreignKey: 'product_id' });

  Product.hasMany(ProductVariant, { foreignKey: 'product_id', as: 'variants', onDelete: 'CASCADE' });
  ProductVariant.belongsTo(Product, { foreignKey: 'product_id' });

  Product.hasMany(Review, { foreignKey: 'product_id', as: 'reviews', onDelete: 'CASCADE' });
  Review.belongsTo(Product, { foreignKey: 'product_id' });

  Product.hasMany(InventoryTransaction, { foreignKey: 'product_id', as: 'inventory_transactions', onDelete: 'CASCADE' });
  InventoryTransaction.belongsTo(Product, { foreignKey: 'product_id' });

  User.hasMany(Order, { foreignKey: 'user_id', as: 'orders', onDelete: 'SET NULL' });
  Order.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

  Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items', onDelete: 'CASCADE' });
  OrderItem.belongsTo(Order, { foreignKey: 'order_id' });

  return {
    User,
    Category,
    Product,
    ProductImage,
    ProductVariant,
    Banner,
    Order,
    OrderItem,
    Coupon,
    InventoryTransaction,
    Review,
    StoreSetting,
    AuditLog
  };
};

