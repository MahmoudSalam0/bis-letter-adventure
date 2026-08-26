import { Game } from 'phaser';

// Mobile browser chrome (address bar / toolbar) can still be animating in or
// out when 'orientationchange'/'resize' first fires, so the very first
// automatic refresh can capture a transient, not-yet-settled size. These are
// cheap, idempotent follow-ups that re-run shortly after so Scale.FIT
// recalculates against the browser chrome's *final* state.
const SETTLE_DELAYS_MS = [300, 700];

/**
 * Phaser's ScaleManager already listens to the window's own 'resize' event
 * and recalculates FIT sizing automatically — see ScaleManager.refresh().
 * This adds the two things real mobile browsers need on top of that, kept
 * centralized here (called once from game/main.ts) rather than duplicated
 * per-Scene:
 *
 * 1. `visualViewport`'s own 'resize' event, which is the more reliable
 *    signal for the browser chrome showing/hiding (it can change without a
 *    full 'orientationchange', e.g. a scroll-triggered address bar collapse).
 * 2. A couple of delayed follow-up refreshes after an orientation change,
 *    since the settle time varies across Chrome/Samsung Internet/Safari.
 * 3. `fullscreenchange`, so entering/exiting fullscreen (which removes or
 *    restores the browser chrome) also triggers a recalculation, in case a
 *    browser doesn't reliably fire its own 'resize' on that transition.
 */
export const attachViewportRefresh = (game: Game): void => {
    const refresh = () => game.scale.refresh();

    const refreshWithSettle = () => {
        refresh();
        for (const delay of SETTLE_DELAYS_MS) {
            window.setTimeout(refresh, delay);
        }
    };

    window.addEventListener('orientationchange', refreshWithSettle);
    window.visualViewport?.addEventListener('resize', refreshWithSettle);
    document.addEventListener('fullscreenchange', refreshWithSettle);
};
