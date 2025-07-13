import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/optimizedDB';
import Product from '@/models/Product';

export async function GET(request: NextRequest) {
  try {
    console.log('Debug: Checking available product categories...');
    
    // Connect to database
    await connectDB();
    
    // Get all unique categories from products
    const uniqueCategories = await Product.distinct('category');
    console.log('Unique categories found:', uniqueCategories);
    
    // Get sample products for each category
    const categoryDetails = await Promise.all(
      uniqueCategories.map(async (cat) => {
        const count = await Product.countDocuments({ category: cat });
        const samples = await Product.find({ category: cat })
          .select('name productName category')
          .limit(3)
          .lean();
        
        return {
          category: cat,
          count,
          samples: samples.map(p => ({
            name: p.name || p.productName,
            category: p.category
          }))
        };
      })
    );
    
    return NextResponse.json({
      success: true,
      uniqueCategories,
      categoryDetails,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error in debug categories endpoint:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch category debug info',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
