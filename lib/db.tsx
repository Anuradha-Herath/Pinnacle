import mongoose from "mongoose";

const connectDB = async () => {
  try {
    console.log("Checking MongoDB connection");
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(
        process.env.MONGODB_URI || "mongodb://localhost:27017/pinnacle"
      );
      console.log("Connected to MongoDB");
    }
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw new Error("Failed to connect to MongoDB");
  }
};

export default connectDB;