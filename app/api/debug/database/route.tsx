import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Product from "@/models/Product";
import Inventory from "@/models/Inventory";
import connectDB from "@/lib/optimizedDB";

// Debug endpoint to test database connectivity and data
export async function GET() {
  try {
    console.log('🔍 Starting database debug test...');
    
    // Test database connection
    await connectDB();
    console.log('✅ Database connected successfully');
    
    // Check connection state
    const connectionState = mongoose.connection.readyState;
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    console.log(`🔗 Connection state: ${states[connectionState]} (${connectionState})`);
    
    // Test Product model
    const totalProducts = await Product.countDocuments();
    console.log(`📦 Total products in database: ${totalProducts}`);
    
    // Test specific categories
    const menProducts = await Product.countDocuments({
      category: { $regex: /^(men|mens)$/i }
    });
    
    const womenProducts = await Product.countDocuments({
      category: { $regex: /^(women|womens)$/i }
    });
    
    const accessoriesProducts = await Product.countDocuments({
      category: { $regex: /^accessories$/i }
    });
    
    console.log(`👨 Men products: ${menProducts}`);
    console.log(`👩 Women products: ${womenProducts}`);
    console.log(`🎒 Accessories products: ${accessoriesProducts}`);
    
    // Test Inventory model
    const totalInventory = await Inventory.countDocuments();
    const inStockInventory = await Inventory.countDocuments({ status: 'In Stock' });
    
    console.log(`📋 Total inventory items: ${totalInventory}`);
    console.log(`✅ In stock items: ${inStockInventory}`);
    
    // Get sample data
    const sampleProducts = await Product.find({}).limit(5).select('productName category regularPrice');
    const sampleInventory = await Inventory.find({}).limit(5).select('productId status');
    
    // Test the exact query that's failing
    const inStockInventoryItems = await Inventory.find({ status: 'In Stock' });
    const inStockProductIds = inStockInventoryItems.map(item => item.productId);
    
    const womenQuery = {
      _id: { $in: inStockProductIds },
      category: { $regex: new RegExp(`^(women|womens)$`, 'i') }
    };
    
    console.log('🔍 Testing Women products query:', JSON.stringify(womenQuery));
    const womenQueryResult = await Product.find(womenQuery).limit(5);
    console.log(`👩 Women query result count: ${womenQueryResult.length}`);
    
    return NextResponse.json({
      success: true,
      connectionState: states[connectionState],
      stats: {
        totalProducts,
        menProducts,
        womenProducts,
        accessoriesProducts,
        totalInventory,
        inStockInventory,
        inStockProductIds: inStockProductIds.length,
        womenQueryResult: womenQueryResult.length
      },
      sampleProducts: sampleProducts.map(p => ({
        id: p._id,
        name: p.productName,
        category: p.category,
        price: p.regularPrice
      })),
      sampleInventory: sampleInventory.map(i => ({
        productId: i.productId,
        status: i.status
      })),
      womenQuerySample: womenQueryResult.map(p => ({
        id: p._id,
        name: p.productName,
        category: p.category,
        price: p.regularPrice
      }))
    });
    
  } catch (error) {
    console.error('❌ Debug test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    }, { status: 500 });
  }
}
