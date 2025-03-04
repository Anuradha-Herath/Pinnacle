import mongoose, { Schema } from 'mongoose';

// Define Inventory schema
const InventorySchema = new Schema({
  productId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Product',
    required: true 
  },
  quantity: { 
    type: Number, 
    default: 0 
  },
  tags: [{ 
    type: String 
  }],
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Check if model exists before creating to prevent overwrite during hot reloads
const Inventory = mongoose.models.Inventory || mongoose.model('Inventory', InventorySchema);

export default Inventory;
