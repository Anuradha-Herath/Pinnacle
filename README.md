# Pinnacle

Pinnacle is a modern e-commerce platform built with Next.js, designed to provide a seamless shopping experience with advanced features like personalized product recommendations, AI-powered chatbot, admin dashboard, and more.

## Features

- **Product Management**: Browse and filter products by category, gender, and other attributes.
- **Personalized Recommendations**: AI-driven product suggestions based on user preferences.
- **Chatbot Integration**: Interactive chatbot for customer support and queries.
- **Admin Dashboard**: Comprehensive admin panel for managing products, categories, orders, and users.
- **User Authentication**: Secure login and registration with JWT.
- **Payment Integration**: Stripe-powered checkout for secure transactions.
- **Image Optimization**: Cloudinary integration for fast and optimized image delivery.
- **Performance Monitoring**: Built-in tools for tracking and optimizing app performance.
- **Caching and Optimization**: Middleware for request deduplication, caching, and network optimization.

## Technologies Used

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, MongoDB
- **Authentication**: JWT
- **Payments**: Stripe
- **Image Hosting**: Cloudinary
- **Database**: MongoDB
- **Deployment**: Vercel (recommended)

## Getting Started

### Prerequisites

- Node.js (version 18 or higher)
- MongoDB (local or cloud instance)
- Stripe account for payments
- Cloudinary account for image hosting

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Anuradha-Herath/Pinnacle.git
   cd Pinnacle
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory and add the following:
   ```
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   STRIPE_SECRET_KEY=your_stripe_secret_key
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Usage

- Visit the homepage to browse products.
- Use the chatbot for assistance.
- Admin users can access the dashboard at `/admin`.
- Customize product recommendations in the user preferences.

## API Documentation

The API routes are located in the `app/api/` directory. Key endpoints include:
- `/api/products` - Product management
- `/api/categories` - Category management
- `/api/users` - User management
- `/api/orders` - Order processing

## Deployment

The easiest way to deploy Pinnacle is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

For more details, check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying).

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request.

## License

This project is licensed under the MIT License.
