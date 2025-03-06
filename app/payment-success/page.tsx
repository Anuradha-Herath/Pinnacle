export default async function PaymentSuccess({
    searchParams,
  }: {
    searchParams: { amount: string };
  }) {
    // Access amount after receiving the searchParams object
    const { amount } = await searchParams;
  
    return (
      <main className="max-w-6xl mx-auto p-10 text-white text-center border m-10 rounded-md bg-gradient-to-tr from-black to-gray-500">
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold mb-2">Thank you!</h1>
          <h2 className="text-2xl">Your payment is successfull</h2>
  
          <div className="bg-white p-2 rounded-md text-black mt-5 text-4xl font-bold">
            ${amount}
          </div>
        </div>
      </main>
    );
  }
  