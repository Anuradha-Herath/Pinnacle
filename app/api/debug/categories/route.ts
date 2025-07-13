import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Category from '@/models/Category';
import connectDB from '@/lib/optimizedDB';

// Debug endpoint for categories - only available in development
export async function GET() {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Debug endpoint only available in development' }, { status: 404 });
  }

  const debug: any = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    mongoUri: process.env.MONGODB_URI ? 'Set' : 'Not set',
    mongoUriLength: process.env.MONGODB_URI?.length || 0,
  };

  try {
    // Test database connection
    debug.connectionAttempt = 'Starting...';
    await connectDB();
    debug.connectionAttempt = 'Success';
    debug.mongooseState = mongoose.connection.readyState;
    debug.mongooseStates = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    debug.currentState = debug.mongooseStates[mongoose.connection.readyState] || 'unknown';

    // Test Category model
    debug.categoryModel = 'Testing...';
    const categoryCount = await Category.countDocuments();
    debug.categoryModel = 'Success';
    debug.categoryCount = categoryCount;

    // Try to fetch a few categories
    debug.categoryFetch = 'Testing...';
    const categories = await Category.find().limit(3);
    debug.categoryFetch = 'Success';
    debug.sampleCategories = categories.map(cat => ({
      id: cat._id,
      title: cat.title,
      mainCategory: cat.mainCategory
    }));

    debug.overall = 'All tests passed';

  } catch (error) {
    debug.error = {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    };
    debug.overall = 'Failed';
  }

  return NextResponse.json(debug);
}
