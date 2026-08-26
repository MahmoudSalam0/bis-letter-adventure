/**
 * Centralized audio mix levels — the single source of truth for every sound
 * key's volume, so Welcome/BalloonPop/backgroundMusic all pull from the same
 * numbers instead of keeping their own local copies.
 *
 * Tuned from real-device listening feedback at ~50% phone system volume.
 * Narrator is the top priority and must stay clearly intelligible; music is
 * audible but always below it; pop/button/retry are satisfying but no
 * longer louder than the things that matter more.
 */
export const AudioVolumes = {
    narrator: 1.0,
    musicNormal: 0.30,
    musicDucked: 0.14,
    buttonTap: 0.25,
    balloonPop: 0.30,
    correctChime: 0.45,
    tryAgain: 0.35,
    celebration: 0.45,
} as const;
