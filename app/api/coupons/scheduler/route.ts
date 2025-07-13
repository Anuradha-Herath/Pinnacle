import { NextRequest, NextResponse } from 'next/server';
import { updateCouponStatuses } from '@/lib/couponStatusUpdater';

// This endpoint can be called by external cron services like Vercel Cron, GitHub Actions, etc.
export async function POST(request: NextRequest) {
  try {
    // Check for authorization header (optional security measure)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Running scheduled coupon status update...');
    const result = await updateCouponStatuses();
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Scheduled update completed. Updated ${result.updatedCount} coupon statuses.`,
        updatedCount: result.updatedCount,
        updatedCoupons: result.updatedCoupons,
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in scheduled coupon status update:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// GET endpoint for health check
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    message: 'Coupon status scheduler endpoint is running',
    timestamp: new Date().toISOString()
  });
}
