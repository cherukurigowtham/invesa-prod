import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Lightbulb, Users, Shield, TrendingUp, Zap, Sliders, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Landing() {
  const [activeStep, setActiveStep] = useState(0);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.4 } }
  };

  const steps = [
    {
      num: '01',
      title: 'Register & Protect',
      short: 'Secure Priority',
      desc: 'Post your project under a category. Invesa immediately calculates a local cryptographic file hash and timestamps it, creating a priority claim on your intellectual property.',
      icon: <Shield className="w-5 h-5 text-indigo-400" />,
      visual: (
        <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-5 flex flex-col justify-center space-y-3 h-full min-h-[160px]">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <span className="text-[10px] text-white/40 uppercase font-bold">IP Stamp</span>
            <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-bold">VERIFIED</span>
          </div>
          <div className="font-mono text-[9px] text-white/60 space-y-1">
            <p className="truncate text-indigo-300">Hash: sha256-8f3a9d21c5b...</p>
            <p>Timestamp: {new Date().toLocaleDateString()}</p>
          </div>
          <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
            <div className="w-full h-full bg-indigo-500 rounded-full animate-pulse" />
          </div>
        </div>
      )
    },
    {
      num: '02',
      title: 'Match & Recruit',
      short: 'Find Partners',
      desc: "Our matchmaking engine scans wanted builder slots and candidates' skill profiles to calculate a compatibility percentage. Find matching builders and invite them in one click.",
      icon: <Zap className="w-5 h-5 text-emerald-400" />,
      visual: (
        <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-5 flex flex-col justify-center space-y-4 h-full min-h-[160px]">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center font-bold text-emerald-400 text-xs">RN</div>
              <div>
                <p className="text-xs font-bold text-white leading-tight">Rohan Nair</p>
                <p className="text-[9px] text-white/40">React Developer</p>
              </div>
            </div>
            <div className="text-xs font-mono font-bold text-emerald-400">92% Match</div>
          </div>
          <div className="flex flex-wrap gap-1">
            {['React', 'TypeScript', 'Tailwind'].map(s => (
              <span key={s} className="text-[8px] bg-white/5 border border-white/10 text-white/50 px-1.5 py-0.5 rounded font-semibold">{s}</span>
            ))}
          </div>
        </div>
      )
    },
    {
      num: '03',
      title: 'Shares & Offers',
      short: 'Equity Planning',
      desc: 'Simulate founder cap tables, compare VC term sheet offers side-by-side, and schedule vesting timelines using simple, clear interactive planners.',
      icon: <Sliders className="w-5 h-5 text-amber-400" />,
      visual: (
        <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-4 flex flex-col justify-center space-y-2.5 h-full min-h-[160px]">
          <div className="flex items-center justify-between border-b border-white/5 pb-1">
            <span className="text-[9px] text-white/40 uppercase font-bold">Equity Overview</span>
            <span className="text-[9px] text-amber-400 font-bold font-mono">$5M Val</span>
          </div>
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-[8px] text-white/60 mb-0.5">
                <span>Founder Shares</span>
                <span className="font-semibold">60.0%</span>
              </div>
              <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                <div className="h-full bg-[#8ab4f8] rounded-full" style={{ width: '60%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[8px] text-white/60 mb-0.5">
                <span>VC Offer A vs B</span>
                <span className="font-semibold">20.0% vs 15.0%</span>
              </div>
              <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                <div className="h-full bg-purple-400 rounded-full" style={{ width: '20%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[8px] text-white/60 mb-0.5">
                <span>Vesting Schedule</span>
                <span className="font-semibold">48 Mo / 12 Mo Cliff</span>
              </div>
              <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                <div className="h-full bg-rose-400 rounded-full" style={{ width: '100%' }} />
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      num: '04',
      title: 'Collaborate & Build',
      short: 'Real-Time Sync',
      desc: 'Use secure, auto-generated project discussion channels and direct messaging chats to sync with builders, exchange code, post updates, and coordinate launch sprints.',
      icon: <MessageSquare className="w-5 h-5 text-indigo-400" />,
      visual: (
        <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-4 flex flex-col justify-between h-full min-h-[160px]">
          <div className="flex items-center gap-1.5 border-b border-white/5 pb-1.5 select-none">
            <span className="text-[9px] font-bold text-white/60"># marketing-sprint</span>
          </div>
          <div className="space-y-1.5 py-1">
            <div className="bg-indigo-500/10 border border-indigo-500/25 p-2 rounded-xl text-[9px] text-indigo-200">
              Founder: We are ready to launch!
            </div>
            <div className="bg-white/5 border border-white/10 p-2 rounded-xl text-[9px] text-white/70">
              Builder: Landing pages are deployed.
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="relative overflow-hidden bg-surface-default pt-[52px] pb-16" style={{ contain: 'layout' }}>
      
      {/* Grid Pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:32px_32px] -z-20 noise" />
 
      <div className="max-w-[1440px] mx-auto px-6 sm:px-8 lg:px-12">
        
        {/* HERO SECTION */}
        <motion.div 
          className="text-center max-w-4xl mx-auto mb-16 sm:mb-24"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          style={{ willChange: 'opacity' }}
        >
 
          <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6 leading-[1.1]">
            Where Great Ideas Find Their <span className="text-gradient-indigo">Team</span> & <span className="text-gradient-amber">Capital</span>
          </h1>
 
          <p className="text-lg sm:text-xl text-white/60 mb-10 leading-relaxed max-w-2xl mx-auto">
            Got a project idea? Secure it instantly. Need developers or designers? Open slots for partners. Looking to support? Monitor progress in real time.
          </p>
 
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register" className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2 group text-base">
              Get Started Now
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/ideas" className="btn-secondary w-full sm:w-auto text-base">
              Explore Ideas
            </Link>
          </div>
        </motion.div>
 
        {/* STATS SECTION */}
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto mb-24 sm:mb-32"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          style={{ willChange: 'opacity' }}
        >
          <motion.div className="glass p-6 text-center border-l-4 border-indigo-500" variants={itemVariants}>
            <div className="text-3xl sm:text-4xl font-extrabold text-white mb-2">1,240+</div>
            <div className="text-sm text-white/50 font-medium">Ideas Registered</div>
          </motion.div>
          <motion.div className="glass p-6 text-center border-l-4 border-emerald-500" variants={itemVariants}>
            <div className="text-3xl sm:text-4xl font-extrabold text-white mb-2">480+</div>
            <div className="text-sm text-white/50 font-medium">Teams Assembled</div>
          </motion.div>
          <motion.div className="glass p-6 text-center border-l-4 border-amber-500" variants={itemVariants}>
            <div className="text-3xl sm:text-4xl font-extrabold text-white mb-2">₹5.8 Cr</div>
            <div className="text-sm text-white/50 font-medium">Capital Committed</div>
          </motion.div>
        </motion.div>
 
        {/* ROLE PATHWAY SECTION */}
        <div className="mb-24 sm:mb-32">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4 text-white">Three Roles. One Platform.</h2>
            <p className="text-white/50">Invesa matches the right minds with the right resources at the right time.</p>
          </div>
 
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Founders */}
            <div className="glass p-8 hover:border-indigo-500/30 transition-all group flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Lightbulb className="w-6 h-6 text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">For Founders</h3>
                <p className="text-sm text-white/50 leading-relaxed mb-6">
                  Post your ideas and secure them instantly. Add roles to invite teammates and showcase your projects to backers.
                </p>
              </div>
              <Link to="/register?role=founder" className="text-sm font-semibold text-indigo-400 flex items-center gap-1 hover:text-indigo-300 transition-colors">
                Register as Founder <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
 
            {/* Builders */}
            <div className="glass p-8 hover:border-emerald-500/30 transition-all group flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">For Builders</h3>
                <p className="text-sm text-white/50 leading-relaxed mb-6">
                  Browse project ideas, apply to join teams that fit your skills, and earn company share ownership or experience.
                </p>
              </div>
              <Link to="/register?role=builder" className="text-sm font-semibold text-emerald-400 flex items-center gap-1 hover:text-emerald-300 transition-colors">
                Register as Builder <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
 
            {/* Investors */}
            <div className="glass p-8 hover:border-amber-500/30 transition-all group flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="w-6 h-6 text-amber-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">For Investors</h3>
                <p className="text-sm text-white/50 leading-relaxed mb-6">
                  Find promising projects, track their real-time progress feeds, and connect with founders early.
                </p>
              </div>
              <Link to="/register?role=investor" className="text-sm font-semibold text-amber-400 flex items-center gap-1 hover:text-amber-300 transition-colors">
                Register as Investor <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
 
          </div>
        </div>
 
        {/* HOW IT WORKS SECTION */}
        <div className="mb-24 sm:mb-32">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4 text-white">How it Works</h2>
            <p className="text-white/50 text-sm">A simple flow from posting a project, matching with partners, to estimating shares.</p>
          </div>

          <div className="space-y-6 max-w-5xl mx-auto">
            {/* Step selection row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {steps.map((step, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveStep(idx)}
                  className={`p-4 rounded-2xl border text-left cursor-pointer transition-all flex items-center gap-3.5 ${
                    activeStep === idx 
                      ? 'bg-indigo-500/10 border-indigo-500/40 text-white shadow-[0_0_15px_rgba(99,102,241,0.15)]' 
                      : 'bg-white/[0.01] border-white/5 text-white/50 hover:bg-white/[0.02] hover:border-white/10 hover:text-white'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    activeStep === idx ? 'bg-indigo-500/20 border border-indigo-500/30' : 'bg-white/5 border border-white/10'
                  }`}>
                    {step.icon}
                  </div>
                  <div className="truncate">
                    <span className="text-[8px] font-bold text-white/40 block leading-tight">{step.num} STEP</span>
                    <span className="text-xs font-bold block truncate">{step.short}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Active step detail card */}
            <div className="glass p-8 sm:p-10 border border-white/[0.04] grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-indigo-500/[0.01] min-h-[220px]">
              <div className="md:col-span-8 space-y-3.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold text-indigo-400 bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 rounded-md uppercase tracking-wider">
                    Step {steps[activeStep].num}
                  </span>
                  <h3 className="text-xl font-bold text-white">{steps[activeStep].title}</h3>
                </div>
                <p className="text-xs sm:text-sm text-white/60 leading-relaxed max-w-xl font-sans">
                  {steps[activeStep].desc}
                </p>
              </div>

              <div className="md:col-span-4 w-full">
                {steps[activeStep].visual}
              </div>
            </div>
          </div>
        </div>
 
        {/* SECURITY SENTINEL */}
        <div className="glass-card p-10 sm:p-16 mb-16 relative overflow-hidden">
          
          
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 sm:gap-12">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2.5 mb-4 text-emerald-400 font-semibold text-sm">
                <Shield className="w-5 h-5" />
                Project Security &amp; Ownership
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mb-4">
                Secure your project ideas instantly
              </h2>
              <p className="text-sm sm:text-base text-white/60 leading-relaxed">
                Protect your ideas from being copied. When you post an idea, Invesa generates a digital fingerprint of your description with a permanent timestamp. This proves you came up with the idea first.
              </p>
            </div>
            <div className="flex-shrink-0 w-full lg:w-auto">
              <Link to="/ideas" className="btn-secondary w-full lg:w-auto justify-center text-sm font-semibold py-3 px-6 flex items-center gap-2">
                Browse Projects
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
 
      </div>
    </div>
  );
}
