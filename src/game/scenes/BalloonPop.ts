import { GameObjects, Scene } from 'phaser';
import { AudioVolumes } from '../audio/audioVolumes';
import { duckMusicFor, restoreMusicVolumeImmediately } from '../audio/backgroundMusic';
import { AssetKeys } from '../config/AssetKeys';
import { BisColors, GAME_CENTER_X, GAME_CENTER_Y, GAME_HEIGHT, GAME_WIDTH } from '../config/GameConfig';
import { SceneKeys } from '../config/SceneKeys';
import { Balloon, BalloonLetter } from '../entities/Balloon';
import { Mascot } from '../entities/Mascot';
import { GameState } from '../state/GameState';
import { fadeInScene, goToScene } from '../ui/SceneTransition';
import { createButton, createRoundedPanel } from '../ui/UiHelpers';

const TARGET_CORRECT = 6;
const MAX_ACTIVE_BALLOONS = 5;

const LANE_COUNT = 5;
const LANE_MARGIN = 150;
const LANE_COOLDOWN = 2200;

const SPAWN_INTERVAL_MIN = 900;
const SPAWN_INTERVAL_MAX = 1500;
const RISE_DURATION_MIN = 8500;
const RISE_DURATION_MAX = 11500;

const SPAWN_Y = GAME_HEIGHT + 100;
const EXIT_Y = -120;
const PLAY_START_DELAY = 1300;

const INTRO_NARRATION_DELAY = 150;
const CORRECT_CHIME_DELAY_SEC = 0.1;
const CELEBRATION_NARRATION_DELAY = 450;

// Duck windows are approximate (measured clip length + a little buffer)
// rather than read from the decoded sound, since being off by a couple
// hundred ms on a volume duck is inaudible — unlike Welcome's transition
// timing, nothing here depends on hitting the exact narration end.
const POP_NARRATION_DUCK_MS = 1900;
const CELEBRATION_DUCK_MS = CELEBRATION_NARRATION_DELAY + 4000;

// Every sound BalloonPop might have started, stopped on shutdown so nothing
// leaks into Welcome or lingers/doubles up across a replay.
const SCENE_AUDIO_KEYS = [
    AssetKeys.Audio.Sfx.ButtonTap,
    AssetKeys.Audio.Narrator.PopLetterB,
    AssetKeys.Audio.Sfx.BalloonPop,
    AssetKeys.Audio.Sfx.CorrectChime,
    AssetKeys.Audio.Sfx.TryAgain,
    AssetKeys.Audio.Sfx.Celebration,
    AssetKeys.Audio.Narrator.GreatJobB,
];

// Two B's in every five draws — frequent enough that the round always
// finishes, without letting B dominate so hard it stops being a challenge.
const LETTER_POOL: BalloonLetter[] = ['B', 'B', 'D', 'P', 'A'];

const shuffle = <T,>(items: T[]): T[] => {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
};

const randomBetween = (min: number, max: number): number => min + Math.random() * (max - min);

interface StarSlot {
    x: number;
    y: number;
    star: GameObjects.Image;
    targetScale: number;
}

type Phase = 'intro' | 'playing' | 'complete';

/**
 * The first complete mini-game: balloons carrying B/D/P/A rise through the
 * play area and the child taps the B ones. Intro / playing / complete are
 * kept as phases of this one scene rather than separate scenes, per the
 * current single-round proof-of-concept scope.
 *
 * Phaser reuses this Scene instance across "Play Again" restarts, so every
 * piece of state is reset at the top of create() and handleShutdown() tears
 * down timers/tweens/balloons left over from the previous round.
 */
export class BalloonPop extends Scene {
    private phase: Phase = 'intro';
    private activeBalloons: Balloon[] = [];
    private letterBag: BalloonLetter[] = [];
    private laneXs: number[] = [];
    private laneAvailableAt: number[] = [];
    private correctCount = 0;
    private starSlots: StarSlot[] = [];
    private completionButtons: GameObjects.Container[] = [];
    private gameplayHud!: GameObjects.Container;
    private targetIndicator?: GameObjects.Container;
    private mascot?: Mascot;
    private isLeaving = false;

