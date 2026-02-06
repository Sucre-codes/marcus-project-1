import React from 'react';
import CreditAlertForm from './component/AlertForm';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-purple-700">
      <div className="container mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8 md:py-12">
        
        {/* Hero Section - Mobile Optimized */}
        <div className="text-center mb-8 sm:mb-10 md:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-3 sm:mb-4 drop-shadow-lg leading-tight px-2">
            Credit Alert Generator
          </h1>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-purple-100 mb-4 sm:mb-5 md:mb-6 max-w-3xl mx-auto px-4 leading-relaxed">
            Create professional bank credit alert notifications in seconds
          </p>
          
          {/* Feature Pills - Mobile Responsive */}
          <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4 md:gap-6 text-white mb-6 sm:mb-7 md:mb-8 px-4">
            <div className="flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 sm:px-5 sm:py-2.5 border border-white/20">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm sm:text-base md:text-lg font-medium">Instant Generation</span>
            </div>
            
            <div className="flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 sm:px-5 sm:py-2.5 border border-white/20">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm sm:text-base md:text-lg font-medium">Custom Branding</span>
            </div>
            
            <div className="flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 sm:px-5 sm:py-2.5 border border-white/20">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm sm:text-base md:text-lg font-medium">PDF & Image Export</span>
            </div>
          </div>
        </div>
        
        {/* Main Form Component */}
        <CreditAlertForm />
        
        {/* Features Section - Mobile Optimized */}
        <div className="mt-10 sm:mt-12 md:mt-16 mb-8 sm:mb-10 md:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white text-center mb-8 sm:mb-10 md:mb-12 px-4 leading-tight">
            Why Use Our Credit Alert Generator?
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 max-w-6xl mx-auto px-2">
            
            {/* Feature Card 1 */}
            <div className="bg-white/10 backdrop-blur-lg rounded-lg sm:rounded-xl p-5 sm:p-6 border border-white/20 hover:bg-white/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] touch-manipulation">
              <div className="bg-purple-500 w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center mb-3 sm:mb-4 shadow-lg">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3">Lightning Fast</h3>
              <p className="text-purple-100 leading-relaxed text-sm sm:text-base">
                Generate professional credit alerts in under a minute. No design skills required, just fill in the details and go.
              </p>
            </div>

            {/* Feature Card 2 */}
            <div className="bg-white/10 backdrop-blur-lg rounded-lg sm:rounded-xl p-5 sm:p-6 border border-white/20 hover:bg-white/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] touch-manipulation">
              <div className="bg-indigo-500 w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center mb-3 sm:mb-4 shadow-lg">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3">Full Customization</h3>
              <p className="text-purple-100 leading-relaxed text-sm sm:text-base">
                Upload your bank logo, choose brand colors, and personalize every detail to match your institution's identity.
              </p>
            </div>

            {/* Feature Card 3 */}
            <div className="bg-white/10 backdrop-blur-lg rounded-lg sm:rounded-xl p-5 sm:p-6 border border-white/20 hover:bg-white/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] touch-manipulation sm:col-span-2 lg:col-span-1">
              <div className="bg-pink-500 w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center mb-3 sm:mb-4 shadow-lg">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3">Export Anywhere</h3>
              <p className="text-purple-100 leading-relaxed text-sm sm:text-base">
                Download your credit alerts as high-quality PDFs or images, perfect for email, printing, or digital records.
              </p>
            </div>
          </div>
        </div>

        {/* Footer - Mobile Optimized */}
        <footer className="text-center text-purple-200 py-6 sm:py-8 border-t border-white/20 mt-10 sm:mt-12 md:mt-16 px-4">
          <p className="text-xs sm:text-sm">
            © {new Date().getFullYear()} Credit Alert Generator. All rights reserved.
          </p>
          <p className="text-[10px] sm:text-xs mt-2 text-purple-300">
            Professional banking notifications made simple
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
