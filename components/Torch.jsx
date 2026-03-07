// Animated torch/flame SVG component
export default function Torch({ className = "", size = 120 }) {
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size * 1.5 }}>
      {/* Outer glow */}
      <div 
        className="absolute inset-0 rounded-full flame-flicker"
        style={{
          background: 'radial-gradient(ellipse at center bottom, rgba(245, 158, 11, 0.3) 0%, transparent 70%)',
          transform: 'scale(1.5)',
        }}
      />
      
      {/* Main flame SVG */}
      <svg
        viewBox="0 0 100 150"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full flame-flicker"
        style={{ filter: 'drop-shadow(0 0 20px rgba(245, 158, 11, 0.8))' }}
      >
        {/* Outer flame */}
        <path
          d="M50 10
             C30 40, 15 60, 20 90
             C25 115, 35 130, 50 140
             C65 130, 75 115, 80 90
             C85 60, 70 40, 50 10Z"
          fill="url(#flameGradient)"
        />
        
        {/* Inner bright core */}
        <path
          d="M50 35
             C40 55, 32 70, 35 90
             C38 105, 43 115, 50 125
             C57 115, 62 105, 65 90
             C68 70, 60 55, 50 35Z"
          fill="url(#coreGradient)"
        />
        
        {/* Hot center */}
        <ellipse
          cx="50"
          cy="100"
          rx="10"
          ry="20"
          fill="#FEF3C7"
          opacity="0.9"
        />
        
        <defs>
          <linearGradient id="flameGradient" x1="50" y1="10" x2="50" y2="140" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="40%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#B45309" />
          </linearGradient>
          
          <linearGradient id="coreGradient" x1="50" y1="35" x2="50" y2="125" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FCD34D" />
            <stop offset="50%" stopColor="#FBBF24" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
