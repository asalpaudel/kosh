import React, { useEffect, useRef, useState } from 'react';
import Snow from 'react-snowfall';

const Landing = () => {
  const cursorRef = useRef(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [cursorVisible, setCursorVisible] = useState(false);
  const trailRef = useRef([]);

  // 3D Cursor Trail Effect
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      setCursorVisible(true);

      trailRef.current.push({ x: e.clientX, y: e.clientY, time: Date.now() });

      // Keep only last 15 points
      if (trailRef.current.length > 15) {
        trailRef.current.shift();
      }
    };

    const handleMouseLeave = () => {
      setCursorVisible(false);
      trailRef.current = [];
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  // Animate trail
  useEffect(() => {
    const animate = () => {
      if (cursorRef.current) {
        cursorRef.current.style.left = `${mousePosition.x}px`;
        cursorRef.current.style.top = `${mousePosition.y}px`;
      }
      requestAnimationFrame(animate);
    };
    animate();
  }, [mousePosition]);

  const features = [
    {
      icon: '📊',
      title: 'Real-Time Accounting',
      description: 'Track your finances in real-time with automated ledgers and instant reports',
      gradient: 'from-cyan-500 to-teal-500'
    },
    {
      icon: '🔒',
      title: 'Bank-Grade Security',
      description: 'AES-256 encryption with multi-factor authentication for complete protection',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      icon: '🤝',
      title: 'Cooperative Management',
      description: 'Designed specifically for Sahakari institutions with member management',
      gradient: 'from-orange-500 to-red-500'
    },
    {
      icon: '📈',
      title: 'Advanced Analytics',
      description: 'AI-powered insights and predictive analytics for better decision making',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: '⚡',
      title: 'Lightning Fast',
      description: 'Optimized performance with 99.9% uptime guarantee',
      gradient: 'from-yellow-500 to-orange-500'
    },
    {
      icon: '🌐',
      title: 'Multi-Branch Support',
      description: 'Manage multiple branches from a single dashboard',
      gradient: 'from-green-500 to-teal-500'
    }
  ];

  const solutions = [
    {
      title: 'For Cooperative Banks',
      features: ['Member Management', 'Loan Processing', 'Deposit Management', 'Audit Trails']
    },
    {
      title: 'For Credit Societies',
      features: ['Share Capital', 'Dividend Distribution', 'Loan Recovery', 'Reports']
    },
    {
      title: 'For NGOs & Trusts',
      features: ['Fund Accounting', 'Grant Management', 'Donor Tracking', 'Compliance']
    }
  ];

  const stats = [
    { number: '500+', label: 'Organizations' },
    { number: 'Rs,5000Cr+', label: 'Assets Managed' },
    { number: '99.9%', label: 'Uptime' },
    { number: '24/7', label: 'Support' }
  ];

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
      <Snow color="#3EEFB1" count={50} wind={[0, 2]} />

      {/* Custom 3D Cursor */}
      {cursorVisible && (
        <>
          <div
            ref={cursorRef}
            className="fixed w-4 h-4 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50 transition-transform duration-100"
            style={{ transform: 'translate(-50%, -50%) scale(1)' }}
          >
            <div className="w-full h-full rounded-full bg-cyan-400 shadow-lg shadow-cyan-500/50 animate-pulse" />
          </div>

          {/* Trail dots */}
          {trailRef.current.map((point, index) => {
            const age = Date.now() - point.time;
            const opacity = Math.max(0, 1 - age / 500);
            const scale = Math.max(0, 1 - age / 300);
            return (
              <div
                key={index}
                className="fixed pointer-events-none z-40 transition-all duration-75"
                style={{
                  left: `${point.x}px`,
                  top: `${point.y}px`,
                  transform: `translate(-50%, -50%) scale(${scale})`,
                  opacity: opacity * 0.6
                }}
              >
                <div className={`w-3 h-3 rounded-full bg-gradient-to-r from-cyan-400 to-teal-500 shadow-md`} />
              </div>
            );
          })}
        </>
      )}

      {/* Navigation */}
      <nav className="relative z-30 px-6 py-6 backdrop-blur-lg bg-slate-900/30 border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3 group cursor-pointer">
            <span className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
              Kosh
            </span>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            {['Features', 'Solutions', 'Pricing', 'About'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-slate-300 hover:text-cyan-400 transition-colors duration-300 relative group"
              >
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-cyan-400 to-teal-400 group-hover:w-full transition-all duration-300" />
              </a>
            ))}
          </div>

          <button className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-full font-semibold hover:shadow-lg hover:shadow-cyan-500/50 transform hover:scale-105 transition-all duration-300">
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-block mb-6 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full backdrop-blur-sm">
            <span className="text-cyan-400 text-sm font-medium">🚀 Now supporting 500+ Cooperative Institutions</span>
          </div>

          <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
            Nepal's Most Trusted
            <br />
            <span className="bg-gradient-to-r from-cyan-400 via-teal-400 to-green-400 bg-clip-text text-transparent animate-gradient">
              Cooperative Accounting Platform
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-slate-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            Empowering Sahakari institutions with smart, secure, and simple accounting solutions.
            Manage your cooperative with confidence.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
            <button className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-full font-semibold text-lg hover:shadow-2xl hover:shadow-cyan-500/50 transform hover:scale-105 transition-all duration-300 group">
              Start Free Trial
              <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">→</span>
            </button>
            <button className="px-8 py-4 bg-slate-800/50 border border-slate-700 rounded-full font-semibold text-lg hover:bg-slate-700/50 transition-all duration-300 backdrop-blur-sm">
              Watch Demo
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center group cursor-pointer">
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform duration-300">
                  {stat.number}
                </div>
                <div className="text-slate-400 text-sm md:text-base">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Hero Image/Visual */}
          <div className="relative mt-20 max-w-5xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-teal-500/20 rounded-3xl blur-3xl" />
            <div className="relative bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl p-8 shadow-2xl">
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-32 bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-lg animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-bold mb-4">
              Everything you need to
              <span className="bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent"> manage</span>
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Powerful features designed specifically for cooperative institutions
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl p-8 hover:border-cyan-500/50 transition-all duration-300 hover:transform hover:scale-105 cursor-pointer"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-300`} />
                <div className="relative z-10">
                  <div className="text-5xl mb-4 transform group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-slate-400 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section id="solutions" className="relative z-10 py-24 px-6 bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-bold mb-4">
              Built for <span className="bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">every</span> cooperative
            </h2>
            <p className="text-xl text-slate-400">Tailored solutions for your specific needs</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {solutions.map((solution, index) => (
              <div
                key={index}
                className="group relative bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-8 hover:border-cyan-500 transition-all duration-300 cursor-pointer"
              >
                <div className="absolute -inset-px bg-gradient-to-r from-cyan-500 to-teal-500 rounded-2xl opacity-0 group-hover:opacity-20 blur transition-opacity duration-300" />
                <div className="relative z-10">
                  <h3 className="text-2xl font-bold mb-6 text-cyan-400">{solution.title}</h3>
                  <ul className="space-y-3">
                    {solution.features.map((feature, i) => (
                      <li key={i} className="flex items-center text-slate-300">
                        <svg className="w-5 h-5 mr-3 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <button className="mt-6 w-full py-3 bg-slate-700/50 hover:bg-gradient-to-r hover:from-cyan-500 hover:to-teal-500 rounded-lg font-semibold transition-all duration-300">
                    Learn More
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="relative bg-gradient-to-br from-cyan-500/20 via-teal-500/20 to-green-500/20 backdrop-blur-xl border border-cyan-500/30 rounded-3xl p-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to transform your cooperative?
            </h2>
            <p className="text-xl text-slate-300 mb-8">
              Join 500+ institutions already using Kosh. Start your 14-day free trial today.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <input
                type="email"
                placeholder="Enter your email"
                className="px-6 py-4 bg-slate-800/50 border border-slate-700 rounded-full focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 w-full sm:w-80 backdrop-blur-sm"
              />
              <button className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-full font-semibold hover:shadow-2xl hover:shadow-cyan-500/50 transform hover:scale-105 transition-all duration-300 whitespace-nowrap">
                Get Started Free
              </button>
            </div>
            <p className="text-sm text-slate-400 mt-4">No credit card required • 14-day free trial</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-700/50 bg-slate-900/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
                  Kosh
                </span>
              </div>
              <p className="text-slate-400 text-sm">
                Nepal's most trusted cooperative accounting platform
              </p>
            </div>

            {['Product', 'Company', 'Resources'].map((category) => (
              <div key={category}>
                <h4 className="font-semibold mb-4">{category}</h4>
                <ul className="space-y-2 text-slate-400 text-sm">
                  {['Features', 'Pricing', 'Security', 'Roadmap'].map((item) => (
                    <li key={item}>
                      <a href="#" className="hover:text-cyan-400 transition-colors duration-300">
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-700/50 pt-8 text-center text-slate-400 text-sm">
            <p>© 2024 Kosh. All rights reserved. | Made with ❤️ for Nepali Cooperatives</p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  );
};

export default Landing;