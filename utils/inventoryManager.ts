/**
 * Utility for managing product inventory when orders are paid
 */

import Inventory from "@/models/Inventory";
import Order from "@/models/Order";
import connectDB from "@/lib/db";

interface InventoryItem {
  productId: string;
  quantity: number;
  size?: string;
  color?: string;
}

export async function reduceInventoryForPaidOrder(orderNumber: string): Promise<void> {
  try {
    await connectDB();
    
    // Fetch the order details
    const order = await Order.findOne({ orderNumber: orderNumber });
    
    if (!order) {
      throw new Error(`Order not found with order number: ${orderNumber}`);
    }

    // Check if payment is confirmed
    if (order.paymentStatus !== "paid") {
      console.log(`Order ${orderNumber} payment not confirmed, skipping inventory reduction`);
      return;
    }

    // Extract inventory items from order line items
    const inventoryUpdates: InventoryItem[] = order.line_items.map((item: any) => ({
      productId: item.metadata?.productId || item.productId,
      quantity: item.quantity,
      size: item.metadata?.size,
      color: item.metadata?.color
    }));

    //console.log(`Processing inventory reduction for order ${orderNumber}:`, inventoryUpdates);

    // Process each inventory update
    for (const update of inventoryUpdates) {
      if (!update.productId) {
        console.warn(`Skipping inventory update for item without productId`);
        continue;
      }

      try {
        await reduceProductInventory(update);
        console.log(`Successfully reduced inventory for product ${update.productId}`);
      } catch (error) {
        console.error(`Failed to reduce inventory for product ${update.productId}:`, error);
        // Continue with other products even if one fails
      }
    }

    console.log(`Completed inventory reduction for order ${orderNumber}`);
    
  } catch (error) {
    console.error(`Error reducing inventory for order ${orderNumber}:`, error);
    throw error;
  }
}

async function reduceProductInventory(item: InventoryItem): Promise<void> {
  const { productId, quantity, size, color } = item;

  // Find the inventory record for this product
  const inventory = await Inventory.findOne({ productId: productId });
  
  if (!inventory) {
    throw new Error(`Inventory not found for product ID: ${productId}`);
  }

  // Products always have color, but size is optional
  if (!color) {
    console.log(`Product ${productId} is missing color information. Color: ${color}`);
  }

  // For products with both color and size, use colorSizeStock
  if (size && color) {
    // Check if colorSizeStock exists and has the specific color-size combination
    const colorSizeStock = inventory.colorSizeStock || new Map();
    
    if (colorSizeStock.has(color)) {
      const sizeStock = colorSizeStock.get(color) || new Map();
      
      if (sizeStock.has(size)) {
        const currentStock = sizeStock.get(size) || 0;
        
        if (currentStock < quantity) {
          console.log(`Insufficient stock for product ${productId} (Color: ${color}, Size: ${size}). Available: ${currentStock}, Required: ${quantity}`);
        }
        
        // Reduce the specific color-size combination stock
        const newStock = Math.max(0, currentStock - quantity);
        sizeStock.set(size, newStock);
        colorSizeStock.set(color, sizeStock);
        inventory.colorSizeStock = colorSizeStock;
        
        console.log(`Reduced colorSizeStock: Product ${productId}, Color: ${color}, Size: ${size}, From: ${currentStock} To: ${newStock}`);
      } else {
        console.log(`Size ${size} not found in colorSizeStock for color ${color}`);
      }
    } else {
      console.log(`Color ${color} not found in colorSizeStock`);
    }
    
    // Also update individual colorStock and sizeStock mappings
    const colorStock = inventory.colorStock || new Map();
    if (colorStock.has(color)) {
      const currentColorStock = colorStock.get(color) || 0;
      const newColorStock = Math.max(0, currentColorStock - quantity);
      colorStock.set(color, newColorStock);
      inventory.colorStock = colorStock;
      console.log(`Updated colorStock for ${color}: From ${currentColorStock} To ${newColorStock}`);
    }
    
    const sizeStock = inventory.sizeStock || new Map();
    if (sizeStock.has(size)) {
      const currentSizeStock = sizeStock.get(size) || 0;
      const newSizeStock = Math.max(0, currentSizeStock - quantity);
      sizeStock.set(size, newSizeStock);
      inventory.sizeStock = sizeStock;
      console.log(`Updated sizeStock for ${size}: From ${currentSizeStock} To ${newSizeStock}`);
    }
    
  } else if (color && !size) {
    // Product has only color (no size) - use colorStock
    const colorStock = inventory.colorStock || new Map();
    
    if (colorStock.has(color)) {
      const currentStock = colorStock.get(color) || 0;
      
      if (currentStock < quantity) {
        console.log(`Insufficient stock for product ${productId} (Color: ${color}). Available: ${currentStock}, Required: ${quantity}`);
      }
      
      // Reduce the specific color stock
      const newStock = Math.max(0, currentStock - quantity);
      colorStock.set(color, newStock);
      inventory.colorStock = colorStock;
      
      console.log(`Reduced colorStock: Product ${productId}, Color: ${color}, From: ${currentStock} To: ${newStock}`);
    } else {
      console.log(`Color ${color} not found in colorStock`);
    }
  }

  // Update overall stock by recalculating from all variants
  const totalStock = calculateTotalStock(inventory);
  inventory.stock = totalStock;
  

  // Save the updated inventory
  await inventory.save();
  
  console.log(`Inventory updated for product ${productId}. New total stock: ${totalStock}, Status: ${inventory.status}`);
}

function calculateTotalStock(inventory: any): number {
  let total = 0;
  
  // Always calculate from sizeStock since total of each size-wise stock equals total stock
  if (inventory.sizeStock && inventory.sizeStock.size > 0) {
    for (const [size, stock] of inventory.sizeStock) {
      total += stock || 0;
    }
    console.log(`Total from sizeStock: ${total}`);
    return total;
  }
  
  // Fallback: If no sizeStock exists, use main stock as safety measure
  total = inventory.stock || 0;
  console.log(`Total from main stock fallback: ${total}`);
  return total;
}



