/**
 * Design tokens for the mobile app.
 *
 * Brand colors (primary teal / secondary navy) are ported from the Angular
 * web app's `src/styles.css` (`--primary: #1abc9c`, `--secondary: #2c3e50`)
 * so the mobile app reads as the same product. Semantic colors
 * (success/warning/danger/info) are the Bootstrap defaults the web app
 * itself left untouched, kept here for the same reason.
 *
 * Fonts: the web app uses Lato/Montserrat via Google Fonts. Rather than
 * pull in expo-google-fonts (custom font loading, splash-screen handling)
 * for Phase 1, this uses the platform system font stack and defers custom
 * fonts to the Phase 5 polish pass — see docs/PHASED_DELIVERY.md.
 */
import { Platform } from 'react-native';

export const colors = {
    primary: '#1abc9c',
    primaryDark: '#16a085',
    secondary: '#2c3e50',
    background: '#ffffff',
    surface: '#f8f9fa',
    border: '#dee2e6',
    text: '#2c3e50',
    // Slightly darkened from the Bootstrap default (#6c757d) to clear 4.5:1
    // against `background`/`surface` — the original sat just under threshold.
    textMuted: '#6b747c',
    textInverse: '#ffffff',
    success: '#28a745',
    warning: '#ffc107',
    danger: '#dc3545',
    info: '#007bff',
    // Darkened variants of the brand/semantic colors above, for use ONLY
    // where the color is text, an icon conveying meaning, or a meaningful
    // selected/error UI-state indicator (WCAG 1.4.3 text contrast 4.5:1,
    // 1.4.11 non-text contrast 3:1). The base colors above stay unchanged
    // for backgrounds, borders, and decorative accents, where they already
    // pass — e.g. white-on-`primary` is only ~2.4:1, too low for the bold
    // button label, but `primary` itself is fine as a card border. Keeping
    // both avoids a global brand-color change while fixing the real
    // failures found in the Phase 5 contrast audit.
    primaryText: '#12846d',
    successText: '#208637',
    dangerText: '#d33342',
    infoText: '#0071eb'
} as const;

export const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48
} as const;

export const radii = {
    sm: 4,
    md: 8,
    lg: 16,
    pill: 999
} as const;

export const typography = {
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }),
    fontFamilyBold: Platform.select({ ios: 'System', android: 'sans-serif-medium', default: 'System' }),
    fontSize: {
        xs: 12,
        sm: 14,
        md: 16,
        lg: 20,
        xl: 24,
        xxl: 32
    },
    fontWeight: {
        regular: '400' as const,
        bold: '700' as const
    }
} as const;

export const theme = {
    colors,
    spacing,
    radii,
    typography
} as const;

export type Theme = typeof theme;
