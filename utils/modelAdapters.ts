/**
 * Model Adapters
 * 
 * This file contains adapter functions that provide a safe interface to work with
 * existing database models without modifying their structure. These adapters handle
 * type inconsistencies and provide default values when needed.
 */

import { Document } from "mongoose";

// Type definitions for model fields without changing the actual models
export interface UserWithPoints {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  points?: number | null;
  [key: string]: any;
}

export interface OrderWithPoints {
  _id: string;
  orderNumber: string;
  pointsEarned?: number | null;
  [key: string]: any;
}

/**
 * Safely gets user points with proper type handling
 * Works with any user object structure without requiring model changes
 */
export function getUserPoints(user: any): number {
  if (!user) return 0;
  
  // Handle different potential types and provide defaults
  const points = user.points;
  
  if (typeof points === 'number') {
    return points;
  } else if (typeof points === 'string') {
    const parsed = parseInt(points, 10);
    return isNaN(parsed) ? 0 : parsed;
  }
  
  return 0;
}

/**
 * Adapts a user object to include points safely
 * This function doesn't modify the database model but ensures the UI has consistent data
 */
export function adaptUser(user: any): UserWithPoints {
  if (!user) return {} as UserWithPoints;
  
  // Create a new object with the same properties
  const adaptedUser = { ...user };
  
  // Ensure points is a number
  adaptedUser.points = getUserPoints(user);
  
  return adaptedUser;
}

/**
 * Adapts multiple user objects to include points safely
 */
export function adaptUsers(users: any[]): UserWithPoints[] {
  if (!users || !Array.isArray(users)) return [];
  return users.map(user => adaptUser(user));
}

/**
 * Safely gets order points with proper type handling
 */
export function getOrderPoints(order: any): number {
  if (!order) return 0;
  
  const points = order.pointsEarned;
  
  if (typeof points === 'number') {
    return points;
  } else if (typeof points === 'string') {
    const parsed = parseInt(points, 10);
    return isNaN(parsed) ? 0 : parsed;
  }
  
  return 0;
}
