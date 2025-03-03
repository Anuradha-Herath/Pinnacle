import jwt from 'jsonwebtoken';
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
  const payload: TokenPayload = {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

// Verify JWT token
export const verifyToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
};
