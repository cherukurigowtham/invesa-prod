/**
 * DashboardStats.tsx
 *
 * Renders the quick statistics grid dynamically calculated from the backend
 * (My Projects, Join Requests, Investor Signals, Team Members / Applications)
 * with glassmorphic styling, animations, and live SVG sparkline graphs.
 */

import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 220, damping: 20 } }
};

interface DashboardStatsProps {
  user: any;
  dashboardData: any;
  density?: 'spacious' | 'compact';
}

export default function DashboardStats({ user, dashboardData, density = 'spacious' }: DashboardStatsProps) {
  const isCompact = density === 'compact';
  if (!user) return null;

  // Define metric cards based on user role
  let stats: {
    label: string;
    value: string | number;
    sublabel: string;
    color: string;
    gradientId: string;
    pathD: string;
  }[] = [];

  if (user.role === 'founder') {
    const myProjects = dashboardData?.myIdeas?.length || 0;
    const pendingRequests = dashboardData?.pendingRequests?.length || 0;
    const investorSignals = dashboardData?.investorSignals?.length || 0;
    const teamMembersCount = dashboardData?.myIdeas?.reduce(
      (acc: number, idea: any) => acc + (idea.teamMembers?.length || 0),
      0
    ) || 0;

    stats = [
      {
        label: 'My Projects',
        value: myProjects,
        sublabel: 'Active listings',
        color: '#8ab4f8',
        gradientId: 'viewsGrad',
        pathD: 'M0 35 Q15 15, 30 25 T60 10 T90 20 T120 5',
      },
      {
        label: 'Join Requests',
        value: pendingRequests,
        sublabel: 'Pending review',
        color: '#81c995',
        gradientId: 'appGrad',
        pathD: 'M0 25 Q15 35, 30 20 T60 30 T90 10 T120 15',
      },
      {
        label: 'Investor Signals',
        value: investorSignals,
        sublabel: 'Expressed interest',
        color: '#fecd75',
        gradientId: 'valGrad',
        pathD: 'M0 30 Q15 25, 30 35 T60 15 T90 20 T120 5',
      },
      {
        label: 'Team Members',
        value: teamMembersCount,
        sublabel: 'Across all projects',
        color: '#8ab4f8',
        gradientId: 'matchesGrad',
        pathD: 'M0 35 Q15 30, 30 25 T60 20 T90 10 T120 5',
      },
    ];
  } else if (user.role === 'builder') {
    const appliedRequests = dashboardData?.appliedRequests?.length || 0;
    const myTeamsCount = dashboardData?.myTeams?.length || 0;
    const pendingRequests = dashboardData?.appliedRequests?.filter((r: any) => r.status === 'pending')?.length || 0;
    const skillsCount = user?.skills?.length || 0;

    stats = [
      {
        label: 'My Applications',
        value: appliedRequests,
        sublabel: 'Requests sent',
        color: '#8ab4f8',
        gradientId: 'viewsGrad',
        pathD: 'M0 35 Q15 15, 30 25 T60 10 T90 20 T120 5',
      },
      {
        label: 'Joined Teams',
        value: myTeamsCount,
        sublabel: 'Active collaborations',
        color: '#81c995',
        gradientId: 'appGrad',
        pathD: 'M0 25 Q15 35, 30 20 T60 30 T90 10 T120 15',
      },
      {
        label: 'Pending Review',
        value: pendingRequests,
        sublabel: 'Awaiting founder answer',
        color: '#fecd75',
        gradientId: 'valGrad',
        pathD: 'M0 30 Q15 25, 30 35 T60 15 T90 20 T120 5',
      },
      {
        label: 'My Skills',
        value: skillsCount,
        sublabel: 'Enrolled in profile',
        color: '#8ab4f8',
        gradientId: 'matchesGrad',
        pathD: 'M0 35 Q15 30, 30 25 T60 20 T90 10 T120 5',
      },
    ];
  } else {
    // Investor
    const pipelineCount = dashboardData?.pipeline?.length || 0;
    const allStartupsCount = dashboardData?.allStartups?.length || 0;
    const uniqueSectors = new Set(dashboardData?.pipeline?.map((i: any) => i.category) || []).size;
    const earlyStageStartups = dashboardData?.allStartups?.filter((i: any) => ['Prototype', 'MVP'].includes(i.stage))?.length || 0;

    stats = [
      {
        label: 'My Watchlist',
        value: pipelineCount,
        sublabel: 'Tracked startups',
        color: '#fecd75',
        gradientId: 'valGrad',
        pathD: 'M0 30 Q15 25, 30 35 T60 15 T90 20 T120 5',
      },
      {
        label: 'All Startups',
        value: allStartupsCount,
        sublabel: 'Total on platform',
        color: '#8ab4f8',
        gradientId: 'viewsGrad',
        pathD: 'M0 35 Q15 15, 30 25 T60 10 T90 20 T120 5',
      },
      {
        label: 'Unique Sectors',
        value: uniqueSectors,
        sublabel: 'In starred list',
        color: '#81c995',
        gradientId: 'appGrad',
        pathD: 'M0 25 Q15 35, 30 20 T60 30 T90 10 T120 15',
      },
      {
        label: 'Early Stage Startups',
        value: earlyStageStartups,
        sublabel: 'Prototype or MVP stage',
        color: '#8ab4f8',
        gradientId: 'matchesGrad',
        pathD: 'M0 35 Q15 30, 30 25 T60 20 T90 10 T120 5',
      },
    ];
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${isCompact ? 'mb-6 gap-3' : 'mb-12'}`}
    >
      {stats.map((card) => (
        <motion.div 
          key={card.label}
          variants={cardVariants}
          whileHover={{ y: -4, scale: 1.02, borderColor: card.color + '40' }}
          transition={{ type: "spring" as const, stiffness: 400, damping: 25 }}
          className={`glass-card flex flex-col justify-between relative overflow-hidden group transition-colors duration-300 cursor-pointer ${isCompact ? 'p-3 h-22' : 'p-4 h-28'}`}
        >
          <div className="space-y-0.5">
            <span className="text-[9px] text-white/40 uppercase font-bold tracking-wide">{card.label}</span>
            <div className="flex items-baseline gap-1.5">
              <span className={`font-extrabold text-white font-mono ${isCompact ? 'text-lg' : 'text-xl'}`}>{card.value}</span>
              <span className="text-[8px] font-semibold text-white/40 font-mono">{card.sublabel}</span>
            </div>
          </div>
          
          {/* Sparkline SVG */}
          <div className={`absolute bottom-0 left-0 right-0 w-full overflow-hidden opacity-60 group-hover:opacity-95 transition-opacity duration-300 ${isCompact ? 'h-6' : 'h-10'}`}>
            <svg viewBox="0 0 120 40" className="w-full h-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id={card.gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={card.color} stopOpacity="0.3" />
                  <stop offset="100%" stopColor={card.color} stopOpacity="0" />
                </linearGradient>
              </defs>
              <motion.path 
                d={card.pathD} 
                fill="none" 
                stroke={card.color} 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.0, ease: "easeInOut" }}
              />
              <motion.path 
                d={card.pathD + ' L120 40 L0 40 Z'} 
                fill={`url(#${card.gradientId})`} 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
              />
            </svg>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