    constructor() {
        super(SceneKeys.BalloonPop);
    }

    create(): void {
        GameState.reset();

        this.phase = 'intro';
        this.activeBalloons = [];
        this.letterBag = [];
        this.correctCount = 0;
        this.starSlots = [];
        this.completionButtons = [];
        this.isLeaving = false;

        this.laneXs = this.computeLaneXs();
        this.laneAvailableAt = new Array(LANE_COUNT).fill(0);

        this.buildBackground();

        this.gameplayHud = this.add.container(0, 0);
        this.gameplayHud.setDepth(20);
        this.buildStarPanelBacking();
        this.buildProgressStars();
        this.buildTargetIndicator();

        this.buildIntroMascot();

        this.events.once('shutdown', this.handleShutdown, this);

        fadeInScene(this);
        this.time.delayedCall(INTRO_NARRATION_DELAY, () => {
            this.sound.play(AssetKeys.Audio.Narrator.PopLetterB, { volume: AudioVolumes.narrator });
            duckMusicFor(this, POP_NARRATION_DUCK_MS);
        });
        this.time.delayedCall(PLAY_START_DELAY, () => this.beginPlaying());
    }

    private computeLaneXs(): number[] {
        const usable = GAME_WIDTH - LANE_MARGIN * 2;
        return Array.from({ length: LANE_COUNT }, (_, i) => LANE_MARGIN + (usable / (LANE_COUNT - 1)) * i);
    }

    // ----- Background / HUD ------------------------------------------------

    private buildBackground(): void {
        const bg = this.add.image(GAME_CENTER_X, GAME_HEIGHT / 2, AssetKeys.Backgrounds.Welcome);
        const coverScale = Math.max(GAME_WIDTH / bg.width, GAME_HEIGHT / bg.height);
        bg.setScale(coverScale);

        // Soft veil keeps bright balloons/letters readable against the illustration.
        const veil = this.add.graphics();
        veil.fillStyle(BisColors.navy, 0.16);
        veil.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }

    private buildTargetIndicator(): void {
        const panel = createRoundedPanel(this, 0, 0, 300, 92, BisColors.navy, 0.85, 24);

        const bIcon = this.add.image(-108, 0, AssetKeys.Letters.BUpper).setOrigin(0.5);
        bIcon.setScale(60 / bIcon.height);

        const text = this.add.text(30, 0, 'Pop B!', {
            fontFamily: 'Arial, sans-serif',
            fontSize: 32,
            color: '#ffffff',
            fontStyle: 'bold',
        }).setOrigin(0.5);

        const container = this.add.container(168, 64, [panel, bIcon, text]);
        container.setScale(0);
        this.targetIndicator = container;
        this.gameplayHud.add(container);

        this.tweens.add({
            targets: container,
            scale: 1,
            duration: 450,
            delay: 150,
            ease: 'Back.easeOut',
        });
    }

    /** A compact, semi-transparent backing strip so the six stars stay legible over the illustrated sky/clouds. */
    private buildStarPanelBacking(): void {
        const spacing = 58;
        const rightX = GAME_WIDTH - 56;
        const panelWidth = spacing * (TARGET_CORRECT - 1) + 80;
        const panelX = rightX - (spacing * (TARGET_CORRECT - 1)) / 2;

        const panel = createRoundedPanel(this, panelX, 60, panelWidth, 72, BisColors.navy, 0.42, 30);
        panel.setAlpha(0);
        this.gameplayHud.add(panel);

        this.tweens.add({
            targets: panel,
            alpha: 1,
            duration: 400,
            delay: 150,
            ease: 'Sine.easeOut',
        });
    }

    private buildProgressStars(): void {
        const spacing = 58;
        const rightX = GAME_WIDTH - 56;
        const y = 60;

        for (let i = 0; i < TARGET_CORRECT; i++) {
            const x = rightX - spacing * (TARGET_CORRECT - 1 - i);

            const outline = this.add.circle(x, y, 24);
            outline.setStrokeStyle(3, 0xffffff, 0.55);
            outline.setFillStyle(0x0b2545, 0.25);

            const star = this.add.image(x, y, AssetKeys.UI.RewardStar).setOrigin(0.5);
            const targetScale = 48 / star.width;
            star.setScale(0);
            star.setAlpha(0);

            this.gameplayHud.add([outline, star]);
            this.starSlots.push({ x, y, star, targetScale });
        }
    }

