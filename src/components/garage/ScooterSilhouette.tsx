interface ScooterSilhouetteProps {
  color?: string;
  className?: string;
}

/** Silhouette générique — utilisée quand aucune photo n'est disponible. */
const ScooterSilhouette = ({ color = "rgba(255,255,255,.95)", className }: ScooterSilhouetteProps) => (
  <svg viewBox="0 0 200 140" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="45" cy="112" r="20" fill="none" stroke={color} strokeWidth="7" />
    <circle cx="158" cy="112" r="20" fill="none" stroke={color} strokeWidth="7" />
    <path d="M45 112 L150 108" stroke={color} strokeWidth="9" strokeLinecap="round" />
    <path d="M150 108 L150 30" stroke={color} strokeWidth="8" strokeLinecap="round" />
    <path d="M150 30 L120 22" stroke={color} strokeWidth="8" strokeLinecap="round" />
    <path d="M150 108 L158 112" stroke={color} strokeWidth="8" strokeLinecap="round" />
    <rect x="40" y="98" width="72" height="10" rx="5" fill={color} />
  </svg>
);

export default ScooterSilhouette;
