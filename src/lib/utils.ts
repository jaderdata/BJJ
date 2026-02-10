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
