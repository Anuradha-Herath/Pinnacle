import { NextResponse } from "next/server";
import { checkConnection } from "@/lib/mongodb";

export async function GET() {
  try {
    const isConnected = await checkConnection();
    
    if (isConnected) {
      return NextResponse.json({ 
        status: "connected", 
        message: "Database connection successful" 
      });
    } else {
      return NextResponse.json({ 
        status: "disconnected", 
        message: "Database connection failed" 
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Error checking database connection:", error);
    return NextResponse.json({ 
      status: "error", 
      message: "Failed to check database connection" 
    }, { status: 500 });
  }
}
