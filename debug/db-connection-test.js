// debug/db-connection-test.js
const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
  try {
    console.log('Attempting to connect to MongoDB...');
    console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Defined' : 'Not defined');
    
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/pinnacle"
    );
    
    console.log('Successfully connected to MongoDB!');
    
    // Test if the Order collection exists and has documents
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections in database:');
    collections.forEach(collection => console.log(` - ${collection.name}`));
    
    if (mongoose.connection.models.Order || mongoose.models.Order) {
      const orderCount = await mongoose.connection.db.collection('orders').countDocuments();
      console.log(`Found ${orderCount} documents in the orders collection`);
    } else {
      console.log('Order model is not defined in the current connection');
    }
    
    await mongoose.connection.close();
    console.log('Connection closed');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
}

testConnection();