    private fillNextStar(): void {
        const slot = this.starSlots[this.correctCount - 1];
        if (!slot) {
            return;
        }

        this.tweens.add({
            targets: slot.star,
            scale: slot.targetScale,
            alpha: 1,
            duration: 380,
            ease: 'Back.easeOut',
        });

        this.spawnSparkleBurst(slot.x, slot.y, 5);
    }

    private pulseTargetIndicator(): void {
        const indicator = this.targetIndicator;
        if (!indicator || this.tweens.isTweening(indicator)) {
            return;
        }
        this.tweens.add({
            targets: indicator,
            scale: 1.12,
            duration: 140,
            yoyo: true,
            ease: 'Sine.easeInOut',
        });
    }

    // ----- Mascot cameo ------------------------------------------------------

    private buildIntroMascot(): void {
        const mascot = new Mascot(this, 100, GAME_HEIGHT - 24);
        this.mascot = mascot;

        this.tweens.add({
            targets: mascot,
            scale: 0.42,
            duration: 500,
            delay: 150,
            ease: 'Back.easeOut',
        });
    }

    private fadeOutMascot(): void {
        if (!this.mascot) {
            return;
        }
        this.tweens.add({
            targets: this.mascot,
            alpha: 0,
            scale: 0.28,
            duration: 400,
            ease: 'Sine.easeIn',
        });
    }

    private celebrateMascot(): void {
        const mascot = this.mascot;
        if (!mascot) {
            return;
        }
        // Placed clear of the completion panel's left edge (x >= 260) so it
        // never renders half-hidden behind the modal.
        mascot.setPosition(135, 480);
        mascot.setAlpha(1);
        mascot.setDepth(31);

        this.tweens.add({
            targets: mascot,
            scale: 0.6,
            duration: 450,
            ease: 'Back.easeOut',
            onComplete: () => {
                this.tweens.add({
                    targets: mascot,
                    y: mascot.y - 18,
                    duration: 260,
                    yoyo: true,
                    repeat: 2,
                    ease: 'Sine.easeOut',
                });
            },
        });
    }

    // ----- Spawning ------------------------------------------------------

    private beginPlaying(): void {
        this.phase = 'playing';
        this.fadeOutMascot();

        this.trySpawnBalloon();
        this.trySpawnBalloon();
        this.scheduleNextSpawn();
    }

    private scheduleNextSpawn(): void {
        if (this.phase !== 'playing') {
            return;
        }
        const delay = randomBetween(SPAWN_INTERVAL_MIN, SPAWN_INTERVAL_MAX);
        this.time.delayedCall(delay, () => {
            this.trySpawnBalloon();
            this.scheduleNextSpawn();
        });
    }

    private drawNextLetter(): BalloonLetter {
        if (this.letterBag.length === 0) {
            this.letterBag = shuffle(LETTER_POOL);
        }
        return this.letterBag.pop() as BalloonLetter;
    }

    private trySpawnBalloon(): void {
        if (this.phase !== 'playing' || this.activeBalloons.length >= MAX_ACTIVE_BALLOONS) {
            return;
        }

        const now = this.time.now;
        const availableLanes: number[] = [];
        for (let i = 0; i < this.laneAvailableAt.length; i++) {
            if (now >= this.laneAvailableAt[i]) {
                availableLanes.push(i);
            }
        }
        if (availableLanes.length === 0) {
            return;
        }

        const laneIndex = availableLanes[Math.floor(Math.random() * availableLanes.length)];
        this.laneAvailableAt[laneIndex] = now + LANE_COOLDOWN;

        const letter = this.drawNextLetter();
        const balloon = new Balloon(this, this.laneXs[laneIndex], SPAWN_Y, letter);
        balloon.on('tapped', () => this.handleBalloonTapped(balloon));

        const duration = randomBetween(RISE_DURATION_MIN, RISE_DURATION_MAX);
        balloon.startRising(EXIT_Y, duration, () => {
            this.removeActiveBalloon(balloon);
            balloon.destroySafely();
        });
        balloon.startDrift();

        this.activeBalloons.push(balloon);
    }

