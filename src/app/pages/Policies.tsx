import React from 'react';

export default function Policies({ onBack }: { onBack: () => void }) {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <button
        onClick={onBack}
        className="mb-6 px-4 py-2 border rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
        style={{ borderColor: "var(--accent)", color: "var(--accent)" }}
      >
        &larr; Back
      </button>
      <h1 className="text-3xl font-bold mb-6">Terms, Policies & Compliance</h1>
      
      {/* 1. Privacy Policy */}
      <section className="mb-8 border-b pb-6 border-neutral-200 dark:border-neutral-800">
        <h2 className="text-2xl font-semibold mb-4 text-neutral-800 dark:text-neutral-200">Privacy Policy</h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed mb-3">
          At Men's Hub, we respect your privacy and are committed to protecting your personal data. We collect information such as your name, delivery address, phone number, and email address solely to process your transactions and facilitate seamless delivery.
        </p>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
          Your payment information is securely processed using standard SSL encryption via Cashfree Payments, and we never store your credit/debit card numbers or net banking credentials on our servers. Your information is never sold or shared with external third parties for marketing purposes.
        </p>
      </section>

      {/* 2. Exchange & Refund Policy */}
      <section className="mb-8 border-b pb-6 border-neutral-200 dark:border-neutral-800">
        <h2 className="text-2xl font-semibold mb-4 text-neutral-800 dark:text-neutral-200">Exchange & Refund Policy</h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed mb-3">
          <strong>No Returns or Refunds:</strong> Please note that we do not support returns or cash refunds once an order has been successfully delivered.
        </p>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
          <strong>Size Exchanges:</strong> We allow size exchanges if the item received is a different size from the one ordered. You must request a size exchange within <strong>2 to 3 days of delivery</strong> by contacting our support team. The item must be in its original packaging, unused, unwashed, and with all product tags fully intact.
        </p>
      </section>

      {/* 3. Shipping & Delivery Policy */}
      <section className="mb-8 border-b pb-6 border-neutral-200 dark:border-neutral-800">
        <h2 className="text-2xl font-semibold mb-4 text-neutral-800 dark:text-neutral-200">Shipping & Delivery Policy</h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed mb-3">
          We offer fast and reliable shipping across India. Orders are processed within 24-48 business hours from receipt of payment.
        </p>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
          Estimated delivery timelines range from <strong>3 to 7 business days</strong> depending on your location. Shipping fees are calculated at checkout and may vary based on product weight or promotional free shipping offers. A tracking link will be sent to your registered email and phone number once the package is dispatched.
        </p>
      </section>

      {/* 4. Terms & Conditions */}
      <section className="mb-8 border-b pb-6 border-neutral-200 dark:border-neutral-800">
        <h2 className="text-2xl font-semibold mb-4 text-neutral-800 dark:text-neutral-200">Terms & Conditions</h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed mb-3">
          By accessing or shopping at Men's Hub, you agree to comply with our Terms & Conditions. You agree to provide accurate, complete, and current information when creating an account or placing orders.
        </p>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
          All orders are subject to product availability. We reserve the right to cancel any order if there are inaccuracies in product details or pricing, or in cases of suspected transaction fraud. All disputes are subject to the exclusive jurisdiction of the courts in Madurai, Tamil Nadu, India.
        </p>
      </section>

      {/* 5. Contact Us (Gateway Compliance Requirement) */}
      <section className="mb-4">
        <h2 className="text-2xl font-semibold mb-4 text-neutral-800 dark:text-neutral-200">Contact Us</h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">
          For any questions regarding our terms, exchanges, or privacy guidelines, please reach out to us:
        </p>
        <div className="text-sm text-neutral-700 dark:text-neutral-300 space-y-2 bg-neutral-100 dark:bg-neutral-900 p-4 rounded-lg">
          <p><strong>Merchant Name:</strong> Men's Hub</p>
          <p><strong>Support Email:</strong> menshubadmin01@gmail.com</p>
          <p><strong>Contact Phone:</strong> +91 95240 97865</p>
          <p><strong>Registered Address:</strong> 13, Aruppukottai Main Rd, South Gate, South Gate, Mahalipatti, Madurai, Tamil Nadu 625001, India</p>
        </div>
      </section>
    </div>
  );
}
