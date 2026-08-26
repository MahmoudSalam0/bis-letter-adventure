import { GameObjects, Scene } from 'phaser';
import { unlockAudio } from '../audio/unlockAudio';
import { AssetKeys } from '../config/AssetKeys';
import { BisColors, GAME_CENTER_X, GAME_HEIGHT, GAME_WIDTH } from '../config/GameConfig';
import { SceneKeys } from '../config/SceneKeys';
import { letterB } from '../content/letters';
import { Mascot } from '../entities/Mascot';
import { GameState } from '../state/GameState';
import { fadeInScene, goToScene } from '../ui/SceneTransition';

const GROUND_Y = 565;
const MASCOT_X = 290;

const LETTER_UPPER_X = 555;
const LETTER_UPPER_Y = 245;
const LETTER_UPPER_HEIGHT = 235;
const LETTER_LOWER_X = 735;
const LETTER_LOWER_Y = 305;
const LETTER_LOWER_HEIGHT = 158;
const LETTER_HALO_X = 645;
const LETTER_HALO_Y = 275;

const SPARKLE_DISPLAY_SIZE = 34;

/**
 * The first real scene of the game: the illustrated welcome-bg artwork with
 * the mascot, hero letters and CTA laid out and animated on top of it in
 * Phaser. Every layer here (buildBackground / Mascot / buildLetters) is a
 * self-contained draw step, so any one of them can be swapped for updated
 * art later without touching the others.
 */
export class Welcome extends Scene {
    private hasLeft = false;
    private mascot!: Mascot;
    private upperLetter!: GameObjects.Image;
    private lowerLetter!: GameObjects.Image;

    constructor() {
        super(SceneKeys.Welcome);
    }

    create(): void {
        GameState.reset();
        GameState.setCurrentLetter(letterB.id);
        this.hasLeft = false;

        this.buildBackground();

        this.mascot = new Mascot(this, MASCOT_X, GROUND_Y);
        this.mascot.playIntro(150);

        this.buildLetters();
        this.buildInstruction();
        this.buildLetsPlayButton();

        // Let the mascot settle into pointing at the letters shortly after
        // both have finished their entrance (b settles at ~1400ms).
        this.time.delayedCall(1500, () => this.mascot.pointToLetters());

        fadeInScene(this);
    }

    // ----- Background ---------------------------------------------------

    private buildBackground(): void {
        const bg = this.add.image(GAME_CENTER_X, GAME_HEIGHT / 2, AssetKeys.Backgrounds.Welcome);

        // Cover-fit: scale to fill 1280x720 without distortion, cropping
        // only the sliver beyond whichever axis is already a perfect fit.
        const coverScale = Math.max(GAME_WIDTH / bg.width, GAME_HEIGHT / bg.height);
        bg.setScale(coverScale);
    }

    // ----- Letter introduction --------------------------------------------

    private buildLetters(): void {
        this.buildLetterHalo();

        this.upperLetter = this.add.image(LETTER_UPPER_X, LETTER_UPPER_Y, AssetKeys.Letters.BUpper).setOrigin(0.5);
        const upperScale = LETTER_UPPER_HEIGHT / this.upperLetter.height;
        this.upperLetter.setScale(0);

        this.lowerLetter = this.add.image(LETTER_LOWER_X, LETTER_LOWER_Y, AssetKeys.Letters.BLower).setOrigin(0.5);
        const lowerScale = LETTER_LOWER_HEIGHT / this.lowerLetter.height;
        this.lowerLetter.setScale(0);

        this.tweens.add({
            targets: this.upperLetter,
            scale: upperScale,
            duration: 600,
            delay: 550,
            ease: 'Back.easeOut',
            onComplete: () => {
                this.startLetterFloat(this.upperLetter, 0);
                this.burstSparkles([430, 155], [690, 160]);
            },
        });

        this.tweens.add({
            targets: this.lowerLetter,
            scale: lowerScale,
            duration: 550,
            delay: 850,
            ease: 'Back.easeOut',
            onComplete: () => {
                this.startLetterFloat(this.lowerLetter, 300);
                this.burstSparkles([815, 215], [560, 400]);
            },
        });
    }

    /** A soft layered halo (fake radial glow) that gives the letter pair a "reward" feel. */
    private buildLetterHalo(): void {
        const halo = this.add.graphics();
        halo.setPosition(LETTER_HALO_X, LETTER_HALO_Y);
        const rings: [number, number][] = [[140, 0.08], [110, 0.13], [80, 0.18]];
        for (const [radius, alpha] of rings) {
            halo.fillStyle(0xffffff, alpha);
            halo.fillCircle(0, 0, radius);
        }
    }

