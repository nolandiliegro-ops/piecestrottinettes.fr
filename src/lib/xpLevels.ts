// Centralized XP Level System
// Provides consistent level calculations across the app

import { Wrench, Cog, Gauge, Trophy, type LucideIcon } from "lucide-react";

export interface XPLevel {
  level: number;
  name: string;
  shortName: string;
  minXP: number;
  maxXP: number;
  color: string;
  bgColor: string;
  icon: string;
  progressColor: string;
  glowColor: string;
  LucideIcon: LucideIcon;
}

const XP_LEVELS: XPLevel[] = [
  {
    level: 1,
    name: "Apprenti",
    shortName: "APP",
    minXP: 0,
    maxXP: 500,
    color: "text-slate-500",
    bgColor: "bg-slate-500/10",
    icon: "🔧",
    progressColor: "bg-slate-500",
    glowColor: "rgba(100, 116, 139, 0.6)",
    LucideIcon: Wrench,
  },
  {
    level: 2,
    name: "Mécano",
    shortName: "MÉC",
    minXP: 501,
    maxXP: 1500,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    icon: "⚙️",
    progressColor: "bg-blue-500",
    glowColor: "rgba(59, 130, 246, 0.6)",
    LucideIcon: Cog,
  },
  {
    level: 3,
    name: "Expert",
    shortName: "EXP",
    minXP: 1501,
    maxXP: 3000,
    color: "text-mineral",
    bgColor: "bg-mineral/10",
    icon: "🛠️",
    progressColor: "bg-emerald-500",
    glowColor: "rgba(16, 185, 129, 0.6)",
    LucideIcon: Gauge,
  },
  {
    level: 4,
    name: "Légende",
    shortName: "LÉG",
    minXP: 3001,
    maxXP: Infinity,
    color: "text-amber-500",
    bgColor: "bg-gradient-to-r from-amber-500/10 to-yellow-400/10",
    icon: "🏆",
    progressColor: "bg-gradient-to-r from-amber-500 to-yellow-400",
    glowColor: "rgba(245, 158, 11, 0.6)",
    LucideIcon: Trophy,
  },
];

/**
 * Get the XP level for a given number of points
 */
export const getXPLevel = (points: number): XPLevel => {
  // Find the level where points fall within the range
  for (let i = XP_LEVELS.length - 1; i >= 0; i--) {
    if (points >= XP_LEVELS[i].minXP) {
      return XP_LEVELS[i];
    }
  }
  return XP_LEVELS[0]; // Default to first level
};

/**
 * Get progress information towards the next level
 */
export const getProgressToNextLevel = (points: number): {
  percentage: number;
  pointsToNext: number;
  pointsInCurrentLevel: number;
  currentLevel: XPLevel;
  nextLevel: XPLevel | null;
} => {
  const currentLevel = getXPLevel(points);
  const currentLevelIndex = XP_LEVELS.findIndex(l => l.level === currentLevel.level);
  const nextLevel = currentLevelIndex < XP_LEVELS.length - 1 
    ? XP_LEVELS[currentLevelIndex + 1] 
    : null;

  // If at max level, return 100%
  if (!nextLevel) {
    return {
      percentage: 100,
      pointsToNext: 0,
      pointsInCurrentLevel: points - currentLevel.minXP,
      currentLevel,
      nextLevel: null,
    };
  }

  // Calculate progress within current level
  const levelRange = nextLevel.minXP - currentLevel.minXP;
  const pointsInLevel = points - currentLevel.minXP;
  const percentage = Math.min(Math.round((pointsInLevel / levelRange) * 100), 100);
  const pointsToNext = nextLevel.minXP - points;

  return {
    percentage,
    pointsToNext,
    pointsInCurrentLevel: pointsInLevel,
    currentLevel,
    nextLevel,
  };
};

/**
 * Get all XP levels for display purposes
 */
export const getAllLevels = (): XPLevel[] => XP_LEVELS;