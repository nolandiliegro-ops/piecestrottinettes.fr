// Avatar de SKOT — « Le pilote » (choisi par Nolan le 24/10/2026).
// Source : document projet claude/skot-avatar-pilote.svg. Dessin vectoriel original.
// Clin d'œil permanent ; la roue tourne quand `thinking` est vrai. Respecte « réduire les animations ».
const INNER = `<g opacity=".55" stroke="#1A1A1A" stroke-width="3" stroke-linecap="round"><line x1="2" y1="84" x2="18" y2="84"/><line x1="6" y1="94" x2="24" y2="94"/><line x1="0" y1="104" x2="14" y2="104"/></g><g transform="rotate(-7 60 70)">
  <polygon points="30,112 90,112 80,101 40,101" fill="#4A7C59" stroke="#1A1A1A" stroke-width="3" stroke-linejoin="round"/>
  <g class="skot-wheel"><rect x="51" y="92" width="18" height="24" rx="9" fill="#1A1A1A"/><rect x="57" y="97" width="6" height="14" rx="3" fill="#9AA096"/></g>
  <path d="M47 92 L52 72 M73 92 L68 72" stroke="#1A1A1A" stroke-width="4" stroke-linecap="round"/>
  <path d="M44 74 L44 26 Q44 16 54 16 L66 16 Q76 16 76 26 L76 74 Z" fill="#FAFAF8" stroke="#1A1A1A" stroke-width="3.5" stroke-linejoin="round"/>
  <rect x="50" y="10" width="20" height="8" rx="3" fill="#4A7C59" stroke="#1A1A1A" stroke-width="3"/>
  <rect x="45" y="17" width="30" height="10" rx="5" fill="#4A7C59" stroke="#1A1A1A" stroke-width="2.5"/><circle cx="53" cy="22" r="4" fill="#BFE3F2" stroke="#1A1A1A" stroke-width="2"/><circle cx="67" cy="22" r="4" fill="#BFE3F2" stroke="#1A1A1A" stroke-width="2"/>
   <g class="skot-eyes"><ellipse cx="53" cy="38" rx="6.5" ry="8" fill="#FFFFFF" stroke="#1A1A1A" stroke-width="2.5"/><ellipse cx="67" cy="38" rx="6.5" ry="8" fill="#FFFFFF" stroke="#1A1A1A" stroke-width="2.5"/>
   <circle cx="54.5" cy="39" r="3.8" fill="#1A1A1A"/><circle cx="68.5" cy="39" r="3.8" fill="#1A1A1A"/><circle cx="56" cy="37.3" r="1.3" fill="#FFFFFF"/><circle cx="70" cy="37.3" r="1.3" fill="#FFFFFF"/></g>
   <path d="M50 49 q10 9 20 0 z" fill="#1A1A1A"/><rect x="57.5" y="49" width="2.4" height="3.2" fill="#FFFFFF"/><rect x="60.6" y="49" width="2.4" height="3.2" fill="#FFFFFF"/>
  <path d="M8 50 C9 62 22 68 36 64 C46 61 54 58 60 61 C66 58 74 61 84 64 C98 68 111 62 112 50" fill="none" stroke="#1A1A1A" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M8 50 C9 62 22 68 36 64 C46 61 54 58 60 61 C66 58 74 61 84 64 C98 68 111 62 112 50" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity=".35"/>
  <rect x="2" y="38" width="11" height="15" rx="5.5" fill="#4A7C59" stroke="#1A1A1A" stroke-width="2.5" transform="rotate(-12 7 45)"/>
  <rect x="107" y="38" width="11" height="15" rx="5.5" fill="#4A7C59" stroke="#1A1A1A" stroke-width="2.5" transform="rotate(12 113 45)"/>
  </g>`;

const CSS = `.skot-av .skot-eyes{transform-box:fill-box;transform-origin:center;animation:skot-blink 4.5s infinite}
@keyframes skot-blink{0%,92%,100%{transform:scaleY(1)}95%{transform:scaleY(.1)}}
.skot-av .skot-wheel{transform-box:fill-box;transform-origin:center}
.skot-av.is-thinking .skot-wheel{animation:skot-spin .9s linear infinite}
@keyframes skot-spin{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){.skot-av .skot-eyes,.skot-av.is-thinking .skot-wheel{animation:none}}`;

let cssInjected = false;

const SkotAvatar = ({ size = 40, thinking = false, className = "" }: { size?: number; thinking?: boolean; className?: string }) => {
  if (!cssInjected && typeof document !== "undefined") {
    const el = document.createElement("style");
    el.textContent = CSS;
    document.head.appendChild(el);
    cssInjected = true;
  }
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      role="img"
      aria-label="SKOT"
      className={`skot-av ${thinking ? "is-thinking" : ""} ${className}`}
      dangerouslySetInnerHTML={{ __html: INNER }}
    />
  );
};

export default SkotAvatar;
