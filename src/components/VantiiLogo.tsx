import React from 'react'

const VantiiLogo: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <svg
      className={`w-12 h-12 ${className}`}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="40" height="40" rx="8" fill="#000000" />
      <path
        d="M10 30L20 10L30 30"
        stroke="#10B981"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default VantiiLogo 