
import React from 'react';

export const Header: React.FC = () => (
  <header className="text-center">
    <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
      Order Request
    </h1>
    <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600">
      Please follow Company Guidelines when completing your order request - Thank you!
    </p>
    <div className="mt-8 mb-4 max-w-3xl mx-auto">
      <img 
        src="/merch-overview.png" 
        alt="Merchandise and ID Badge Overview" 
        className="w-full h-auto rounded-xl shadow-md border border-gray-200"
      />
    </div>
  </header>
);
