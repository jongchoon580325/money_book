import React from 'react';

interface WonIconProps {
  size?: number;
  color?: string;
  className?: string;
}

const WonIcon: React.FC<WonIconProps> = ({ size = 24, color = 'currentColor', className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M3 7h2.5l2.5 10h1.5l2-8 2 8h1.5l2.5-10H21"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M2 12h20M4 16h16"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default WonIcon; 