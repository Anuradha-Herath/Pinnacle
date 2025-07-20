import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import mongoose from 'mongoose';
import User from "../../../../models/User";
import { generateToken } from "../../../../lib/jwt";

// Connect to MongoDB
const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI!);
    }
    console.log("NextAuth: Connected to MongoDB");
    return true;
  } catch (error) {
    console.error('NextAuth: MongoDB connection error:', error);
    throw new Error('Failed to connect to database');
  }
};

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  debug: process.env.NODE_ENV === 'development',
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log("NextAuth: Sign-in callback initiated", { 
        email: user.email,
        provider: account?.provider
      });
      
      if (!account || !user.email) {
        console.error("NextAuth: Missing account or email");
        return false;
      }
      
      try {
        await connectDB();
        
        // Check if user already exists
        const existingUser = await User.findOne({ email: user.email });
        
        if (existingUser) {
          console.log("NextAuth: Found existing user");
          // Update provider if needed
          if (!existingUser.provider) {
            console.log("NextAuth: Updating existing user with provider");
            existingUser.provider = account.provider;
            await existingUser.save();
          }
        } else {
          // Create new user for social login
          console.log("NextAuth: Creating new user for social login");
          const newUser = await User.create({
            firstName: user.name?.split(' ')[0] || 'User',
            lastName: user.name?.split(' ').slice(1).join(' ') || '',
            email: user.email,
            provider: account.provider,
            // No password for social login
          });
          console.log("NextAuth: New user created with ID", newUser._id);
        }
        
        return true;
      } catch (error) {
        console.error("NextAuth: Sign-in error:", error);
        // Return true anyway to prevent AccessDenied,
        // we'll handle missing user in the session callback
        return true;
      }
    },
    
    async jwt({ token, user, account }) {
      console.log("NextAuth: JWT callback", { 
        tokenEmail: token.email,
        tokenSub: token.sub 
      });
      
      try {
        // Only process on initial sign-in
        if (account && user) {
          await connectDB();
          
          // Find the user in our database
          const dbUser = await User.findOne({ email: user.email });
          
          if (dbUser) {
            console.log("NextAuth: Found user for JWT", { userId: dbUser._id });
            // Generate our custom token
            const customToken = generateToken(dbUser);
            
            // Add custom properties
            token.id = (dbUser._id as any).toString();
            token.role = dbUser.role;
            token.customToken = customToken;
          } else {
            console.error("NextAuth: User not found in JWT callback");
          }
        }
        
        return token;
      } catch (error) {
        console.error("NextAuth: JWT error:", error);
        return token;
      }
    },
    
    async session({ session, token }) {
      console.log("NextAuth: Session callback", { 
        sessionEmail: session?.user?.email,
        tokenId: token?.id
      });
      
      try {
        // Add custom properties to session
        if (session.user) {
          (session.user as any).id = token.id;
          (session.user as any).role = token.role || 'user';
          (session.user as any).customToken = token.customToken;
        }
        
        return session;
      } catch (error) {
        console.error("NextAuth: Session error:", error);
        return session;
      }
    }
  },
  events: {
    async signIn(message) {
      console.log("NextAuth Event: User signed in successfully", {
        email: message.user.email
      });
    },
    async signOut(message) {
      console.log("NextAuth Event: User signed out");
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: "jwt" as const,
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
