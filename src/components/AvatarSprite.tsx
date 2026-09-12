import React from 'react';

interface AvatarSpriteProps {
  equippedItems: { name: string, type: string }[];
  size?: number;
  className?: string;
}

export default function AvatarSprite({ equippedItems, size = 200, className = '' }: AvatarSpriteProps) {
  const getItemName = (type: string) => 
    equippedItems.find(i => i.type === type)?.name.toUpperCase() || '';

  const top = getItemName("TOP") || getItemName("OUTFIT"); // fallback for old seed
  const bottom = getItemName("BOTTOM");
  const shoes = getItemName("SHOES");
  const hair = getItemName("HAIR");
  const hat = getItemName("HAT");
  const accessory = getItemName("ACCESSORY");
  const badge = getItemName("BADGE");
  const aura = getItemName("AURA") || getItemName("EFFECT");

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 200 200" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="skin" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f5d0b5" />
            <stop offset="100%" stopColor="#d2a679" />
          </radialGradient>
          
          <radialGradient id="aura-starfield" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.8)" />
            <stop offset="100%" stopColor="rgba(0,0,255,0)" />
          </radialGradient>
          <radialGradient id="aura-void" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(138,43,226,0.8)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
          <radialGradient id="aura-cosmic" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255,105,180,0.8)" />
            <stop offset="100%" stopColor="rgba(75,0,130,0)" />
          </radialGradient>
        </defs>

        {/* LAYER 0: AURA */}
        <g id="layer-aura">
          {aura.includes("STARFIELD") && (
            <circle cx="100" cy="100" r="90" fill="url(#aura-starfield)" opacity="0.5">
              <animate attributeName="r" values="80;100;80" dur="4s" repeatCount="indefinite" />
            </circle>
          )}
          {aura.includes("VOID") && (
            <circle cx="100" cy="100" r="90" fill="url(#aura-void)" opacity="0.6">
              <animate attributeName="opacity" values="0.4;0.8;0.4" dur="3s" repeatCount="indefinite" />
            </circle>
          )}
          {aura.includes("COSMIC") && (
            <circle cx="100" cy="100" r="90" fill="url(#aura-cosmic)" opacity="0.6">
              <animateTransform attributeName="transform" type="rotate" from="0 100 100" to="360 100 100" dur="10s" repeatCount="indefinite" />
            </circle>
          )}
        </g>

        {/* BASE BODY (idle breathing animation) */}
        <g id="layer-body">
          <animateTransform attributeName="transform" type="translate" values="0,0; 0,-1.5; 0,0" dur="3.5s" repeatCount="indefinite" />
          
          {/* Back Arm */}
          <g id="back-arm">
            <path d="M 125 75 L 145 105 L 138 110 L 115 85 Z" fill="url(#skin)" rx="5" />
            {/* Hand */}
            <circle cx="143" cy="108" r="6" fill="url(#skin)" />
          </g>

          {/* Back Leg */}
          <g id="back-leg">
            <path d="M 110 120 L 115 170 L 100 170 L 95 120 Z" fill="url(#skin)" />
          </g>

          {/* FRONT LEG */}
          <g id="front-leg">
            <path d="M 85 120 L 80 170 L 95 170 L 100 120 Z" fill="url(#skin)" />
          </g>

          {/* Torso */}
          <path d="M 80 75 Q 100 65 120 75 L 115 125 L 85 125 Z" fill="url(#skin)" />
          
          {/* Neck */}
          <rect x="92" y="60" width="16" height="15" fill="#d2a679" rx="3" />
          
          {/* Head & Face */}
          <g id="head">
            <path d="M 80 45 C 80 25, 120 25, 120 45 C 120 65, 110 70, 100 70 C 90 70, 80 65, 80 45 Z" fill="url(#skin)" />
            {/* Eyes */}
            <circle cx="92" cy="45" r="3" fill="#2d3748" />
            <circle cx="108" cy="45" r="3" fill="#2d3748" />
            {/* Mouth */}
            <path d="M 95 55 Q 100 58 105 55" stroke="#a0522d" strokeWidth="1.5" fill="none" />
          </g>

          {/* Front Arm */}
          <g id="front-arm">
            <path d="M 85 75 L 65 105 L 72 110 L 95 85 Z" fill="url(#skin)" />
            {/* Hand */}
            <circle cx="67" cy="108" r="6" fill="url(#skin)" />
          </g>

          {/* BOTTOMS */}
          <g id="layer-bottom">
            {bottom.includes("JEANS") ? (
              <g>
                <path d="M 85 120 L 80 165 L 95 165 L 100 120 Z" fill="#2b6cb0" />
                <path d="M 110 120 L 115 165 L 100 165 L 95 120 Z" fill="#2b6cb0" />
                <path d="M 80 120 Q 100 125 120 120 L 115 130 Q 100 135 85 130 Z" fill="#2c5282" />
              </g>
            ) : bottom.includes("CARGO") ? (
              <g>
                <path d="M 82 120 L 76 165 L 96 165 L 100 120 Z" fill="#4a5568" />
                <path d="M 112 120 L 118 165 L 98 165 L 94 120 Z" fill="#4a5568" />
                <rect x="74" y="140" width="10" height="12" fill="#2d3748" rx="1" />
                <rect x="110" y="140" width="10" height="12" fill="#2d3748" rx="1" />
              </g>
            ) : bottom.includes("CYBER PANTS") ? (
              <g>
                <path d="M 85 120 L 78 168 L 96 168 L 100 120 Z" fill="#1a202c" stroke="#00ffff" strokeWidth="1" />
                <path d="M 110 120 L 117 168 L 99 168 L 95 120 Z" fill="#1a202c" stroke="#00ffff" strokeWidth="1" />
                <line x1="82" y1="145" x2="92" y2="145" stroke="#ff00ff" strokeWidth="2" />
                <line x1="102" y1="145" x2="112" y2="145" stroke="#ff00ff" strokeWidth="2" />
              </g>
            ) : bottom.includes("ARENA SHORTS") ? (
              <g>
                <path d="M 85 120 L 82 145 L 98 145 L 100 120 Z" fill="#9b2c2c" />
                <path d="M 110 120 L 113 145 L 97 145 L 95 120 Z" fill="#9b2c2c" />
                <path d="M 82 120 Q 100 125 118 120" stroke="#fbd38d" strokeWidth="3" fill="none" />
              </g>
            ) : (
              /* Default / Underwear */
              <path d="M 85 120 L 85 130 Q 100 135 115 130 L 115 120 Z" fill="#e2e8f0" />
            )}
          </g>

          {/* SHOES */}
          <g id="layer-shoes">
            {shoes.includes("BOOTS") ? (
              <g fill="#4a3f35">
                <path d="M 78 160 L 98 160 L 98 175 L 75 175 Z" rx="2" />
                <path d="M 97 160 L 117 160 L 120 175 L 97 175 Z" rx="2" />
              </g>
            ) : shoes.includes("CYBER") ? (
              <g fill="#1a202c">
                <path d="M 76 165 L 96 165 L 98 178 L 74 178 Z" stroke="#00ffff" strokeWidth="1" />
                <path d="M 98 165 L 118 165 L 120 178 L 96 178 Z" stroke="#00ffff" strokeWidth="1" />
                <rect x="80" y="172" width="10" height="3" fill="#ff00ff" />
                <rect x="104" y="172" width="10" height="3" fill="#ff00ff" />
              </g>
            ) : (
              <g fill="#718096">
                <path d="M 78 168 L 95 168 L 95 175 L 76 175 Z" rx="2" />
                <path d="M 99 168 L 116 168 L 118 175 L 99 175 Z" rx="2" />
              </g>
            )}
          </g>

          {/* TOPS */}
          <g id="layer-top">
            {top.includes("CYBER") ? (
              <g>
                <path d="M 75 75 Q 100 68 125 75 L 120 122 L 80 122 Z" fill="#1a1a2e" stroke="#00ffff" strokeWidth="1.5" />
                <path d="M 100 75 L 100 122" stroke="#00ffff" strokeWidth="1" />
                <polygon points="100,90 108,100 100,110 92,100" fill="#ff00ff" />
                {/* Sleeves */}
                <path d="M 75 75 L 60 100 L 70 105 L 85 85 Z" fill="#1a1a2e" stroke="#00ffff" strokeWidth="1" />
                <path d="M 125 75 L 140 100 L 130 105 L 115 85 Z" fill="#1a1a2e" stroke="#00ffff" strokeWidth="1" />
              </g>
            ) : top.includes("SCHOLAR") ? (
              <g>
                <path d="M 75 75 Q 100 70 125 75 L 130 145 L 70 145 Z" fill="#2d3748" />
                <path d="M 85 75 L 100 105 L 115 75 Z" fill="#e2e8f0" />
                <path d="M 95 105 L 105 105 L 105 145 L 95 145 Z" fill="#ffd700" />
                <path d="M 75 75 L 55 110 L 65 115 L 85 85 Z" fill="#2d3748" />
                <path d="M 125 75 L 145 110 L 135 115 L 115 85 Z" fill="#2d3748" />
              </g>
            ) : top.includes("EXPLORER") ? (
              <g>
                <path d="M 78 75 Q 100 72 122 75 L 118 125 L 82 125 Z" fill="#8b4513" />
                <rect x="80" y="115" width="40" height="8" fill="#3e2723" />
                <rect x="95" y="113" width="10" height="12" fill="#ffd700" />
                {/* Sleeves */}
                <path d="M 78 75 L 65 95 L 72 100 L 85 85 Z" fill="#8b4513" />
                <path d="M 122 75 L 135 95 L 128 100 L 115 85 Z" fill="#8b4513" />
              </g>
            ) : top.includes("ARENA") ? (
              <g>
                <path d="M 75 75 Q 100 75 125 75 L 120 105 L 80 105 Z" fill="#b71c1c" />
                <path d="M 80 105 Q 100 115 120 105 L 115 122 Q 100 125 85 122 Z" fill="#424242" />
                <circle cx="88" cy="90" r="6" fill="#e0e0e0" />
                <circle cx="112" cy="90" r="6" fill="#e0e0e0" />
              </g>
            ) : top.includes("VOID") ? (
              <g>
                <path d="M 75 75 Q 100 70 125 75 L 130 135 L 70 135 Z" fill="#120a2a" />
                <path d="M 85 135 L 100 95 L 115 135 Z" fill="rgba(138,43,226,0.5)" />
                <circle cx="100" cy="100" r="8" fill="#8a2be2">
                  <animate attributeName="r" values="6;9;6" dur="2s" repeatCount="indefinite" />
                </circle>
              </g>
            ) : (
              <g>
                {/* Starter T-Shirt / Default Top */}
                <path d="M 78 75 Q 100 72 122 75 L 116 122 L 84 122 Z" fill="#4a5568" />
                <path d="M 78 75 L 65 90 L 72 95 L 82 82 Z" fill="#4a5568" />
                <path d="M 122 75 L 135 90 L 128 95 L 118 82 Z" fill="#4a5568" />
              </g>
            )}
          </g>

          {/* HAIR */}
          <g id="layer-hair">
            {hair.includes("CYBER") ? (
              <g fill="#00ffff">
                <polygon points="75,45 85,15 100,35 115,10 125,45 100,20" />
              </g>
            ) : hair.includes("SCHOLAR") ? (
              <path d="M 75 45 Q 100 20 125 45 L 120 25 Q 100 15 80 25 Z" fill="#4a3f35" />
            ) : hair.includes("WILD") ? (
              <path d="M 70 45 Q 85 10 100 25 Q 115 10 130 45 Q 140 20 100 5 Q 60 20 70 45 Z" fill="#c53030" />
            ) : hair.includes("SHORT") || hair.includes("STARTER") ? (
              <path d="M 75 45 Q 100 20 125 45 Q 125 35 100 25 Q 75 35 75 45 Z" fill="#2d3748" />
            ) : (
              <path d="M 75 45 Q 100 20 125 45 Q 125 35 100 25 Q 75 35 75 45 Z" fill="#2d3748" /> // Default
            )}
          </g>

          {/* HAT */}
          <g id="layer-hat">
            {hat.includes("CAP") ? (
              <g>
                <path d="M 80 35 Q 100 25 120 35 L 125 40 L 75 40 Z" fill="#e53e3e" />
                <path d="M 120 38 L 135 38 L 135 40 L 120 40 Z" fill="#e53e3e" />
              </g>
            ) : hat.includes("VISOR") || hat.includes("CYBER") ? (
              <g>
                <path d="M 78 40 Q 100 45 122 40 L 125 45 Q 100 52 75 45 Z" fill="#1a202c" stroke="#00ffff" strokeWidth="1" />
                <rect x="95" y="42" width="10" height="4" fill="#ff00ff" />
              </g>
            ) : hat.includes("WIZARD") || hat.includes("SCHOLAR") ? (
              <g>
                <polygon points="100,5 75,38 125,38" fill="#2b6cb0" />
                <path d="M 70 38 L 130 38 L 130 42 L 70 42 Z" fill="#2b6cb0" />
                <polygon points="100,15 95,25 105,25" fill="#ecc94b" />
              </g>
            ) : null}
          </g>

          {/* ACCESSORY */}
          <g id="layer-accessory">
            {accessory.includes("SWORD") && (
              <path d="M 115 110 L 155 70 L 160 75 L 120 115 Z" fill="#e2e8f0" stroke="#718096" strokeWidth="1" />
            )}
            {accessory.includes("SHIELD") && (
              <path d="M 55 90 Q 70 80 85 90 L 80 120 Q 70 130 60 120 Z" fill="#2d3748" stroke="#ffd700" strokeWidth="2" />
            )}
            {accessory.includes("BOOK") && (
              <rect x="50" y="90" width="20" height="25" fill="#8b4513" rx="2" />
            )}
          </g>

          {/* BADGE */}
          <g id="layer-badge">
            {badge && (
              <circle cx="112" cy="85" r="5" fill="#ecc94b" stroke="#b7791f" strokeWidth="1" />
            )}
          </g>
        </g>
      </svg>
    </div>
  );
}
