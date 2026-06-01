import React from 'react';

export default function AboutUs({ onBack }: { onBack: () => void }) {
  return (
    <section className="max-w-4xl mx-auto py-12 px-4">
      <button 
        onClick={onBack} 
        className="mb-6 px-4 py-2 border rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
        style={{ borderColor: "var(--accent)", color: "var(--accent)" }}
      >
        &larr; Back
      </button>
      <h1 className="text-3xl font-bold mb-6">About Us</h1>
      <p className="text-lg text-neutral-700 dark:text-neutral-300 mb-4">
        Men's Hub is a premium online destination for modern gentlemen who value style,
        quality, and confidence. Founded in 2023, we curate a selection of clothing,
        accessories, and lifestyle products that blend classic elegance with contemporary trends.
      </p>
      <p className="text-lg text-neutral-700 dark:text-neutral-300 mb-4">
        Our mission is to empower men to express their individuality through fashion,
        providing a seamless shopping experience, exceptional customer service, and fast, reliable delivery.
      </p>
      <p className="text-lg text-neutral-700 dark:text-neutral-300">
        Join us on this journey and discover the perfect pieces that define your personal style.
      </p>
    </section>
  );
}
