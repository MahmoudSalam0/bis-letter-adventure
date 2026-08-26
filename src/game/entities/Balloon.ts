import { GameObjects, Scene } from 'phaser';
import { AssetKeys } from '../config/AssetKeys';

export type BalloonLetter = 'B' | 'D' | 'P' | 'A';

/** Display width of the balloon body, in local/container pixels — every skin is scaled to match this regardless of its source canvas size. */
const TARGET_BODY_WIDTH = 122;

/**
 * Real rectangular touch zone size. Generous on purpose (well beyond the
 * ~122x~130 visible body) so center/top/bottom/left/right all register
 * reliably without needing to be pixel-precise, while staying well short of
 * the string below the body.
 */
const ZONE_WIDTH = 180;
const ZONE_HEIGHT = 190;

/**
 * Dev-only: draws the interactive Zone's bounds so alignment against the
 * rendered balloon can be checked by eye. Must stay false in shipped code.
 */
const DEBUG_HIT_AREAS = false;

/**
 * The real balloon art (public/assets/balloons/*.webp) ships with generous,
 * inconsistent transparent padding and a trailing curly string — canvases
 * range from square to a tall portrait crop. Each entry here calibrates one
 * skin's actual round body as fractions of its own texture size (measured
 * directly from the source art), so every balloon can be scaled to the same
 * on-screen body size and centered under the letter label.
 */
interface BalloonSkin {
    key: string;
    /** Visible body diameter as a fraction of texture width. */
    widthFrac: number;
    /** Visible body diameter as a fraction of texture height. */
    heightFrac: number;
    /** Vertical position of the body's center as a fraction of texture height. */
    centerYFrac: number;
}

const BALLOON_SKINS: BalloonSkin[] = [
    { key: AssetKeys.Balloons.Blue, widthFrac: 0.656, heightFrac: 0.713, centerYFrac: 0.376 },
    { key: AssetKeys.Balloons.Green, widthFrac: 0.611, heightFrac: 0.684, centerYFrac: 0.360 },
    { key: AssetKeys.Balloons.Yellow, widthFrac: 0.877, heightFrac: 0.647, centerYFrac: 0.355 },
    { key: AssetKeys.Balloons.Coral, widthFrac: 0.902, heightFrac: 0.640, centerYFrac: 0.340 },
    { key: AssetKeys.Balloons.Purple, widthFrac: 0.875, heightFrac: 0.635, centerYFrac: 0.343 },
];

const randomSkin = (): BalloonSkin => BALLOON_SKINS[Math.floor(Math.random() * BALLOON_SKINS.length)];

/**
 * A single floating balloon: the real balloon artwork plus a text label,
 * grouped in a Container, with a dedicated `Phaser.GameObjects.Zone` child
 * as the *sole* interactive object.
 *
 * Why a Zone and not the Container itself: making the Container interactive
 * with a custom Geom shape (tried twice before) is fundamentally broken here.
 * `Container.displayOriginX/Y` are hardcoded by Phaser to `width/height * 0.5`
 * (derived from `setSize()`), and Phaser's hit-test (`pointWithinHitArea`)
 * *unconditionally* adds `displayOriginX/Y` to the incoming point before
 * testing it against any hit shape — custom or not. A Circle/Ellipse placed
 * at local (0,0) to match the body center was therefore always being tested
 * tens of pixels away from where it was actually drawn, which is exactly why
 * "upper" taps could register while the true center did not. A Zone sized
 * via its constructor and given a plain `setInteractive()` (no custom shape)
 * lets Phaser auto-generate its own coordinate-matched Rectangle hit area
 * instead, which is the well-tested default path this offset math is
 * designed for.
 */
export class Balloon extends GameObjects.Container {
    readonly letter: BalloonLetter;
    readonly isTarget: boolean;

    private readonly interactiveZone: GameObjects.Zone;

    private interactionEnabled = true;
    private isPopped = false;
    private isLocked = false;

