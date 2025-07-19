import Order from "@/models/Order";
import User from "@/models/User";
import mongoose from "mongoose";

// Function to determine customer type based on loyalty points
export function getCustomerType(points: number = 0): {
  type: string;
  color: string;
} {
  // Ensure points is a number
  const safePoints = typeof points === 'number' ? points : 0;
  
  if (safePoints >= 1000) {
    return { type: 'Gold Crown', color: 'text-yellow-500' };
  } else if (safePoints >= 500) {
    return { type: 'Silver Crown', color: 'text-gray-400' };
  } else {
    return { type: 'Black Crown', color: 'text-black' };
  }
}

export async function processLoyaltyPoints(orderNumber: string) {
  if (!orderNumber) {
    throw new Error("Order number is required");
  }

  const order = await Order.findOne({ orderNumber, paymentStatus: "paid" });
  
  if (!order) {
    throw new Error("Order not found or not paid");
  }
  
  console.log("Order amount:", order.amount.total);

  const userId = order.userId;

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid or missing user ID");
  }

  const pointsEarned = Math.round(order.amount.total * 0.1);
    console.log("Points to be earned:", pointsEarned);

  const updatedOrder = await Order.findOneAndUpdate(
    { orderNumber, paymentStatus: "paid" },
    {
      pointsEarned: pointsEarned,
      updatedAt: new Date()
    },
    { new: true }
  );
  
  if (!updatedOrder) {
    throw new Error("Failed to update order with points");
  }
  
  console.log("Points earned:", updatedOrder.pointsEarned);

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      $inc: { points: pointsEarned },
      $set: { updatedAt: new Date() }
    },
    { new: true }
  );
    console.log("User points updated:", updatedUser?.points);

  if (!updatedUser) {
    await Order.findOneAndUpdate(
      { orderNumber },
      { $unset: { pointsEarned: "" } }
    );
    throw new Error("User not found while updating points");
  }

  return {
    success: true,
    pointsEarned,
    userTotalPoints: updatedUser.points
  };
}
