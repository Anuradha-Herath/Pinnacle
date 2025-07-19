const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Try to load environment variables from various possible locations
const envPaths = [
  path.join(__dirname, '..', '.env.local'),
  path.join(__dirname, '..', '.env'),
  path.join(process.cwd(), '.env.local'),
  path.join(process.cwd(), '.env')
];

let envLoaded = false;
for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    try {
      require('dotenv').config({ path: envPath });
      console.log(`📄 Loaded environment from: ${envPath}`);
      envLoaded = true;
      break;
    } catch (err) {
      // dotenv might not be installed, that's okay if env vars are already set
      console.log(`⚠️  Could not load dotenv, but environment file exists: ${envPath}`);
    }
  }
}

if (!envLoaded) {
  console.log('⚠️  No .env file found. Checking if MONGODB_URI is set in environment...');
}

async function createSearchIndexes() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI environment variable is not set');
    console.log('\n📋 To fix this:');
    console.log('1. Copy .env.local.example to .env.local');
    console.log('2. Fill in your actual MongoDB connection string');
    console.log('3. Run the command again');
    process.exit(1);
  }

  console.log('🔗 Connecting to MongoDB...');

  try {
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('products');

    // Create text indexes for search
    try {
      await collection.createIndex({ 
        productName: 'text', 
        category: 'text', 
        subCategory: 'text', 
        tag: 'text' 
      }, {
        name: 'search_text_index',
        background: true
      });
      console.log('✅ Created text search index');
    } catch (error) {
      console.log('Text index might already exist:', error.message);
    }

    // Create individual field indexes
    const indexes = [
      { productName: 1 },
      { category: 1 },
      { subCategory: 1 },
      { tag: 1 },
      { createdAt: -1 }
    ];

    for (const index of indexes) {
      try {
        await collection.createIndex(index, { background: true });
        console.log(`✅ Created index for ${Object.keys(index)[0]}`);
      } catch (error) {
        console.log(`Index for ${Object.keys(index)[0]} might already exist:`, error.message);
      }
    }

    // Show existing indexes
    const existingIndexes = await collection.indexes();
    console.log('\n📋 Current indexes:');
    existingIndexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });

  } catch (error) {
    console.error('Error creating indexes:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔒 Database connection closed');
  }
}

createSearchIndexes().catch(console.error);
