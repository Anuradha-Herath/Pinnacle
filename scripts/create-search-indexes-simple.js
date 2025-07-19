const mongoose = require('mongoose');

async function createSearchIndexes() {
  // For development - you can set MONGODB_URI here temporarily
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/pinnacle';
  
  if (!process.env.MONGODB_URI) {
    console.log('⚠️  MONGODB_URI not found in environment variables');
    console.log('📝 Using default local MongoDB connection');
    console.log('💡 To use your actual database, set MONGODB_URI environment variable');
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
      if (error.code === 85) {
        console.log('ℹ️  Text search index already exists');
      } else {
        console.log('❌ Error creating text index:', error.message);
      }
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
        if (error.code === 85) {
          console.log(`ℹ️  Index for ${Object.keys(index)[0]} already exists`);
        } else {
          console.log(`❌ Error creating index for ${Object.keys(index)[0]}:`, error.message);
        }
      }
    }

    // Show existing indexes
    const existingIndexes = await collection.indexes();
    console.log('\n📋 Current indexes:');
    existingIndexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });

    console.log('\n🎉 Search optimization complete!');
    console.log('🚀 Your search should now be much faster');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure MongoDB is running');
    console.log('2. Check your MONGODB_URI connection string');
    console.log('3. Verify database permissions');
  } finally {
    await mongoose.connection.close();
    console.log('\n🔒 Database connection closed');
  }
}

createSearchIndexes().catch(console.error);
