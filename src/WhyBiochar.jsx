import React from 'react';

const WhyBiochar = () => {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1
        className="text-3xl font-bold text-center mb-8 major"
        style={{ display: 'flex', justifyContent: 'center' }}
      >
        Why Biochar Matters
      </h1>

      <div className="space-y-8">
        <section className="bg-white rounded-lg p-6 shadow-sm">
          <div>
            <h2 className="text-2xl font-semibold mb-4">The Nitrogen Challenge</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Nitrogen is one of the most abundant elements in our atmosphere and essential for life
              on Earth. While it plays a crucial role in DNA and plant growth, making it critical
              for food production, maintaining the right balance is challenging. Both insufficient
              and excessive nitrogen levels can be detrimental to environmental and human health.
            </p>
            <p className="text-gray-700 leading-relaxed">
              When nitrogen levels are too low, plants may exhibit:
            </p>
            <ul className="list-disc ml-6 mt-2 mb-4 space-y-2 text-gray-700">
              <li>Yellowing leaves</li>
              <li>Poor growth patterns</li>
              <li>Reduced flower and fruit production</li>
              <li>Decreased crop yields</li>
            </ul>
          </div>
        </section>

        <section className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-2xl font-semibold mb-4">Environmental Impact</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Excess nitrogen can lead to severe environmental consequences:
          </p>
          <ul className="list-disc ml-6 mt-2 space-y-2 text-gray-700">
            <li>Eutrophication in water bodies causing algal blooms</li>
            <li>Creation of "dead zones" in lakes and reservoirs</li>
            <li>Air quality degradation affecting 77% of people globally</li>
            <li>Formation of dangerous particulates from agricultural ammonia emissions</li>
            <li>Contribution to smog and acid rain</li>
          </ul>
        </section>

        <section className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-2xl font-semibold mb-4">How Biochar Helps</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Biochar offers a sustainable solution to nitrogen management:
          </p>
          <ul className="list-disc ml-6 mt-2 space-y-2 text-gray-700">
            <li>Improves nitrogen retention in soil, reducing runoff</li>
            <li>Enhances soil structure and water holding capacity</li>
            <li>Provides habitat for beneficial soil microorganisms</li>
            <li>Helps maintain optimal nitrogen levels for plant growth</li>
            <li>Reduces the need for chemical fertilizers</li>
          </ul>
        </section>

        <section className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-2xl font-semibold mb-4">Our Solution</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Our biochar classification system helps farmers and agricultural professionals:
          </p>
          <ul className="list-disc ml-6 mt-2 space-y-2 text-gray-700">
            <li>Identify optimal biochar qualities for specific soil conditions</li>
            <li>Monitor and adjust nitrogen levels effectively</li>
            <li>Implement sustainable farming practices</li>
            <li>Reduce environmental impact while maintaining productivity</li>
            <li>Contribute to long-term soil health and environmental protection</li>
          </ul>
        </section>
      </div>
    </div>
  );
};

export default WhyBiochar;
