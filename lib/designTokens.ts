// Design System Tokens - Shared across all components
export const designTokens = {
    // Colors (HSL)
    colors: {
        primary: {
            from: 'from-[hsl(262,83%,58%)]',
            via: 'via-[hsl(262,83%,48%)]',
            to: 'to-[hsl(262,83%,38%)]',
            gradient: 'bg-gradient-to-br from-[hsl(262,83%,58%)] via-[hsl(262,83%,48%)] to-[hsl(262,83%,38%)]'
        },
        gradients: {
            purple: 'from-purple-500 to-pink-500',
            blue: 'from-blue-500 to-cyan-500',
            emerald: 'from-emerald-500 to-teal-500',
            amber: 'from-amber-500 to-orange-500',
            red: 'from-red-500 to-orange-500'
        },
        glow: {
            purple: 'bg-purple-500/20',
            blue: 'bg-blue-500/20',
            emerald: 'bg-emerald-500/20',
            amber: 'bg-amber-500/20',
            red: 'bg-red-500/20'
        }
    },

    // Glassmorphism
    glass: {
        card: 'bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10',
        overlay: 'bg-white/5 backdrop-blur-sm',
        input: 'bg-white/5 backdrop-blur-md border border-white/10'
    },

    // Spacing
    spacing: {
        container: 'space-y-6 p-4',
        cardPadding: 'p-4',
        cardGap: 'gap-4'
    },

    // Typography
    typography: {
        h1: 'text-xl md:text-2xl font-black text-white tracking-tight',
        h2: 'text-lg font-black text-white',
        h3: 'text-base font-black text-white',
        body: 'text-sm text-white/80 font-medium',
        label: 'text-xs font-bold text-white/60 uppercase tracking-wider',
        mono: 'font-mono font-black'
    },

    // Rounded
    rounded: {
        card: 'rounded-2xl',
        button: 'rounded-xl',
        input: 'rounded-xl',
        small: 'rounded-lg'
    },

    // Shadows
    shadows: {
        card: 'shadow-xl hover:shadow-2xl',
        glow: 'shadow-lg',
        premium: 'shadow-2xl'
    },

    // Transitions
    transitions: {
        default: 'transition-all duration-300',
        slow: 'transition-all duration-500',
        hover: 'hover:-translate-y-2 transition-all duration-500'
    }
};

// Utility function to combine classes
export const cn = (...classes: (string | undefined | false)[]) => {
    return classes.filter(Boolean).join(' ');
};