    private startLetterFloat(target: GameObjects.Image, delay: number): void {
        this.tweens.add({
            targets: target,
            y: target.y - 6,
            duration: 2600,
            delay,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
        });
    }

    // ----- Sparkle accents --------------------------------------------------

    /** A brief one-shot sparkle at each spot, settling into a slow ambient twinkle. */
    private burstSparkles(...spots: [number, number][]): void {
        for (const [x, y] of spots) {
            const sparkle = this.add.image(x, y, AssetKeys.Particles.Sparkle).setAlpha(0).setScale(0);
            const targetScale = SPARKLE_DISPLAY_SIZE / sparkle.width;

            this.tweens.add({
                targets: sparkle,
                alpha: 1,
                scale: targetScale,
                duration: 320,
                ease: 'Back.easeOut',
                onComplete: () => this.startSparkleAmbient(sparkle, targetScale),
            });
        }
    }

    private startSparkleAmbient(sparkle: GameObjects.Image, baseScale: number): void {
        this.tweens.add({
            targets: sparkle,
            alpha: { from: 0.4, to: 0.95 },
            scale: { from: baseScale * 0.85, to: baseScale * 1.15 },
            duration: 1400 + Math.random() * 600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
        });

        this.tweens.add({
            targets: sparkle,
            angle: 360,
            duration: 9000,
            repeat: -1,
            ease: 'Linear',
        });
    }

    // ----- Learning prompt --------------------------------------------------

    private buildInstruction(): void {
        const panel = this.add.graphics();
        panel.fillStyle(BisColors.navy, 0.82);
        panel.fillRoundedRect(GAME_CENTER_X - 220, 410, 440, 60, 30);
        panel.setAlpha(0);

        const text = this.add.text(GAME_CENTER_X, 440, `Meet the letter ${letterB.uppercase}!`, {
            fontFamily: 'Arial, sans-serif',
            fontSize: 27,
            color: '#fffdf5',
            fontStyle: 'bold',
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({
            targets: [panel, text],
            alpha: 1,
            y: '-=8',
            duration: 400,
            delay: 1250,
            ease: 'Sine.easeOut',
        });
    }

    // ----- Let's Play button ----------------------------------------------

    private buildLetsPlayButton(): void {
        const x = GAME_CENTER_X;
        const y = 610;

        const glow = this.add.graphics();
        glow.fillStyle(BisColors.yellow, 0.35);
        glow.fillRoundedRect(-200, -55, 400, 110, 55);
        glow.setPosition(x, y);
        glow.setScale(0);

        const bg = this.add.graphics();
        bg.fillStyle(BisColors.green, 1);
        bg.fillRoundedRect(-180, -45, 360, 90, 45);
        bg.lineStyle(6, 0xffffff, 0.9);
        bg.strokeRoundedRect(-180, -45, 360, 90, 45);

        const label = this.add.text(0, 0, "Let's Play!", {
            fontFamily: 'Arial, sans-serif',
            fontSize: 36,
            color: '#ffffff',
            fontStyle: 'bold',
        }).setOrigin(0.5);

        const button = this.add.container(x, y, [bg, label]);
        button.setSize(360, 90);
        button.setScale(0);

        this.tweens.add({
            targets: [button, glow],
            scale: 1,
            duration: 550,
            delay: 1650,
            ease: 'Back.easeOut',
            onComplete: () => {
                button.setInteractive({ useHandCursor: true });
                this.startButtonGlow(glow);

                button.on('pointerover', () => this.tweens.add({ targets: button, scale: 1.06, duration: 120 }));
                button.on('pointerout', () => this.tweens.add({ targets: button, scale: 1, duration: 120 }));
                button.on('pointerdown', () => this.tweens.add({ targets: button, scale: 0.94, duration: 80 }));
                button.on('pointerup', () => this.handleLetsPlay(button));
            },
        });
    }

    private startButtonGlow(glow: GameObjects.Graphics): void {
        this.tweens.add({
            targets: glow,
            alpha: { from: 0.3, to: 0.5 },
            scale: { from: 1, to: 1.05 },
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
        });
    }

    private handleLetsPlay(button: GameObjects.Container): void {
        if (this.hasLeft) {
            return;
        }
        this.hasLeft = true;

        button.disableInteractive();
        unlockAudio(this);

        goToScene(this, SceneKeys.BalloonPop);
    }
}
