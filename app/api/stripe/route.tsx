import type { NextApiRequest, NextApiResponse } from 'next';
import { stripe } from "@/lib/stripe"

export default async function GET(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { customerId } = req.query;

  if (!customerId || typeof customerId !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid customerId parameter' });
  }

  try {
    const customer = await stripe.customers.retrieve(customerId);

    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });

    const payments = await stripe.paymentIntents.list({
      customer: customerId,
      limit: 10,
    });

    res.status(200).json({
      customer,
      paymentMethods: paymentMethods.data,
      payments: payments.data,
    });
  } catch (error: any) {
    console.error('Error fetching Stripe customer data:', error);
    res.status(500).json({ error: error.message });
  }
}
