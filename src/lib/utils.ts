export const cn = (...classes: (string | undefined | false)[]) => {
    return classes.filter(Boolean).join(' ');
};


// Helper to generate voucher code: 3 letters + 3 numbers
export const generateVoucherCode = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    let code = '';
    for (let i = 0; i < 3; i++) code += letters.charAt(Math.floor(Math.random() * letters.length));
    for (let i = 0; i < 3; i++) code += numbers.charAt(Math.floor(Math.random() * numbers.length));
    return code;
};

/**
 * Dispara uma vibração curta em dispositivos móveis que suportam a API.
 * Útil para dar feedback tátil em botões de ação (Native Feel).
 */
export const hapticFeedback = (intensity: 'light' | 'medium' | 'heavy' | 'success' | 'error' = 'light') => {
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
        switch (intensity) {
            case 'light': window.navigator.vibrate(10); break;
            case 'medium': window.navigator.vibrate(20); break;
            case 'heavy': window.navigator.vibrate(50); break;
            case 'success': window.navigator.vibrate([10, 30, 10]); break;
            case 'error': window.navigator.vibrate([50, 100, 50]); break;
        }
    }
};