    constructor(scene: Scene, x: number, y: number, letter: BalloonLetter) {
        super(scene, x, y);
        this.letter = letter;
        this.isTarget = letter === 'B';
        scene.add.existing(this);

        const skin = randomSkin();
        const balloonImage = scene.add.image(0, 0, skin.key);
        const scale = TARGET_BODY_WIDTH / (skin.widthFrac * balloonImage.width);
        balloonImage.setScale(scale);
        // Anchor the image on the body's true visual center (not the padded
        // frame's center) so it lands exactly on this container's origin,
        // i.e. local (0, 0) — verified by construction, not assumed.
        balloonImage.setOrigin(0.5, skin.centerYFrac);

        const bodyHalfWidth = TARGET_BODY_WIDTH / 2;
        const bodyHalfHeight = (skin.heightFrac * balloonImage.height * scale) / 2;

        const shadow = scene.add.graphics();
        shadow.fillStyle(0x0b2545, 0.16);
        shadow.fillEllipse(4, bodyHalfHeight + 8, bodyHalfWidth * 1.1, 15);

        const label = scene.add.text(0, 0, letter, {
            fontFamily: 'Arial, sans-serif',
            fontSize: 58,
            color: '#0b2545',
            fontStyle: 'bold',
        }).setOrigin(0.5);
        label.setStroke('#ffffff', 3);

        this.add([shadow, balloonImage, label]);

        // The interactive Zone: centered on the same local (0, 0) body
        // center, sized generously, interactive via Phaser's own default
        // (non-custom) hit area — no Geom math of ours involved at all.
        this.interactiveZone = new GameObjects.Zone(scene, 0, 0, ZONE_WIDTH, ZONE_HEIGHT);
        this.interactiveZone.setInteractive({ useHandCursor: true });
        this.interactiveZone.on('pointerdown', () => this.emit('tapped'));
        this.add(this.interactiveZone);

        if (DEBUG_HIT_AREAS) {
            const debugOutline = scene.add.graphics();
            debugOutline.fillStyle(0x00ff00, 0.12);
            debugOutline.fillRect(-ZONE_WIDTH / 2, -ZONE_HEIGHT / 2, ZONE_WIDTH, ZONE_HEIGHT);
            debugOutline.lineStyle(2, 0x00ff00, 0.9);
            debugOutline.strokeRect(-ZONE_WIDTH / 2, -ZONE_HEIGHT / 2, ZONE_WIDTH, ZONE_HEIGHT);
            this.add(debugOutline);
        }

        this.setSize(bodyHalfWidth * 2, bodyHalfHeight * 2);
    }

    canBeTapped(): boolean {
        return this.interactionEnabled && !this.isPopped && !this.isLocked;
    }

    /** Rises linearly to exitY; calls onExit if it reaches the top unpopped. */
    startRising(exitY: number, duration: number, onExit: () => void): void {
        this.scene.tweens.add({
            targets: this,
            y: exitY,
            duration,
            ease: 'Linear',
            onComplete: () => {
                if (!this.isPopped) {
                    onExit();
                }
            },
        });
    }

    /** Gentle sideways drift plus a subtle breathing scale, both looping. */
    startDrift(): void {
        const amplitude = 14 + Math.random() * 18;
        const duration = 1300 + Math.random() * 900;

        this.scene.tweens.add({
            targets: this,
            x: this.x + amplitude,
            duration,
            delay: Math.random() * 400,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
        });

        this.scene.tweens.add({
            targets: this,
            scaleX: 1.03,
            scaleY: 0.97,
            duration: 1600 + Math.random() * 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
        });
    }

    /** Satisfying pop: quick punch, then shrink/fade away and self-destroy. */
    playPop(): void {
        if (this.isPopped) {
            return;
        }
        this.isPopped = true;
        this.disableInteraction();
        this.scene.tweens.killTweensOf(this);
        this.setScale(1);

        this.scene.tweens.add({
            targets: this,
            scale: 1.24,
            duration: 90,
            ease: 'Sine.easeOut',
            onComplete: () => {
                this.scene.tweens.add({
                    targets: this,
                    scale: 0,
                    alpha: 0,
                    duration: 170,
                    ease: 'Back.easeIn',
                    onComplete: () => this.destroySafely(),
                });
            },
        });
    }

    /** Friendly wobble for a wrong tap. Locks briefly so rapid taps can't spam it. */
    playIncorrect(): void {
        if (this.isLocked || this.isPopped) {
            return;
        }
        this.isLocked = true;

        this.scene.tweens.add({
            targets: this,
            angle: { from: -7, to: 7 },
            duration: 60,
            yoyo: true,
            repeat: 4,
            ease: 'Sine.easeInOut',
            onComplete: () => {
                this.angle = 0;
                this.isLocked = false;
            },
        });
    }

    /** Graceful exit once the round is complete: float up and fade rather than vanish. */
    floatAway(): void {
        if (this.isPopped) {
            return;
        }
        this.isPopped = true;
        this.disableInteraction();
        this.scene.tweens.killTweensOf(this);

        this.scene.tweens.add({
            targets: this,
            y: this.y - (200 + Math.random() * 120),
            alpha: 0,
            duration: 900 + Math.random() * 400,
            ease: 'Sine.easeIn',
            onComplete: () => this.destroySafely(),
        });
    }

    disableInteraction(): void {
        this.interactionEnabled = false;
        this.interactiveZone.disableInteractive();
    }

    destroySafely(): void {
        this.scene.tweens.killTweensOf(this);
        this.destroy();
    }
}
