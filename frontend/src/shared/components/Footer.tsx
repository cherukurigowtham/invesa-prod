
export default function Footer() {
  return (
    <footer className="bg-[#04040a] border-t border-white/[0.05] py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 sm:gap-8 mb-12 sm:mb-16">
          
          {/* Brand Column */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="footerLogoBulbGrad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#8ab4f8" />
                      <stop offset="100%" stopColor="#c58af9" />
                    </linearGradient>
                    <linearGradient id="footerLogoGrowthGrad" x1="0" y1="24" x2="24" y2="0" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#34a853" />
                      <stop offset="100%" stopColor="#8ab4f8" />
                    </linearGradient>
                  </defs>
                  {/* Bulb outline */}
                  <path
                    d="M15 14c1.2-1.2 2-2.8 2-4.5a5 5 0 0 0-10 0c0 1.7.8 3.3 2 4.5"
                    stroke="url(#footerLogoBulbGrad)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="url(#footerLogoBulbGrad)"
                    fillOpacity="0.06"
                  />
                  {/* Bulb base lines */}
                  <path
                    d="M9 17.5h6"
                    stroke="url(#footerLogoBulbGrad)"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M10 20.5h4"
                    stroke="url(#footerLogoBulbGrad)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  {/* Bar chart inside */}
                  <rect x="9" y="11" width="1.5" height="3" rx="0.75" fill="url(#footerLogoGrowthGrad)" fillOpacity="0.85" />
                  <rect x="11.25" y="9" width="1.5" height="5" rx="0.75" fill="url(#footerLogoGrowthGrad)" fillOpacity="0.85" />
                  <rect x="13.5" y="7" width="1.5" height="7" rx="0.75" fill="url(#footerLogoGrowthGrad)" fillOpacity="0.85" />
                  {/* Trend arrow shooting through */}
                  <path
                    d="M7.5 13L10 11L12 12L17.5 7"
                    stroke="url(#footerLogoGrowthGrad)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M15 7h2.5V9.5"
                    stroke="url(#footerLogoGrowthGrad)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span className="font-display text-lg font-bold text-white">Invesa</span>
            </div>
            <p className="text-sm text-white/50 leading-relaxed mb-6">
              Connect with partners, share your projects, and discover new startups to support.
            </p>
            <div className="flex items-center gap-4 text-white/40">
              <a href="#" className="hover:text-indigo-400 transition-colors">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a href="#" className="hover:text-indigo-400 transition-colors">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                </svg>
              </a>
              <a href="#" className="hover:text-indigo-400 transition-colors">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.8v8.37h2.8v-4.87c0-.26.05-.52.13-.7a1.11 1.11 0 0 1 .98-.7c.56 0 .79.5.79 1.17v5.1h2.8M6.5 8.37a1.37 1.37 0 1 0 0-2.75 1.37 1.37 0 0 0 0 2.75M8 18.5V10.13H5.2v8.37H8z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Nav Links columns */}
          <div>
            <h4 className="text-white text-sm font-semibold tracking-wider uppercase mb-4">Platform</h4>
            <ul className="space-y-2.5 text-sm text-white/50">
              <li><a href="/ideas" className="hover:text-white transition-colors">Browse Projects</a></li>
              <li><a href="/feed" className="hover:text-white transition-colors">Project Updates</a></li>
              <li><a href="/post-idea" className="hover:text-white transition-colors">Post Project</a></li>
              <li><a href="/register" className="hover:text-white transition-colors">Join as Partner</a></li>
              <li><a href="/register" className="hover:text-white transition-colors">Support Projects</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white text-sm font-semibold tracking-wider uppercase mb-4">Trust & Security</h4>
            <ul className="space-y-2.5 text-sm text-white/50">
              <li><a href="#" className="hover:text-white transition-colors">Project Ownership Proof</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Digital Fingerprints</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Platform Security</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white text-sm font-semibold tracking-wider uppercase mb-4">About</h4>
            <ul className="space-y-2.5 text-sm text-white/50">
              <li><a href="#" className="hover:text-white transition-colors">Our Mission</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Success Stories</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact Support</a></li>
            </ul>
          </div>

        </div>

        {/* Bottom Line */}
        <div className="pt-8 border-t border-white/[0.05] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/40">
          <p>© {new Date().getFullYear()} Invesa Technologies Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Sitemap</a>
            <a href="#" className="hover:text-white transition-colors">Cookies</a>
          </div>
        </div>

      </div>
    </footer>
  );
}
