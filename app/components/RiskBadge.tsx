import React from 'react';

interface RiskBadgeProps {
  level: 'low' | 'medium' | 'high';
}

const RiskBadge: React.FC<RiskBadgeProps> = ({ level }) => {
  let bgClass = '';
  switch (level) {
    case 'low':
      bgClass = 'bg-green-500';
      break;
    case 'medium':
      bgClass = 'bg-yellow-500';
      break;
    case 'high':
      bgClass = 'bg-red-500';
      break;
  }

  return (
    <span
      className={`${bgClass} text-white px-3 py-1 rounded-full text-sm capitalize`}
    >
      {level}
    </span>
  );
};

export default RiskBadge;
