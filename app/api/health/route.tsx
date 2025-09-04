import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/optimizedDB';

export async function GET() {
  try {
    // Test database connection
    await connectDB();
    
    // Test if we can actually query the database
    const dbState = mongoose.connection.readyState;
    const stateNames = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    
    const health = {
      status: 'healthy',
      database: {
        connected: dbState === 1,
        state: stateNames[dbState] || 'unknown',
        host: mongoose.connection.host,
        name: mongoose.connection.name,
      },
      timestamp: new Date().toISOString(),
    };
    
    return NextResponse.json(health, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, {
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json',
      },
    });
  }
}
