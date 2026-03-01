import React from 'react';

interface ProbabilityBarProps {
  value: number; // between 0 and 1
}

const ProbabilityBar: React.FC<ProbabilityBarProps> = ({ value }) => {
  const percent = Math.min(Math.max(value, 0), 1) * 100;
  return (
    <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
      <div
        className="h-full bg-green-500"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
};

export default ProbabilityBar;
