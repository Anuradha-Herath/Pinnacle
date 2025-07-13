import { NextRequest, NextResponse } from 'next/server';
import { updateCouponStatuses, getCouponsNeedingStatusUpdate } from '@/lib/couponStatusUpdater';

// GET endpoint to check which coupons need status updates
export async function GET() {
  try {
    console.log('Checking coupons that need status updates...');
    const result = await getCouponsNeedingStatusUpdate();
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Found ${result.couponsNeedingUpdate?.length || 0} coupons needing status updates`,
        couponsNeedingUpdate: result.couponsNeedingUpdate
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in GET /api/coupons/update-status:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

// POST endpoint to update coupon statuses
export async function POST() {
  try {
    console.log('Updating coupon statuses...');
    const result = await updateCouponStatuses();
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Successfully updated ${result.updatedCount} coupon statuses`,
        updatedCount: result.updatedCount,
        updatedCoupons: result.updatedCoupons
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in POST /api/coupons/update-status:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}