    private removeActiveBalloon(balloon: Balloon): void {
        const index = this.activeBalloons.indexOf(balloon);
        if (index !== -1) {
            this.activeBalloons.splice(index, 1);
        }
    }

    // ----- Tap handling ------------------------------------------------------

    private handleBalloonTapped(balloon: Balloon): void {
        if (this.phase !== 'playing' || !balloon.canBeTapped()) {
            return;
        }

        if (balloon.isTarget) {
            this.handleCorrectTap(balloon);
        } else {
            this.handleIncorrectTap(balloon);
        }
    }

    private handleCorrectTap(balloon: Balloon): void {
        this.removeActiveBalloon(balloon);
        GameState.registerCorrect();
        this.correctCount += 1;

        this.sound.play(AssetKeys.Audio.Sfx.BalloonPop, { volume: AudioVolumes.balloonPop });
        this.sound.play(AssetKeys.Audio.Sfx.CorrectChime, { volume: AudioVolumes.correctChime, delay: CORRECT_CHIME_DELAY_SEC });

        this.spawnSparkleBurst(balloon.x, balloon.y);
        balloon.playPop();
        this.fillNextStar();

        if (this.correctCount >= TARGET_CORRECT) {
            this.beginCompletion();
        }
    }

    private handleIncorrectTap(balloon: Balloon): void {
        GameState.registerMistake();
        this.sound.play(AssetKeys.Audio.Sfx.TryAgain, { volume: AudioVolumes.tryAgain });
        balloon.playIncorrect();
        this.pulseTargetIndicator();
    }

    // ----- Sparkles ------------------------------------------------------

