export interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: string; // Emoji
    secret?: boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
    {
        id: 'enter_backrooms',
        title: 'The Fall',
        description: 'Noclip out of reality and enter the Backrooms.',
        icon: '🕳️',
    },
    {
        id: 'first_steps',
        title: 'First Steps',
        description: 'Survive for 1 minute in Level 0.',
        icon: '👣',
        secret: true,
    },
    {
        id: 'sanity_loss',
        title: 'Losing It',
        description: 'Drop below 50% Sanity.',
        icon: '😵‍💫',
    },
    {
        id: 'find_note',
        title: 'Written by the Lost',
        description: 'Read a note left by a previous wanderer.',
        icon: '📄',
    },
    {
        id: 'escape_level_0',
        title: 'Yellow Hell',
        description: 'Find the exit to Level 0.',
        icon: '🚪',
        secret: true,
    },
];
