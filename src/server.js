import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { initDatabase } from './config/database.js';
import { defineModels } from './models/index.js';
import { seedDatabase } from './utils/seed.js';
import { createApp } from './app.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const PORT = process.env.PORT || 5000;

export async function autoMigrateSchema(sequelize) {
  try {
    const dialect = sequelize.getDialect();
    if (dialect === 'mysql') {
      console.log('🔄 [DB Migration] Checking MySQL schema for missing columns...');
      try {
        const [columns] = await sequelize.query("SHOW COLUMNS FROM `products`");
        const colNames = new Set(columns.map((c) => c.Field));

        const productCols = [
          { name: 'material', sql: 'VARCHAR(120) NULL DEFAULT "24K Antique Matte Gold Plating"' },
          { name: 'colour', sql: 'VARCHAR(80) NULL DEFAULT "Antique Gold & Ruby"' },
          { name: 'occasion', sql: 'VARCHAR(100) NULL DEFAULT "Bridal & Festive"' },
          { name: 'collection_type', sql: 'VARCHAR(100) NULL DEFAULT "Temple Heritage"' },
          { name: 'weight', sql: 'VARCHAR(50) NULL DEFAULT "85 grams"' },
          { name: 'dimensions', sql: 'VARCHAR(100) NULL DEFAULT "Standard Adjustable"' },
          { name: 'rating', sql: 'DECIMAL(3, 1) NULL DEFAULT 4.8' },
          { name: 'reviews_count', sql: 'INT NULL DEFAULT 50' },
          { name: 'is_featured', sql: 'TINYINT(1) NULL DEFAULT 0' },
          { name: 'is_published', sql: 'TINYINT(1) NULL DEFAULT 1' }
        ];

        for (const col of productCols) {
          if (!colNames.has(col.name)) {
            console.log(`✓ [DB Migration] Adding missing column \`${col.name}\` to \`products\` table...`);
            await sequelize.query(`ALTER TABLE \`products\` ADD COLUMN \`${col.name}\` ${col.sql}`);
          }
        }

        try {
          const [imgCols] = await sequelize.query("SHOW COLUMNS FROM `product_images`");
          const imgColNames = new Set(imgCols.map((c) => c.Field));
          if (!imgColNames.has('public_id')) {
            await sequelize.query('ALTER TABLE `product_images` ADD COLUMN `public_id` VARCHAR(255) NULL');
          }
        } catch (imgErr) {}

        try {
          const [revCols] = await sequelize.query("SHOW COLUMNS FROM `reviews`");
          const revColNames = new Set(revCols.map((c) => c.Field));
          if (!revColNames.has('location')) {
            await sequelize.query('ALTER TABLE `reviews` ADD COLUMN `location` VARCHAR(100) NULL DEFAULT "Verified Patron"');
          }
          if (!revColNames.has('product_name')) {
            await sequelize.query('ALTER TABLE `reviews` ADD COLUMN `product_name` VARCHAR(150) NULL');
          }
          if (!revColNames.has('image_url')) {
            await sequelize.query('ALTER TABLE `reviews` ADD COLUMN `image_url` TEXT NULL');
          }
          await sequelize.query('ALTER TABLE `reviews` MODIFY COLUMN `product_id` INT NULL');
        } catch (revErr) {
          // reviews table will be created by sync if not present
        }

        console.log('✓ [DB Migration] MySQL columns verified.');
      } catch (tableErr) {
        // Table may not exist yet, sync will create it
      }
    } else if (dialect === 'sqlite') {
      try {
        const [prodCols] = await sequelize.query("PRAGMA table_info(products);");
        const prodColNames = new Set(prodCols.map((c) => c.name));
        const sqliteProductCols = [
          { name: 'material', sql: 'VARCHAR(120) DEFAULT "24K Antique Matte Gold Plating"' },
          { name: 'colour', sql: 'VARCHAR(80) DEFAULT "Antique Gold & Ruby"' },
          { name: 'occasion', sql: 'VARCHAR(100) DEFAULT "Bridal & Festive"' },
          { name: 'collection_type', sql: 'VARCHAR(100) DEFAULT "Temple Heritage"' },
          { name: 'weight', sql: 'VARCHAR(50) DEFAULT "85 grams"' },
          { name: 'dimensions', sql: 'VARCHAR(100) DEFAULT "Standard Adjustable"' },
          { name: 'rating', sql: 'DECIMAL(3, 1) DEFAULT 4.8' },
          { name: 'reviews_count', sql: 'INT DEFAULT 50' },
          { name: 'is_featured', sql: 'BOOLEAN DEFAULT 0' },
          { name: 'is_published', sql: 'BOOLEAN DEFAULT 1' }
        ];
        for (const col of sqliteProductCols) {
          if (prodCols.length > 0 && !prodColNames.has(col.name)) {
            await sequelize.query(`ALTER TABLE products ADD COLUMN ${col.name} ${col.sql};`);
          }
        }

        const [revCols] = await sequelize.query("PRAGMA table_info(reviews);");
        const revColNames = new Set(revCols.map((c) => c.name));
        if (revCols.length > 0 && !revColNames.has('location')) {
          await sequelize.query("ALTER TABLE reviews ADD COLUMN location VARCHAR(100) DEFAULT 'Verified Patron';");
        }
        if (revCols.length > 0 && !revColNames.has('product_name')) {
          await sequelize.query("ALTER TABLE reviews ADD COLUMN product_name VARCHAR(150);");
        }
        if (revCols.length > 0 && !revColNames.has('image_url')) {
          await sequelize.query("ALTER TABLE reviews ADD COLUMN image_url TEXT;");
        }
      } catch (e) {}
    }
  } catch (err) {
    console.warn('⚠️ [DB Migration Notice]:', err.message);
  }
}

async function bootstrap() {
  try {
    console.log('✨ [Server] Starting The Ethnic Edit Full-Stack API...');

    // 1. Initialize DB (MySQL or SQLite fallback)
    const sequelize = await initDatabase();

    // 2. Define Models and Associations
    const models = defineModels(sequelize);

    // 3. Migrate and Sync Tables
    await autoMigrateSchema(sequelize);
    try {
      await sequelize.sync({ alter: true });
    } catch (syncErr) {
      console.warn('Sync alter notice:', syncErr.message);
      await sequelize.sync({ alter: false });
    }
    console.log('✓ [DB] Tables synchronized successfully.');

    // 4. Seed Database with initial data if empty
    await seedDatabase(models);

    // 5. Create Express App
    const app = createApp(models);

    // 6. Start HTTP Server with smart port retry
    const server = app.listen(PORT, () => {
      console.log(`\n======================================================`);
      console.log(`🚀 [Server] The Ethnic Edit API running on port ${PORT}`);
      console.log(`📍 REST API URL: http://localhost:${PORT}/api`);
      console.log(`🖼️ Media Uploads: http://localhost:${PORT}/uploads`);
      console.log(`🔐 Admin Login: admin@theethnicedit.com / admin123`);
      console.log(`👤 Customer:    customer@theethnicedit.com / customer123`);
      console.log(`======================================================\n`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        const fallbackPort = Number(PORT) + 1;
        console.warn(`⚠️ [Server] Port ${PORT} in use, switching to port ${fallbackPort}...`);
        app.listen(fallbackPort, () => {
          console.log(`🚀 [Server] The Ethnic Edit API running on fallback port ${fallbackPort}`);
        });
      } else {
        console.error('Server error:', err);
      }
    });
  } catch (err) {
    console.error('Fatal Server Boot Error:', err);
    process.exit(1);
  }
}

bootstrap();
