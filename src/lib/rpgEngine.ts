export const XP_BASE = 100;
export const XP_EXPONENT = 1.5;

/**
 * Calculates the total XP required to reach a specific level.
 */
export function calculateXpForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.floor(XP_BASE * Math.pow(level, XP_EXPONENT));
}

/**
 * Given a total amount of XP, calculates the current level.
 */
export function calculateLevelFromXp(totalXp: number): number {
  if (totalXp <= 0) return 1;
  const level = Math.floor(Math.pow(totalXp / XP_BASE, 1 / XP_EXPONENT));
  return Math.max(1, level);
}

/**
 * Calculates progress towards the next level (0.0 to 1.0).
 */
export function calculateLevelProgress(totalXp: number): {
  currentLevel: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progressPercent: number;
} {
  const currentLevel = calculateLevelFromXp(totalXp);
  const currentLevelTotalXpRequired = calculateXpForLevel(currentLevel);
  const nextLevelTotalXpRequired = calculateXpForLevel(currentLevel + 1);

  const xpIntoCurrentLevel = totalXp - currentLevelTotalXpRequired;
  const xpNeededForNextLevel = nextLevelTotalXpRequired - currentLevelTotalXpRequired;
  
  const progressPercent = Math.min(100, Math.max(0, (xpIntoCurrentLevel / xpNeededForNextLevel) * 100));

  return {
    currentLevel,
    currentLevelXp: xpIntoCurrentLevel,
    nextLevelXp: xpNeededForNextLevel,
    progressPercent
  };
}
