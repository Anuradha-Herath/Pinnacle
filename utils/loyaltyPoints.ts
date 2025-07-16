import Order from "@/models/Order";
import User from "@/models/User";
import mongoose from "mongoose";

export async function processLoyaltyPoints(orderNumber: string) {
  if (!orderNumber) {
    throw new Error("Order number is required");
  }

  const order = await Order.findOne({ orderNumber, paymentStatus: "paid" });
  console.log("Order amount:", order.amount.total);

  if (!order) {
    throw new Error("Order not found or not paid");
  }

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
  console.log("Points earned:", updatedOrder.pointsEarned);

  if (!updatedOrder) {
    throw new Error("Failed to update order with points");
  }

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
