/**
 * MatchScoreCircle.tsx
 *
 * Renders the circular SVG matching score indicator.
 */

interface MatchScoreCircleProps {
  score: number;
  getPercentageColor: (score: number) => string;
}

export default function MatchScoreCircle({ score, getPercentageColor }: MatchScoreCircleProps) {
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (score / 100) * circumference;
  const colors = getPercentageColor(score).split(' ');
  const strokeColorClass = colors[0];
  const textColorClass = colors[1];

  return (
    <div className="relative w-12 h-12 flex items-center justify-center flex-shrink-0">
      <svg className="w-full h-full transform -rotate-90">
        <circle cx="24" cy="24" r={radius} className="stroke-white/5 fill-transparent" strokeWidth="3.5" />
        <circle 
          cx="24" 
          cy="24" 
          r={radius} 
          className={`fill-transparent transition-all duration-500 ${strokeColorClass}`} 
          strokeWidth="3.5"
          strokeDasharray={circumference}
          strokeDashoffset={strokeOffset}
          strokeLinecap="round"
        />
      </svg>
      <span className={`absolute text-xs font-bold font-mono ${textColorClass}`}>
        {score}%
      </span>
    </div>
  );
}
