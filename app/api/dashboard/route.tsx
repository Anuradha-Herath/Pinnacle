import { NextRequest, NextResponse } from 'next/server';
import { getDashboardData, getRecentOrders } from '@/lib/dashboard';

export async function GET(request: NextRequest) {
  try {
    const data = await getDashboardData();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to fetch dashboard data" 
    }, { status: 500 });
  }
}
