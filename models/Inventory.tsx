import mongoose, { Schema } from 'mongoose';

const InventorySchema = new Schema({
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  stock: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['In Stock', 'Out Of Stock', 'Newly Added'],
    default: 'Newly Added'
  },
  stockLimit: {
    type: Number,
    default: 10
  },
  sizeStock: {
    type: Map,
    of: Number,
    default: {}
  },
  colorStock: {
    type: Map,
    of: Number,
    default: {}
  },
  colorSizeStock: {
    type: Map,
    of: {
      type: Map,
      of: Number
    },
    default: {}
  },
  image: {
    type: String,
    default: ''
  }
}, { timestamps: true });

// Type definition for TypeScript
interface IInventory {
  productId: mongoose.Types.ObjectId;
  productName: string;
  stock: number;
  status: 'In Stock' | 'Out Of Stock' | 'Newly Added';
  stockLimit?: number;
  sizeStock?: Map<string, number>;
  colorStock?: Map<string, number>;
  colorSizeStock?: Map<string, Map<string, number>>;
  image?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Check if model is already defined to prevent overwrite errors
const Inventory = mongoose.models.Inventory || mongoose.model<IInventory>('Inventory', InventorySchema);

export default Inventory;
