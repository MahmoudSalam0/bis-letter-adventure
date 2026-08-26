import { GameObjects, Scene } from 'phaser';
import { AssetKeys } from '../config/AssetKeys';
import { GAME_CENTER_X, GAME_CENTER_Y } from '../config/GameConfig';
import { SceneKeys } from '../config/SceneKeys';
import { drawBackdrop, createRoundedPanel } from '../ui/UiHelpers';

export class Preloader extends Scene {
    private progressBar!: GameObjects.Graphics;
    private readonly barWidth = 460;
    private readonly barX = GAME_CENTER_X - 230;

    constructor() {
        super(SceneKeys.Preloader);
    }

    init(): void {
        drawBackdrop(this);

        createRoundedPanel(this, GAME_CENTER_X, GAME_CENTER_Y - 40, 700, 260);

        this.add.text(GAME_CENTER_X, GAME_CENTER_Y - 90, 'BIS Letter Adventure', {
            fontFamily: 'Arial, sans-serif',
            fontSize: 44,
            color: '#ffffff',
            fontStyle: 'bold',
        }).setOrigin(0.5);

        this.add.text(GAME_CENTER_X, GAME_CENTER_Y - 40, 'Loading fun stuff…', {
            fontFamily: 'Arial, sans-serif',
            fontSize: 22,
            color: '#ffe08a',
        }).setOrigin(0.5);

        // Progress bar track.
        this.add.rectangle(GAME_CENTER_X, GAME_CENTER_Y + 20, this.barWidth + 8, 28)
            .setStrokeStyle(2, 0xffffff);

        this.progressBar = this.add.graphics();

        this.load.on('progress', (progress: number) => {
            this.progressBar.clear();
            this.progressBar.fillStyle(0x3ac26b, 1);
            this.progressBar.fillRoundedRect(
                this.barX,
                GAME_CENTER_Y + 20 - 10,
                4 + this.barWidth * progress,
                20,
                10,
            );
        });
    }

    preload(): void {
        this.load.setPath('assets');

        this.load.image(AssetKeys.Backgrounds.Welcome, 'backgrounds/welcome-bg.webp');
        this.load.image(AssetKeys.Characters.MascotWave, 'characters/mascot-wave.webp');
        this.load.image(AssetKeys.Characters.MascotPoint, 'characters/mascot-point.webp');
        this.load.image(AssetKeys.Letters.BUpper, 'objects/letters/letter-b-uppercase.webp');
        this.load.image(AssetKeys.Letters.BLower, 'objects/letters/letter-b-lowercase.webp');
        this.load.image(AssetKeys.Particles.Sparkle, 'particles/sparkle.webp');
        this.load.image(AssetKeys.UI.RewardStar, 'ui/reward-star.webp');

        this.load.image(AssetKeys.Balloons.Blue, 'balloons/balloon-blue.webp');
        this.load.image(AssetKeys.Balloons.Green, 'balloons/balloon-green.webp');
        this.load.image(AssetKeys.Balloons.Yellow, 'balloons/balloon-yellow.webp');
        this.load.image(AssetKeys.Balloons.Coral, 'balloons/balloon-coral.webp');
        this.load.image(AssetKeys.Balloons.Purple, 'balloons/balloon-purple.webp');

        this.load.audio(AssetKeys.Audio.Music.Background, 'audio/music/background-music.mp3');

        this.load.audio(AssetKeys.Audio.Narrator.LetterBIntro, 'audio/narrator/letter-b-intro.mp3');
        this.load.audio(AssetKeys.Audio.Narrator.PopLetterB, 'audio/narrator/pop-letter-b.mp3');
        this.load.audio(AssetKeys.Audio.Narrator.GreatJobB, 'audio/narrator/great-job-b.mp3');

        this.load.audio(AssetKeys.Audio.Sfx.ButtonTap, 'audio/sfx/button-tap.mp3');
        this.load.audio(AssetKeys.Audio.Sfx.BalloonPop, 'audio/sfx/balloon-pop.mp3');
        this.load.audio(AssetKeys.Audio.Sfx.CorrectChime, 'audio/sfx/correct-chime.mp3');
        this.load.audio(AssetKeys.Audio.Sfx.TryAgain, 'audio/sfx/try-again.mp3');
        this.load.audio(AssetKeys.Audio.Sfx.Celebration, 'audio/sfx/celebration.mp3');
    }

    create(): void {
        this.scene.start(SceneKeys.Welcome);
    }
}
