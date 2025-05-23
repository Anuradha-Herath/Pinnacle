import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export async function GET(request: NextRequest) {
  // Get customerId from URL search params
  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get("customerId");

  if (!customerId) {
    return NextResponse.json(
      { error: "Missing customerId parameter" },
      { status: 400 }
    );
  }

  try {
    const customer = await stripe.customers.retrieve(customerId);

    const payments = await stripe.paymentIntents.list({
      customer: customerId,
      limit: 10,
      expand: ['data.payment_method'] 
    });

    const paymentMethodsFromPayments = payments.data
      .filter(payment => payment.payment_method)
      .map(payment => {
        const method = payment.payment_method;
        if (!method || typeof method === 'string') return null;
        
        const card = method.card;
        if (!card) return null;
        
        return {
          paymentId: payment.id,
          amount: payment.amount / 100,
          currency: payment.currency,
          date: new Date(payment.created * 1000).toISOString(),
          last4: card.last4 || '',
          brand: card.brand || '',
          expMonth: card.exp_month || '',
          expYear: card.exp_year || '',
          cardholderName: method.billing_details?.name || '',
          expiryDisplay: card.exp_month && card.exp_year 
            ? `${String(card.exp_month).padStart(2, '0')}/${String(card.exp_year).slice(-2)}`
            : '',
          displayName: card.brand && card.last4 
            ? `${card.brand.charAt(0).toUpperCase() + card.brand.slice(1)} •••• ${card.last4}`
            : '',
        };
      })
      .filter(Boolean);

    return NextResponse.json({
      customer,
      paymentMethodsFromPayments,
      payments: payments.data,
    });
  }
 catch (error: any) {
    console.error("Error fetching Stripe customer data:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
// http://localhost:3000/api/stripe?customerId=cus_SMPYF4aROqisDP
