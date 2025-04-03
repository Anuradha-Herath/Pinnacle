import mongoose from 'mongoose';

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pinnacle';

// Connection state tracking
interface MongoConnection {
  isConnected: number;
}

// Global connection state
const connection: MongoConnection = {
  isConnected: 0
};

// Connect to MongoDB
export async function connectToDatabase() {
  if (connection.isConnected) {
    console.log('Using existing MongoDB connection');
    return;
  }

  console.log('Creating new MongoDB connection');
  try {
    const db = await mongoose.connect(MONGODB_URI);
    connection.isConnected = db.connections[0].readyState;
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

// Handle app shutdown gracefully
if (process.env.NODE_ENV !== 'development') {
  mongoose.connection.on('connected', () => {
    console.log('MongoDB connected');
  });
  
  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
  });
  
  mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
  });
  
  // Handle app termination
  process.on('SIGINT', async () => {
    await mongoose.connection.close();
    process.exit(0);
  });
}
