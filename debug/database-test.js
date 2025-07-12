// Simple database connection test script
// Run this to test if the database connection is working
const { MongoClient } = require('mongodb');

async function testConnection() {
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    console.error('❌ MONGODB_URI environment variable is not set');
    return;
  }
  
  console.log('🔍 Testing MongoDB connection...');
  console.log('URI (partial):', uri.substring(0, 20) + '...');
  
  const client = new MongoClient(uri);
  
  try {
    // Connect to MongoDB
    await client.connect();
    console.log('✅ Connected to MongoDB successfully');
    
    // List databases
    const adminDb = client.db().admin();
    const databases = await adminDb.listDatabases();
    console.log('📊 Available databases:', databases.databases.map(db => db.name));
    
    // Test the specific database
    const db = client.db();
    console.log('🎯 Current database name:', db.databaseName);
    
    // List collections
    const collections = await db.listCollections().toArray();
    console.log('📋 Collections in database:', collections.map(col => col.name));
    
    // Test products collection
    const productsCollection = db.collection('products');
    const productCount = await productsCollection.countDocuments();
    console.log(`📦 Total products in database: ${productCount}`);
    
    // Test a few sample products
    const sampleProducts = await productsCollection.find({}).limit(3).toArray();
    console.log('🔍 Sample products:');
    sampleProducts.forEach((product, index) => {
      console.log(`  ${index + 1}. ${product.productName} (Category: ${product.category})`);
    });
    
    // Test inventory collection
    const inventoryCollection = db.collection('inventories');
    const inventoryCount = await inventoryCollection.countDocuments();
    console.log(`📋 Total inventory items: ${inventoryCount}`);
    
    const inStockCount = await inventoryCollection.countDocuments({ status: 'In Stock' });
    console.log(`✅ Items in stock: ${inStockCount}`);
    
    // Test Women category specifically
    const womenProducts = await productsCollection.find({
      category: { $regex: /^(women|womens)$/i }
    }).limit(5).toArray();
    console.log(`👩 Women products found: ${womenProducts.length}`);
    womenProducts.forEach((product, index) => {
      console.log(`  ${index + 1}. ${product.productName} (Category: ${product.category})`);
    });
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await client.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the test
testConnection().catch(console.error);
