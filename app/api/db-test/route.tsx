import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/optimizedDB';
import Product from '@/models/Product';

export async function GET() {
  try {
    console.log('🔧 Running comprehensive database test...');
    
    // Test 1: Basic connection
    console.log('Test 1: Testing database connection...');
    await connectDB();
    
    const readyState = mongoose.connection.readyState;
    const stateNames = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    
    console.log(`Connection readyState: ${readyState} (${stateNames[readyState] || 'unknown'})`);
    
    if (readyState !== 1) {
      throw new Error(`Database not properly connected. ReadyState: ${readyState}`);
    }
    
    // Test 2: Simple query
    console.log('Test 2: Testing basic query...');
    const productCount = await Product.countDocuments();
    console.log(`Found ${productCount} products in database`);
    
    // Test 3: Sample data fetch
    console.log('Test 3: Testing sample data fetch...');
    const sampleProducts = await Product.find({}).limit(3).select('productName category');
    console.log('Sample products:', sampleProducts.map(p => ({ name: p.productName, category: p.category })));
    
    // Test 4: Check collections
    console.log('Test 4: Checking available collections...');
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    console.log('Available collections:', collectionNames);
    
    return NextResponse.json({
      status: 'healthy',
      tests: {
        connection: {
          status: 'passed',
          readyState: readyState,
          stateName: stateNames[readyState] || 'unknown',
          host: mongoose.connection.host,
          name: mongoose.connection.name,
        },
        query: {
          status: 'passed',
          productCount: productCount,
        },
        sampleData: {
          status: 'passed',
          sampleCount: sampleProducts.length,
          samples: sampleProducts.map(p => ({ name: p.productName, category: p.category })),
        },
        collections: {
          status: 'passed',
          count: collectionNames.length,
          names: collectionNames,
        }
      },
      timestamp: new Date().toISOString(),
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('🚨 Database test failed:', error);
    
    const readyState = mongoose.connection.readyState;
    const stateNames = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    
    return NextResponse.json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      details: {
        readyState: readyState,
        stateName: stateNames[readyState] || 'unknown',
        connectionHost: mongoose.connection.host,
        connectionName: mongoose.connection.name,
        errorStack: error instanceof Error ? error.stack : undefined,
      },
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
