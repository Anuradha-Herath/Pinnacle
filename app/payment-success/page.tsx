export default async function PaymentSuccess({
  searchParams,
}: {
  searchParams: { amount: string; payment_intent: string };
}) {
  // Access amount and payment intent after receiving the searchParams object
  const { amount, payment_intent } = searchParams;

  return (
    <main className="max-w-6xl mx-auto p-10 text-white text-center border m-10 rounded-md bg-gradient-to-tr from-black to-gray-500">
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold mb-2">Thank you!</h1>
        <h2 className="text-2xl">Your payment was successful</h2>

        <div className="bg-white p-2 rounded-md text-black mt-5 text-4xl font-bold">
          ${amount}
        </div>

        <p className="mt-5 text-white">
          A confirmation email has been sent to your email address.
        </p>

        <p className="mt-3 text-sm text-gray-200">
          Order Reference: {payment_intent || "Not available"}
        </p>
      </div>
    </main>
  );
}
