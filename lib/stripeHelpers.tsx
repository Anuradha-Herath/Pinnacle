import User from "../models/User";
import { stripe } from "@/lib/stripe";

export async function getOrCreateStripeCustomer(
  email: string,
  name: string,
  phone: string
) {
  let user = await User.findOne({ email });

  if (user && user.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  // Creating new Stripe customer
  const customer = await stripe.customers.create({
    email,
    name,
    phone,
  });

  // Saving stripeCustomerId in DB
  if (user) {
    await User.findByIdAndUpdate(
      user._id, // Document ID (ObjectId)
      { $set: { stripeCustomerId: customer.id } }, // Update object
      { new: true } // Options: return updated doc
    );
  }

  return customer.id;
}
