import jwt, { Secret, JwtPayload, SignOptions } from 'jsonwebtoken';
import { IUser } from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || '6fbd53421a847b141d318205a0b6809ea8d2af891f686982297a9de1cd35492b';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Token types
export interface TokenPayload {
  id: string;
  email: string;
  role: string;
}

// Generate JWT token
export const generateToken = (user: IUser): string => {
  if (!user._id) {
    throw new Error('User ID is required to generate token');
  }
  
  const payload: TokenPayload = {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
  };

  // Use proper typing for the secret and options
  const secret: Secret = JWT_SECRET;
  // Type assertion for expiresIn
  const options: SignOptions = { 
    expiresIn: JWT_EXPIRES_IN as any 
  };
  
  return jwt.sign(payload, secret, options);
};

// Verify JWT token
export const verifyToken = (token: string): TokenPayload | null => {
  if (!token || typeof token !== 'string' || token.trim() === '') {
    console.error('Invalid token format: Token must be a non-empty string');
    return null;
  }
  
  try {
    return jwt.verify(token, JWT_SECRET as Secret) as TokenPayload;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'JsonWebTokenError') {
        console.error('Invalid token:', error.message);
      } else if (error.name === 'TokenExpiredError') {
        console.error('Token expired');
      } else if (error.name === 'NotBeforeError') {
        console.error('Token not active');
      } else {
        console.error('Token verification failed:', error);
      }
    } else {
      console.error('Unknown error during token verification');
    }
    return null;
  }
};
