import mongoose from 'mongoose';
import Coupon from '@/models/coupons';

// Connect to MongoDB using Mongoose
const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      console.log('Connecting to MongoDB...');
      await mongoose.connect(process.env.MONGODB_URI!);
      console.log('Connected to MongoDB via Mongoose');
    }
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw new Error('Failed to connect to database');
  }
};

// Helper function to compare dates
const isDatePassed = (dateString: string): boolean => {
  const targetDate = new Date(dateString);
  const currentDate = new Date();
  
  // Reset time to start of day for accurate comparison
  targetDate.setHours(0, 0, 0, 0);
  currentDate.setHours(0, 0, 0, 0);
  
  return currentDate >= targetDate;
};

// Helper function to check if date is in the future
const isDateFuture = (dateString: string): boolean => {
  const targetDate = new Date(dateString);
  const currentDate = new Date();
  
  // Reset time to start of day for accurate comparison
  targetDate.setHours(0, 0, 0, 0);
  currentDate.setHours(0, 0, 0, 0);
  
  return currentDate < targetDate;
};

// Main function to update coupon statuses
export const updateCouponStatuses = async () => {
  try {
    await connectDB();
    
    const coupons = await Coupon.find({});
    const updatePromises = [];
    const updatedCoupons = [];
    
    for (const coupon of coupons) {
      let newStatus = coupon.status;
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);
      
      // Check if coupon should be activated (start date has arrived)
      if (coupon.status === 'Future' && isDatePassed(coupon.startDate)) {
        // Check if it's not already expired
        if (!isDatePassed(coupon.endDate)) {
          newStatus = 'Active';
        } else {
          newStatus = 'Expired';
        }
      }
      
      // Check if active coupon should be expired
      if (coupon.status === 'Active' && isDatePassed(coupon.endDate)) {
        newStatus = 'Expired';
      }
      
      // Update coupon status if changed
      if (newStatus !== coupon.status) {
        const updatePromise = Coupon.findByIdAndUpdate(
          coupon._id,
          { status: newStatus },
          { new: true }
        );
        updatePromises.push(updatePromise);
        updatedCoupons.push({
          id: coupon._id,
          code: coupon.code,
          product: coupon.product,
          oldStatus: coupon.status,
          newStatus: newStatus
        });
      }
    }
    
    // Execute all updates
    await Promise.all(updatePromises);
    
    console.log(`Updated ${updatedCoupons.length} coupon statuses:`, updatedCoupons);
    
    return {
      success: true,
      updatedCount: updatedCoupons.length,
      updatedCoupons: updatedCoupons
    };
  } catch (error) {
    console.error('Error updating coupon statuses:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// Function to get coupons that need status updates (for testing/preview)
export const getCouponsNeedingStatusUpdate = async () => {
  try {
    await connectDB();
    
    const coupons = await Coupon.find({});
    const needsUpdate = [];
    
    for (const coupon of coupons) {
      let suggestedStatus = coupon.status;
      
      // Check if coupon should be activated
      if (coupon.status === 'Future' && isDatePassed(coupon.startDate)) {
        if (!isDatePassed(coupon.endDate)) {
          suggestedStatus = 'Active';
        } else {
          suggestedStatus = 'Expired';
        }
      }
      
      // Check if active coupon should be expired
      if (coupon.status === 'Active' && isDatePassed(coupon.endDate)) {
        suggestedStatus = 'Expired';
      }
      
      if (suggestedStatus !== coupon.status) {
        needsUpdate.push({
          id: coupon._id,
          code: coupon.code,
          product: coupon.product,
          currentStatus: coupon.status,
          suggestedStatus: suggestedStatus,
          startDate: coupon.startDate,
          endDate: coupon.endDate
        });
      }
    }
    
    return {
      success: true,
      couponsNeedingUpdate: needsUpdate
    };
  } catch (error) {
    console.error('Error checking coupon statuses:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};
