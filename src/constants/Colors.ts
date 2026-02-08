export const Colors = {
    dark: {
        background: '#0B0C10', // Deep midnight charcoal
        surface: '#151820',    // Soft slate base
        surfaceHighlight: '#232634', // Lighter slate
        surfaceElevated: '#1B1F2A',
        glass: 'rgba(255, 255, 255, 0.06)',
        glassStrong: 'rgba(255, 255, 255, 0.12)',
        innerShadow: 'rgba(0, 0, 0, 0.35)',
        glow: 'rgba(147, 197, 253, 0.22)',
        bloom: 'rgba(147, 197, 253, 0.14)',

        text: '#FFFFFF',       // Primary text
        textSecondary: 'rgba(255, 255, 255, 0.74)',
        textMuted: 'rgba(255, 255, 255, 0.46)',

        primary: '#93C5FD',    // Pastel Blue (Tailwind Blue 300)
        primaryVibrant: '#60A5FA', // Blue 400

        accent: '#FDBA74',     // Pastel Orange (Peach)
        success: '#6EE7B7',    // Pastel Mint
        warning: '#FCD34D',    // Pastel Yellow
        error: '#FCA5A5',      // Softer red

        border: '#27272A',     // Zinc 800
        shadow: 'rgba(7, 9, 14, 0.6)',
    },
    // Light mode placeholder
    light: {
        background: '#F8FAFC',
        surface: '#FFFFFF',
        text: '#0F172A',
        primary: '#3B82F6',
    }
};

export const Theme = Colors.dark;
