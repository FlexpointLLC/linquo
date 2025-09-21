import React from 'react';

interface ChatIconProps {
  className?: string;
}

export function ChatIcon({ className = "w-6 h-6" }: ChatIconProps) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Speech bubble shape */}
      <path 
        d="M20 2H4C2.9 2 2 2.9 2 4V16C2 17.1 2.9 18 4 18H6L10 22L14 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" 
        fill="white"
      />
      {/* Speech bubble tail */}
      <path 
        d="M6 18L10 14H4V4H20V16H10L6 18Z" 
        fill="white"
      />
      {/* Three dots */}
      <circle cx="8" cy="8" r="1" fill="black" />
      <circle cx="12" cy="8" r="1" fill="black" />
      <circle cx="16" cy="8" r="1" fill="black" />
    </svg>
  );
}
