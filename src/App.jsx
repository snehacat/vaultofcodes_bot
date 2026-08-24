import { useState } from 'react';
import ChatBot from './components/ChatBot';

function App() {
  const [showChat, setShowChat] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900/20 to-slate-900">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 bg-white/5 backdrop-blur-lg border-b border-white/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-xl sm:text-2xl">🎓</span>
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-white">VaultOfCodes</h1>
                <p className="text-xs text-gray-400 hidden sm:block">AI Assistant</p>
              </div>
            </div>
            <button
              onClick={() => setShowChat(true)}
              className="px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg text-sm sm:text-base font-semibold hover:from-red-600 hover:to-red-700 transition-all shadow-lg hover:shadow-red-500/50 hover:scale-105"
            >
              💬 Chat Now
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-12 sm:pt-20 pb-12 sm:pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-block mb-4 sm:mb-6">
              <span className="px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-full text-red-400 text-xs sm:text-sm font-semibold">
                ✨ Powered by AI
              </span>
            </div>
            <h2 className="text-4xl sm:text-5xl md:text-7xl font-bold text-white mb-4 sm:mb-6">
              Your Smart<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-purple-400">
                Learning Assistant
              </span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-6 sm:mb-8 px-4">
              Get instant, accurate answers about courses, internships, certificates, and more—powered by real-time data from VaultOfCodes
            </p>
            <button
              onClick={() => setShowChat(true)}
              className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl text-base sm:text-lg font-bold hover:from-red-600 hover:to-red-700 transition-all shadow-2xl hover:shadow-red-500/50 hover:scale-105"
            >
              Start Chatting →
            </button>
          </div>

          {/* Feature Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12 sm:mb-16">
            {[
              { icon: '🔄', title: 'Real-Time Updates', desc: 'Live data from official website', color: 'from-red-500/10 to-red-600/10 border-red-500/20' },
              { icon: '⚡', title: 'Instant Answers', desc: 'Smart AI-powered responses', color: 'from-yellow-500/10 to-yellow-600/10 border-yellow-500/20' },
              { icon: '📚', title: 'Verified Sources', desc: 'All info backed by references', color: 'from-blue-500/10 to-blue-600/10 border-blue-500/20' },
              { icon: '🎯', title: 'Always Accurate', desc: 'No outdated information', color: 'from-purple-500/10 to-purple-600/10 border-purple-500/20' }
            ].map((feature, i) => (
              <div key={i} className={`group bg-gradient-to-br ${feature.color} backdrop-blur-sm border rounded-2xl p-4 sm:p-6 hover:scale-105 transition-all duration-300 cursor-pointer`}>
                <div className="text-3xl sm:text-4xl mb-3 sm:mb-4 group-hover:scale-110 transition-transform">{feature.icon}</div>
                <h3 className="text-base sm:text-lg font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-xs sm:text-sm text-gray-400">{feature.desc}</p>
              </div>
            ))}
          </div>

          {/* Info Cards */}
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 mb-12 sm:mb-16">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 sm:p-8">
              <div className="flex items-start gap-4">
                <div className="text-3xl sm:text-4xl">🎓</div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-3">What I Can Help With</h3>
                  <ul className="space-y-2 text-sm sm:text-base text-gray-300">
                    <li className="flex items-center gap-2">
                      <span className="text-green-400">✓</span> Training Programs & Courses
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-400">✓</span> Internship Opportunities
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-400">✓</span> Certificate Verification
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-400">✓</span> Study Materials & Resources
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-400">✓</span> Enrollment Process
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 sm:p-8">
              <div className="flex items-start gap-4">
                <div className="text-3xl sm:text-4xl">🚀</div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-3">Why Choose Our AI?</h3>
                  <ul className="space-y-2 text-sm sm:text-base text-gray-300">
                    <li className="flex items-center gap-2">
                      <span className="text-red-400">●</span> Connected to official website
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-red-400">●</span> 24/7 availability
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-red-400">●</span> Instant, accurate responses
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-red-400">●</span> Source citations included
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-red-400">●</span> Human support backup
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 sm:p-8">
            <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 text-center">Quick Access</h3>
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap justify-center gap-3">
              {[
                { icon: '🏠', label: 'Home', url: 'https://www.vaultofcodes.in/' },
                { icon: '📚', label: 'Courses', url: 'https://www.vaultofcodes.in/courses' },
                { icon: '💼', label: 'Internships', url: 'https://www.vaultofcodes.in/internships' },
                { icon: 'ℹ️', label: 'About', url: 'https://www.vaultofcodes.in/about-us' },
                { icon: '📞', label: 'Contact', url: 'https://www.vaultofcodes.in/contact-us' },
                { icon: '💬', label: 'WhatsApp', url: 'https://wa.me/919455345519', special: true }
              ].map((link, i) => (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${
                    link.special
                      ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                      : 'bg-white/5 hover:bg-white/10'
                  } backdrop-blur-sm border ${
                    link.special ? 'border-green-500/50' : 'border-white/10'
                  } rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-white hover:scale-105 transition-all text-sm sm:text-base font-medium text-center whitespace-nowrap`}
                >
                  <span className="mr-1 sm:mr-2">{link.icon}</span>
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-white/5 backdrop-blur-sm border-t border-white/10 py-6 sm:py-8 mt-12 sm:mt-20">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm sm:text-base text-gray-400 mb-2">⚡ Powered by Groq AI • Built with React</p>
          <p className="text-xs sm:text-sm text-gray-500">© 2024 VaultOfCodes. All rights reserved.</p>
        </div>
      </footer>

      {/* Chatbot */}
      <ChatBot isOpen={showChat} onClose={() => setShowChat(false)} />
    </div>
  );
}

export default App;
