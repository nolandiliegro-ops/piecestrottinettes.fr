import { useEffect, useRef } from "react";
import { motion, useSpring, useTransform, useMotionValue } from "framer-motion";

interface AnimatedNumberProps {
  value: number;
  suffix?: string;
  className?: string;
  duration?: number;
}

const AnimatedNumber = ({ 
  value, 
  suffix = "", 
  className = "",
  duration = 0.8 
}: AnimatedNumberProps) => {
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    damping: 30,
    stiffness: 100,
    duration: duration * 1000,
  });
  const displayValue = useTransform(springValue, (latest) => Math.round(latest));
  const nodeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    motionValue.set(value);
  }, [value, motionValue]);

  useEffect(() => {
    const unsubscribe = displayValue.on("change", (latest) => {
      if (nodeRef.current) {
        nodeRef.current.textContent = `${latest}${suffix}`;
      }
    });
    return () => unsubscribe();
  }, [displayValue, suffix]);

  return (
    <motion.span 
      ref={nodeRef} 
      className={className}
      initial={{ opacity: 0.5 }}
      animate={{ opacity: 1 }}
    >
      {value}{suffix}
    </motion.span>
  );
};

export default AnimatedNumber;