    private spawnSparkleBurst(x: number, y: number, count = 6): void {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 18 + Math.random() * 30;
            const sparkle = this.add.image(x, y, AssetKeys.Particles.Sparkle).setAlpha(0.9).setScale(0);
            const targetScale = (26 + Math.random() * 14) / sparkle.width;

            this.tweens.add({
                targets: sparkle,
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance,
                scale: targetScale,
                alpha: 0,
                duration: 380 + Math.random() * 200,
                ease: 'Cubic.easeOut',
                onComplete: () => sparkle.destroy(),
            });
        }
    }

    // ----- Completion ------------------------------------------------------

    private beginCompletion(): void {
        this.phase = 'complete';
        this.time.removeAllEvents();

        // Clear the gameplay HUD so it doesn't ghost through the translucent
        // celebration veil behind the modal.
        this.tweens.add({ targets: this.gameplayHud, alpha: 0, duration: 300, ease: 'Sine.easeIn' });

        for (const balloon of this.activeBalloons) {
            balloon.floatAway();
        }
        this.activeBalloons = [];

        this.time.delayedCall(700, () => this.showCelebration());
    }

    private showCelebration(): void {
        GameState.completeSegment();
        this.celebrateMascot();
        this.buildCompletionOverlay();

        this.sound.play(AssetKeys.Audio.Sfx.Celebration, { volume: AudioVolumes.celebration });
        // One duck covering celebration.mp3 through great-job-b, rather than
        // two separate duck/restore calls racing on the same volume tween.
        duckMusicFor(this, CELEBRATION_DUCK_MS);

        this.time.delayedCall(CELEBRATION_NARRATION_DELAY, () => {
            this.sound.play(AssetKeys.Audio.Narrator.GreatJobB, { volume: AudioVolumes.narrator });
        });
    }

    private buildCompletionOverlay(): void {
        const veil = this.add.graphics();
        veil.fillStyle(BisColors.navy, 0.55);
        veil.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        veil.setAlpha(0);
        veil.setDepth(30);

        const panel = createRoundedPanel(this, GAME_CENTER_X, GAME_CENTER_Y - 10, 760, 460, BisColors.navy, 0.95, 32);
        panel.setAlpha(0);
        panel.setDepth(30);

        const bigStar = this.add.image(GAME_CENTER_X, GAME_CENTER_Y - 170, AssetKeys.UI.RewardStar).setScale(0);
        const bigStarScale = 130 / bigStar.width;
        bigStar.setDepth(31);

        const titleText = this.add.text(GAME_CENTER_X, GAME_CENTER_Y - 60, 'Great job!', {
            fontFamily: 'Arial, sans-serif',
            fontSize: 54,
            color: '#ffffff',
            fontStyle: 'bold',
        }).setOrigin(0.5).setAlpha(0).setDepth(31);

        const subtitleText = this.add.text(GAME_CENTER_X, GAME_CENTER_Y - 8, 'You found B!', {
            fontFamily: 'Arial, sans-serif',
            fontSize: 32,
            color: '#ffe08a',
            fontStyle: 'bold',
        }).setOrigin(0.5).setAlpha(0).setDepth(31);

        this.tweens.add({ targets: [veil, panel], alpha: 1, duration: 350 });
        this.tweens.add({
            targets: bigStar,
            scale: bigStarScale,
            duration: 500,
            delay: 150,
            ease: 'Back.easeOut',
            onComplete: () => {
                this.spawnSparkleBurst(GAME_CENTER_X, GAME_CENTER_Y - 170, 10);
                this.tweens.add({
                    targets: bigStar,
                    y: bigStar.y - 10,
                    duration: 260,
                    yoyo: true,
                    repeat: 1,
                    ease: 'Sine.easeOut',
                });
            },
        });
        this.tweens.add({
            targets: [titleText, subtitleText],
            alpha: 1,
            y: '-=8',
            duration: 400,
            delay: 350,
            ease: 'Sine.easeOut',
        });

        const playAgainButton = createButton(
            this,
            GAME_CENTER_X - 190,
            GAME_CENTER_Y + 150,
            'Play Again',
            () => this.handlePlayAgain(),
            { width: 320, height: 84, fillColor: BisColors.green, fontSize: 30 },
        );
        playAgainButton.setDepth(31);

        const backButton = createButton(
            this,
            GAME_CENTER_X + 190,
            GAME_CENTER_Y + 150,
            'Back to Start',
            () => this.handleBackToStart(),
            { width: 320, height: 84, fillColor: BisColors.skyBlue, fontSize: 28 },
        );
        backButton.setDepth(31);

        this.completionButtons = [playAgainButton, backButton];

        for (const button of this.completionButtons) {
            button.setScale(0);
        }
        this.tweens.add({
            targets: this.completionButtons,
            scale: 1,
            duration: 400,
            delay: 550,
            ease: 'Back.easeOut',
        });
    }

    private disableCompletionButtons(): void {
        for (const button of this.completionButtons) {
            button.disableInteractive();
        }
    }

    private handlePlayAgain(): void {
        if (this.isLeaving) {
            return;
        }
        this.isLeaving = true;
        this.sound.play(AssetKeys.Audio.Sfx.ButtonTap, { volume: AudioVolumes.buttonTap });
        this.disableCompletionButtons();
        goToScene(this, SceneKeys.BalloonPop);
    }

    private handleBackToStart(): void {
        if (this.isLeaving) {
            return;
        }
        this.isLeaving = true;
        this.sound.play(AssetKeys.Audio.Sfx.ButtonTap, { volume: AudioVolumes.buttonTap });
        this.disableCompletionButtons();
        goToScene(this, SceneKeys.Welcome);
    }

    // ----- Cleanup ------------------------------------------------------

    private handleShutdown(): void {
        this.time.removeAllEvents();
        this.tweens.killAll();

        for (const key of SCENE_AUDIO_KEYS) {
            this.sound.stopByKey(key);
        }
        // Music itself is deliberately not in SCENE_AUDIO_KEYS — it must
        // keep playing across Play Again / Back to Start. Just guard against
        // a duck left mid-fade if narration was interrupted by the shutdown.
        restoreMusicVolumeImmediately(this);

        for (const balloon of this.activeBalloons) {
            balloon.destroySafely();
        }
        this.activeBalloons = [];
    }
}
