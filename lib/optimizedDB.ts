import mongoose from 'mongoose';

interface Connection {
  isConnected?: number;
}

const connection: Connection = {};

async function connectDB() {
  // Check if we have an existing connection
  if (connection.isConnected) {
    console.log('Using existing database connection');
    return;
  }

  try {
    // Use new connection with optimized settings for performance
    const db = await mongoose.connect(process.env.MONGODB_URI!, {
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      bufferCommands: false, // Disable mongoose buffering
    });

    connection.isConnected = db.connections[0].readyState;
    console.log('Connected to MongoDB with optimized settings');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw new Error('Failed to connect to database');
  }
}

export default connectDB;
