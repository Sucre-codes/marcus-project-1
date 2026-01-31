import React from 'react';
import CreditAlertForm from './component/AlertForm';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-purple-700">
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">
            Credit Alert Generator
          </h1>
          <p className="text-xl md:text-2xl text-purple-100 mb-6 max-w-3xl mx-auto">
            Create professional bank credit alert notifications in seconds
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-white mb-8">
            <div className="flex items-center gap-2">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-lg">Instant Generation</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-lg">Custom Branding</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-lg">PDF & Image Export</span>
            </div>
          </div>
        </div>
        <div className='ml-50'>
        {/* Main Form Component */}
        <CreditAlertForm />
        </div>
        {/* Features Section */}
        <div className="mt-16 mb-12">
          <h2 className="text-4xl font-bold text-white text-center mb-12">
            Why Use Our Credit Alert Generator?
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all">
              <div className="bg-purple-500 w-14 h-14 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Lightning Fast</h3>
              <p className="text-purple-100 leading-relaxed">
                Generate professional credit alerts in under a minute. No design skills required, just fill in the details and go.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all">
              <div className="bg-indigo-500 w-14 h-14 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Full Customization</h3>
              <p className="text-purple-100 leading-relaxed">
                Upload your bank logo, choose brand colors, and personalize every detail to match your institution's identity.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all">
              <div className="bg-pink-500 w-14 h-14 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Export Anywhere</h3>
              <p className="text-purple-100 leading-relaxed">
                Download your credit alerts as high-quality PDFs or images, perfect for email, printing, or digital records.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center text-purple-200 py-8 border-t border-white/20 mt-16">
          <p className="text-sm">
            © {new Date().getFullYear()} Credit Alert Generator. All rights reserved.
          </p>
          <p className="text-xs mt-2 text-purple-300">
            Professional banking notifications made simple
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;