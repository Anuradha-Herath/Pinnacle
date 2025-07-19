import { NextRequest, NextResponse } from 'next/server';

// Image proxy API to handle Cloudinary images that timeout with Next.js optimization
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const imageUrl = searchParams.get('url');
    const width = searchParams.get('w');
    const quality = searchParams.get('q') || '80';
    
    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
    }
    
    // Validate that it's a Cloudinary URL for security
    if (!imageUrl.includes('cloudinary.com')) {
      return NextResponse.json({ error: 'Only Cloudinary URLs are supported' }, { status: 400 });
    }
    
    try {
      // Create optimized Cloudinary URL with transformations
      const cloudinaryUrl = new URL(imageUrl);
      const pathParts = cloudinaryUrl.pathname.split('/');
      const uploadIndex = pathParts.findIndex(part => part === 'upload');
      
      if (uploadIndex !== -1) {
        const transformations = [];
        
        // Add width transformation if specified
        if (width) {
          transformations.push(`w_${width}`);
          transformations.push('c_limit'); // Limit to max width without stretching
        }
        
        // Add quality transformation
        transformations.push(`q_${quality}`);
        
        // Add format optimization
        transformations.push('f_auto');
        
        // Add the transformations to the URL
        if (transformations.length > 0) {
          pathParts.splice(uploadIndex + 1, 0, transformations.join(','));
          cloudinaryUrl.pathname = pathParts.join('/');
        }
      }
      
      // Fetch the image from Cloudinary
      const imageResponse = await fetch(cloudinaryUrl.toString(), {
        headers: {
          'User-Agent': 'Pinnacle-ImageProxy/1.0',
        },
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });
      
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image: ${imageResponse.status}`);
      }
      
      // Get the image data
      const imageBuffer = await imageResponse.arrayBuffer();
      
      // Determine content type
      const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
      
      // Return the image with appropriate headers
      return new NextResponse(imageBuffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
          'CDN-Cache-Control': 'public, max-age=31536000',
          'Vary': 'Accept-Encoding',
          'X-Image-Proxy': 'true',
        },
      });
      
    } catch (fetchError) {
      console.error('Error fetching image from Cloudinary:', fetchError);
      
      // Return a 502 Bad Gateway error if the upstream fails
      return NextResponse.json(
        { error: 'Failed to fetch image from Cloudinary' },
        { status: 502 }
      );
    }
    
  } catch (error) {
    console.error('Image proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
