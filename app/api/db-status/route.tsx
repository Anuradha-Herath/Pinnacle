import { NextResponse } from "next/server";
import mongoose from "mongoose";

export async function GET() {
  try {
    // Check if we're already connected
    if (mongoose.connection.readyState === 1) {
      return NextResponse.json({ 
        status: "connected", 
        message: "Database connection successful" 
      });
    }
    
    // Try to connect
    await mongoose.connect(process.env.MONGODB_URI!);
    
    return NextResponse.json({ 
      status: "connected", 
      message: "Database connection successful" 
    });
  } catch (error) {
    console.error("Error checking database connection:", error);
    return NextResponse.json({ 
      status: "error", 
      message: "Failed to check database connection" 
    }, { status: 500 });
  }
}
