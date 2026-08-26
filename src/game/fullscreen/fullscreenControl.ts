const APP_ROOT_ID = 'app';
const EXIT_BUTTON_ID = 'fullscreen-exit';

/**
 * Requests fullscreen on the app root (the element wrapping the Phaser
 * canvas, the portrait rotate-overlay, and the exit-fullscreen button) so
 * all three keep working together while fullscreen is active. Must be
 * called synchronously from within a real user-gesture handler — fullscreen
 * requires live "transient activation", which does not survive an `await`
 * or a deferred callback.
 *
 * Feature-detected and best-effort: if the API is missing, disallowed (e.g.
 * `document.fullscreenEnabled` is false), or the returned promise rejects,
 * this silently does nothing and the game continues in normal browser
 * chrome. Never throws, never surfaces an error to the player.
 */
export const requestGameFullscreen = (): void => {
    const target = document.getElementById(APP_ROOT_ID);

    if (!target || !document.fullscreenEnabled || typeof target.requestFullscreen !== 'function') {
        return;
    }

    try {
        target.requestFullscreen()?.catch(() => {
            // Denied or failed in practice — continue in normal browser mode.
        });
    } catch {
        // Some engines throw synchronously instead of rejecting the promise.
    }
};

/**
 * Wires up the small exit-fullscreen button once at startup: shows it only
 * while `document.fullscreenElement` is set, and has it call
 * `document.exitFullscreen()` on tap. Listens to `fullscreenchange` so its
 * visibility stays correct even if the browser/OS exits fullscreen on its
 * own (e.g. the system back gesture), not just when our own button is used.
 */
export const attachFullscreenExitControl = (): void => {
    const button = document.getElementById(EXIT_BUTTON_ID);
    if (!button) {
        return;
    }

    const updateVisibility = () => {
        button.classList.toggle('is-visible', document.fullscreenElement != null);
    };

    button.addEventListener('click', () => {
        document.exitFullscreen?.().catch(() => {
            // Nothing sensible to do if the browser refuses — leave state as-is.
        });
    });

    document.addEventListener('fullscreenchange', updateVisibility);
    updateVisibility();
};
