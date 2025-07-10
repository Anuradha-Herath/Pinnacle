import Order from "@/models/Order";
import { NextResponse } from "next/server";
import connectDB from "@/lib/db";

export const GET = async (request: Request, context: { params: { id: string }}) => {
  const { id } = await context.params;
  try{
    await connectDB();
    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }    

    return new NextResponse(
      JSON.stringify(order),
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    )
    
  }catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 }
    );
  }
}

export const PUT = async (request: Request, context: { params: { id: string }}) => {
  const { id } = await context.params;
  try {
    await connectDB();
    const { status } = await request.json();
    
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { status, updatedAt: new Date() },
      { new: true }
    );
    
    if (!updatedOrder) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }
    
    return new NextResponse(
      JSON.stringify(updatedOrder),
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}