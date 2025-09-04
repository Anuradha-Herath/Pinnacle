import mongoose from 'mongoose';

interface Connection {
  isConnected?: number;
}

const connection: Connection = {};

async function connectDB() {
  // Check if we have an active connection (readyState 1 = connected)
  if (mongoose.connection.readyState === 1) {
    console.log('Using existing active database connection');
    return;
  }

  // If connection is in progress, wait for it
  if (mongoose.connection.readyState === 2) {
    console.log('Database connection in progress, waiting...');
    return new Promise((resolve, reject) => {
      mongoose.connection.once('connected', resolve);
      mongoose.connection.once('error', reject);
    });
  }

  try {
    console.log('Establishing new database connection...');
    
    // Use new connection with more resilient settings
    const db = await mongoose.connect(process.env.MONGODB_URI!, {
      maxPoolSize: 5, // Reduce connection pool size for stability
      serverSelectionTimeoutMS: 10000, // Increase server selection timeout
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      connectTimeoutMS: 10000, // How long to wait for initial connection
      bufferCommands: false, // Disable mongoose buffering
      heartbeatFrequencyMS: 10000, // Check connection health every 10 seconds
      retryWrites: true, // Enable retryable writes
      retryReads: true, // Enable retryable reads
    });

    connection.isConnected = db.connections[0].readyState;
    console.log(`Connected to MongoDB successfully. ReadyState: ${connection.isConnected}`);
    
    // Add connection event listeners for better debugging
    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
      connection.isConnected = 0;
    });
    
    mongoose.connection.on('error', (error) => {
      console.error('MongoDB connection error:', error);
      connection.isConnected = 0;
    });
    
    mongoose.connection.on('connected', () => {
      console.log('MongoDB connected event fired');
      connection.isConnected = 1;
    });
    
  } catch (error) {
    console.error('MongoDB connection error:', error);
    connection.isConnected = 0;
    throw new Error(`Failed to connect to database: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export default connectDB;
