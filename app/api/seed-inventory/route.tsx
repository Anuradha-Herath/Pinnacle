import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Inventory from "@/models/Inventory";
import Product from "@/models/Product";

const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI!);
      console.log('Connected to MongoDB via Mongoose');
    }
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw new Error('Failed to connect to database');
  }
};

// This endpoint will create sample inventory items
export async function GET() {
  try {
    await connectDB();
    
    // Check if there are any products to create inventory for
    const products = await Product.find().limit(5);
    
    if (products.length === 0) {
      return NextResponse.json({ message: "No products found to create inventory for" });
    }
    
    const inventoryItems = [];
    
    for (const product of products) {
      // Check if inventory already exists for this product
      const existingInventory = await Inventory.findOne({ productId: product._id });
      
      if (!existingInventory) {
        // Create inventory for this product
        const newInventory = new Inventory({
          productId: product._id,
          productName: product.productName,
          stock: Math.floor(Math.random() * 50), // Random stock between 0-49
          status: Math.random() > 0.5 ? 'In Stock' : 'Out Of Stock', // Randomly set status
          image: product.gallery && product.gallery.length > 0 ? product.gallery[0].src : '',
          // Initialize size stock
          sizeStock: (product.sizes || []).reduce((acc: any, size: string) => {
            acc[size] = Math.floor(Math.random() * 20);
            return acc;
          }, {})
        });
        
        await newInventory.save();
        inventoryItems.push(newInventory);
      }
    }
    
    return NextResponse.json({ 
      message: `Created ${inventoryItems.length} inventory items`,
      inventoryItems
    });
    
  } catch (error) {
    console.error("Error seeding inventory:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to seed inventory" 
    }, { status: 500 });
  }
}
