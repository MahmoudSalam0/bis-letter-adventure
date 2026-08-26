import { GameObjects, Math as PhaserMath, Scene } from 'phaser';
import { BisColors, GAME_HEIGHT, GAME_WIDTH } from '../config/GameConfig';

/**
 * Draws a cheerful, non-stock backdrop (sky, sun, clouds, ground strip)
 * so development shells read as "children's game" rather than a Phaser sample.
 * Purely decorative Graphics/shapes — no image assets required.
 */
export const drawBackdrop = (scene: Scene): GameObjects.Graphics => {
    const g = scene.add.graphics();

    // Sky.
    g.fillStyle(BisColors.skyBlue, 1);
    g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Soft sun glow.
    g.fillStyle(BisColors.yellow, 0.9);
    g.fillCircle(GAME_WIDTH - 140, 110, 70);

    // Cloud-like decorative circles.
    g.fillStyle(BisColors.cream, 0.85);
    const clouds: [number, number, number][] = [
        [160, 100, 30],
        [200, 100, 40],
        [240, 100, 28],
        [860, 180, 26],
        [895, 180, 36],
        [930, 180, 24],
    ];
    for (const [cx, cy, r] of clouds) {
        g.fillCircle(cx, cy, r);
    }

    // Ground strip.
    g.fillStyle(BisColors.green, 1);
    g.fillRect(0, GAME_HEIGHT - 90, GAME_WIDTH, 90);

    // Decorative stars scattered on the sky.
    g.fillStyle(0xffffff, 0.7);
    const stars: [number, number][] = [
        [90, 220], [420, 60], [620, 140], [760, 90], [1020, 260], [1150, 120],
    ];
    for (const [sx, sy] of stars) {
        drawStar(g, sx, sy, 8);
    }

    return g;
};

const drawStar = (g: GameObjects.Graphics, cx: number, cy: number, size: number): void => {
    const points: PhaserMath.Vector2[] = [];
    for (let i = 0; i < 10; i++) {
        const radius = i % 2 === 0 ? size : size / 2.2;
        const angle = (Math.PI / 5) * i - Math.PI / 2;
        points.push(new PhaserMath.Vector2(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius));
    }
    g.fillPoints(points, true);
};

export const createRoundedPanel = (
    scene: Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    color: number = BisColors.navy,
    alpha = 0.92,
    radius = 28,
): GameObjects.Graphics => {
    const panel = scene.add.graphics();
    panel.fillStyle(color, alpha);
    panel.fillRoundedRect(x - width / 2, y - height / 2, width, height, radius);
    return panel;
};

export interface ButtonOptions {
    width?: number;
    height?: number;
    fillColor?: number;
    textColor?: string;
    fontSize?: number;
}

/**
 * A large, touch-friendly rounded button with label and a gentle press animation.
 */
export const createButton = (
    scene: Scene,
    x: number,
    y: number,
    label: string,
    onClick: () => void,
    options: ButtonOptions = {},
): GameObjects.Container => {
    const width = options.width ?? 320;
    const height = options.height ?? 88;
    const fillColor = options.fillColor ?? BisColors.green;
    const textColor = options.textColor ?? '#ffffff';
    const fontSize = options.fontSize ?? 34;

    const bg = scene.add.graphics();
    bg.fillStyle(fillColor, 1);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, height / 2);

    const text = scene.add.text(0, 0, label, {
        fontFamily: 'Arial, sans-serif',
        fontSize,
        color: textColor,
        fontStyle: 'bold',
    }).setOrigin(0.5);

    const container = scene.add.container(x, y, [bg, text]);
    container.setSize(width, height);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerover', () => scene.tweens.add({ targets: container, scale: 1.05, duration: 120 }));
    container.on('pointerout', () => scene.tweens.add({ targets: container, scale: 1, duration: 120 }));
    container.on('pointerdown', () => scene.tweens.add({ targets: container, scale: 0.95, duration: 80 }));
    container.on('pointerup', () => {
        scene.tweens.add({ targets: container, scale: 1.05, duration: 80 });
        onClick();
    });

    return container;
};
