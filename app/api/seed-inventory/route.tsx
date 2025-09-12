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
    const products = await Product.find().limit(10); // Increased limit
    
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
          stock: Math.floor(Math.random() * 50) + 10, // Random stock between 10-59 (ensure some stock)
          status: Math.random() > 0.3 ? 'In Stock' : 'Out Of Stock', // 70% chance of In Stock
          image: product.gallery && product.gallery.length > 0 ? product.gallery[0].src : '',
          // Initialize size stock
          sizeStock: (product.sizes || []).reduce((acc: any, size: string) => {
            acc[size] = Math.floor(Math.random() * 20) + 5; // Ensure some stock per size
            return acc;
          }, {})
        });
        
        await newInventory.save();
        inventoryItems.push(newInventory);
      } else {
        // Update existing inventory to ensure some are In Stock
        if (existingInventory.status === 'Out Of Stock' && Math.random() > 0.5) {
          existingInventory.status = 'In Stock';
          existingInventory.stock = Math.floor(Math.random() * 50) + 10;
          await existingInventory.save();
          inventoryItems.push(existingInventory);
        }
      }
    }
    
    return NextResponse.json({ 
      message: `Processed ${inventoryItems.length} inventory items`,
      inventoryItems
    });
    
  } catch (error) {
    console.error("Error seeding inventory:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to seed inventory" 
    }, { status: 500 });
  }
}
