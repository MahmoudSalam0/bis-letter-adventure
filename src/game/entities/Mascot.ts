import { GameObjects, Scene, Tweens } from 'phaser';
import { AssetKeys } from '../config/AssetKeys';

const DISPLAY_HEIGHT = 300;

/**
 * The mascot, built from real illustrated art (mascot-wave.webp /
 * mascot-point.webp) instead of procedural Graphics. Both pose images are
 * loaded as siblings inside this Container, bottom-center anchored so they
 * share one ground point despite having different source aspect ratios;
 * `pointToLetters()` crossfades from the waving pose to the pointing one.
 *
 * Origin sits at the character's feet so it can be positioned directly on
 * a ground line. Everything external only ever sees this Container, so a
 * future animated sprite/spine swap needs no changes at any call site.
 */
export class Mascot extends GameObjects.Container {
    private readonly waveImage: GameObjects.Image;
    private readonly pointImage: GameObjects.Image;
    private idleTween?: Tweens.Tween;

    constructor(scene: Scene, x: number, y: number) {
        super(scene, x, y);
        scene.add.existing(this);

        const shadow = scene.add.graphics();
        shadow.fillStyle(0x0b2545, 0.16);
        shadow.fillEllipse(0, 6, 150, 26);
        this.add(shadow);

        this.waveImage = scene.add.image(0, 0, AssetKeys.Characters.MascotWave).setOrigin(0.5, 1);
        this.pointImage = scene.add.image(0, 0, AssetKeys.Characters.MascotPoint).setOrigin(0.5, 1).setAlpha(0);
        this.fitToHeight(this.waveImage);
        this.fitToHeight(this.pointImage);
        this.add([this.waveImage, this.pointImage]);

        this.setScale(0);
    }

    private fitToHeight(image: GameObjects.Image): void {
        image.setScale(DISPLAY_HEIGHT / image.height);
    }

    /** Pops the mascot in, then starts its idle breathing loop. */
    playIntro(delay = 0): void {
        this.scene.tweens.add({
            targets: this,
            scale: 1,
            duration: 550,
            delay,
            ease: 'Back.easeOut',
            onComplete: () => this.startIdle(),
        });
    }

    private startIdle(): void {
        this.idleTween = this.scene.tweens.add({
            targets: this,
            y: this.y - 8,
            scaleY: 1.025,
            duration: 1400,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
        });
    }

    /** Crossfades from the waving pose to the pointing-at-the-letters pose. */
    pointToLetters(duration = 450): void {
        this.scene.tweens.add({ targets: this.waveImage, alpha: 0, duration, ease: 'Sine.easeInOut' });
        this.scene.tweens.add({ targets: this.pointImage, alpha: 1, duration, ease: 'Sine.easeInOut' });
    }

    destroy(fromScene?: boolean): void {
        this.idleTween?.stop();
        super.destroy(fromScene);
    }
}
