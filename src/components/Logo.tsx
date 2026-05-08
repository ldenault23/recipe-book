export default function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 845 180"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Olivia's Recipe Book"
    >
      {/* Open book icon */}
      <g transform="translate(0, 0)">
        {/* Left page */}
        <path
          d="M10 20C10 20 35 15 70 18V160C35 157 10 160 10 160V20Z"
          fill="#79852c"
          opacity="0.12"
        />
        {/* Right page */}
        <path
          d="M130 20C130 20 105 15 70 18V160C105 157 130 160 130 160V20Z"
          fill="#79852c"
          opacity="0.12"
        />
        {/* Book spine */}
        <line x1="70" y1="18" x2="70" y2="160" stroke="#79852c" strokeWidth="2.5" />
        {/* Left page outline */}
        <path
          d="M10 20C10 20 35 15 70 18V160C35 157 10 160 10 160V20Z"
          stroke="#79852c"
          strokeWidth="2.5"
          fill="none"
        />
        {/* Right page outline */}
        <path
          d="M130 20C130 20 105 15 70 18V160C105 157 130 160 130 160V20Z"
          stroke="#79852c"
          strokeWidth="2.5"
          fill="none"
        />
        {/* Stem rising from book */}
        <path
          d="M70 80C70 80 70 50 70 35"
          stroke="#79852c"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Leaf on left */}
        <path
          d="M70 35C55 38 40 50 40 58C40 66 55 72 70 55"
          stroke="#79852c"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="#79852c"
          fillOpacity="0.15"
        />
        {/* Leaf vein */}
        <line x1="70" y1="45" x2="48" y2="58" stroke="#79852c" strokeWidth="1.2" strokeLinecap="round" />
        {/* Spoon on right */}
        <path
          d="M70 35C85 38 100 50 100 58C100 66 85 72 70 55"
          stroke="#79852c"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="#79852c"
          fillOpacity="0.15"
        />
        {/* Spoon handle */}
        <line x1="70" y1="45" x2="92" y2="58" stroke="#79852c" strokeWidth="1.2" strokeLinecap="round" />
      </g>

      {/* Olivias text */}
      <text
        x="160"
        y="95"
        fontFamily="'Inter', 'Segoe UI', system-ui, sans-serif"
        fontSize="68"
        fontWeight="700"
        fill="#79852c"
        letterSpacing="-1"
      >
        Olivia&apos;s
      </text>

      {/* RECIPE BOOK text */}
      <text
        x="162"
        y="125"
        fontFamily="'Inter', 'Segoe UI', system-ui, sans-serif"
        fontSize="22"
        fontWeight="600"
        fill="#79852c"
        letterSpacing="8"
      >
        RECIPE BOOK
      </text>

      {/* Subtle underline accent */}
      <line x1="162" y1="138" x2="680" y2="138" stroke="#79852c" strokeWidth="1" opacity="0.2" />
    </svg>
  );
}
