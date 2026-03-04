import { describe, it, expect, vi } from 'vitest';
import { cn, generateVoucherCode, hapticFeedback } from '@/lib/utils';

// ============================================================================
// cn (class names merger)
// ============================================================================

describe('cn', () => {
    it('joins multiple class strings', () => {
        expect(cn('foo', 'bar')).toBe('foo bar');
    });

    it('filters out undefined values', () => {
        expect(cn('foo', undefined, 'bar')).toBe('foo bar');
    });

    it('filters out false values', () => {
        expect(cn('foo', false, 'bar')).toBe('foo bar');
    });

    it('returns empty string when all falsy', () => {
        expect(cn(undefined, false)).toBe('');
    });

    it('handles single class', () => {
        expect(cn('solo')).toBe('solo');
    });
});

// ============================================================================
// generateVoucherCode
// ============================================================================

describe('generateVoucherCode', () => {
    it('generates code with exactly 6 characters', () => {
        const code = generateVoucherCode();
        expect(code).toHaveLength(6);
    });

    it('first 3 chars are uppercase letters', () => {
        const code = generateVoucherCode();
        expect(code.slice(0, 3)).toMatch(/^[A-Z]{3}$/);
    });

    it('last 3 chars are digits', () => {
        const code = generateVoucherCode();
        expect(code.slice(3)).toMatch(/^[0-9]{3}$/);
    });

    it('generates different codes on successive calls', () => {
        const codes = new Set(Array.from({ length: 20 }, () => generateVoucherCode()));
        // With 26^3 * 10^3 = 17,576,000 combos, 20 should be unique
        expect(codes.size).toBeGreaterThan(1);
    });
});

// ============================================================================
// hapticFeedback
// ============================================================================

describe('hapticFeedback', () => {
    it('calls navigator.vibrate with correct duration for light', () => {
        const vibrateMock = vi.fn();
        Object.defineProperty(window.navigator, 'vibrate', {
            value: vibrateMock,
            writable: true,
            configurable: true,
        });

        hapticFeedback('light');
        expect(vibrateMock).toHaveBeenCalledWith(10);
    });

    it('calls vibrate with pattern for success', () => {
        const vibrateMock = vi.fn();
        Object.defineProperty(window.navigator, 'vibrate', {
            value: vibrateMock,
            writable: true,
            configurable: true,
        });

        hapticFeedback('success');
        expect(vibrateMock).toHaveBeenCalledWith([10, 30, 10]);
    });

    it('calls vibrate with pattern for error', () => {
        const vibrateMock = vi.fn();
        Object.defineProperty(window.navigator, 'vibrate', {
            value: vibrateMock,
            writable: true,
            configurable: true,
        });

        hapticFeedback('error');
        expect(vibrateMock).toHaveBeenCalledWith([50, 100, 50]);
    });

    it('does not throw when vibrate is not available', () => {
        Object.defineProperty(window.navigator, 'vibrate', {
            value: undefined,
            writable: true,
            configurable: true,
        });

        expect(() => hapticFeedback('light')).not.toThrow();
    });
});
