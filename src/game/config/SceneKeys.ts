export const SceneKeys = {
    Boot: 'Boot',
    Preloader: 'Preloader',
    Welcome: 'Welcome',
    BalloonPop: 'BalloonPop',
    MagicTracing: 'MagicTracing',
    CatchTheLetter: 'CatchTheLetter',
    FeedTheMonster: 'FeedTheMonster',
    Reward: 'Reward',
} as const;

export type SceneKey = (typeof SceneKeys)[keyof typeof SceneKeys];
