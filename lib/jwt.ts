import jwt from 'jsonwebtoken';

// Define a User interface for JWT operations
export interface JwtUser {
  _id: string;
  email: string;
  role: string;
}

// Ensure JWT_SECRET is properly typed as jwt.Secret
const JWT_SECRET: jwt.Secret = process.env.JWT_SECRET || '6fbd53421a847b141d318205a0b6809ea8d2af891f686982297a9de1cd35492b';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Token types
export interface TokenPayload {
  id: string;
  email: string;
  role: string;
}

// Generate JWT token
export const generateToken = (user: JwtUser): string => {
  const payload: TokenPayload = {
    id: user._id,
    email: user.email,
    role: user.role,
  };

  // Explicitly type the options to avoid TypeScript errors
  const options: jwt.SignOptions = {
    expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn']
  };

  // Use the correct types for jwt.sign
  return jwt.sign(payload, JWT_SECRET, options);
};

// Verify JWT token
export const verifyToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
};
