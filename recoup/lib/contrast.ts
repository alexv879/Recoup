/**
 * Color Contrast Utility
 * WCAG 2.1 AA/AAA Compliance Checker
 *
 * Based on CRO research requirements:
 * - Body text: 4.5:1 minimum (AA), 7:1 ideal (AAA)
 * - CTA buttons: 3:1 minimum, 5:1+ ideal for conversion
 * - Large text (18pt+): 3:1 minimum (AA), 4.5:1 ideal (AAA)
 */

interface RGB {
  r: number;
  g: number;
  b: number;
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): RGB | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Calculate relative luminance
 * https://www.w3.org/WAI/GL/wiki/Relative_luminance
 */
function getLuminance(rgb: RGB): number {
  const { r, g, b } = rgb;
  const [rs, gs, bs] = [r, g, b].map(c => {
    const val = c / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 * Returns value between 1:1 (no contrast) and 21:1 (max contrast)
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) {
    console.warn('Invalid color format. Use hex format (#RRGGBB)');
    return 0;
  }

  const lum1 = getLuminance(rgb1);
  const lum2 = getLuminance(rgb2);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast meets WCAG level
 */
export function meetsWCAG(
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AA',
  largeText: boolean = false
): boolean {
  const ratio = getContrastRatio(foreground, background);

  const requirements = {
    AA: largeText ? 3 : 4.5,
    AAA: largeText ? 4.5 : 7
  };

  return ratio >= requirements[level];
}

/**
 * Get WCAG compliance level for a color pair
 */
export function getWCAGLevel(
  foreground: string,
  background: string,
  largeText: boolean = false
): 'AAA' | 'AA' | 'Fail' {
  const ratio = getContrastRatio(foreground, background);

  if (largeText) {
    if (ratio >= 4.5) return 'AAA';
    if (ratio >= 3) return 'AA';
    return 'Fail';
  } else {
    if (ratio >= 7) return 'AAA';
    if (ratio >= 4.5) return 'AA';
    return 'Fail';
  }
}

/**
 * Validate CRO-optimized colors against research requirements
 */
export const CRO_COLOR_TESTS = {
  // CTA Button - Should be 5:1+ for optimal conversion
  ctaButton: {
    fg: '#FFFFFF',
    bg: '#E67E50',
    requirement: 5,
    name: 'CTA Button (Orange on White bg)'
  },
  // Primary Button
  primaryButton: {
    fg: '#FFFFFF',
    bg: '#0078D4',
    requirement: 4.5,
    name: 'Primary Button (Blue)'
  },
  // Body Text
  bodyText: {
    fg: '#1F2937',
    bg: '#FFFFFF',
    requirement: 7,
    name: 'Body Text (Dark Gray on White)'
  },
  // Success Badge
  successBadge: {
    fg: '#166534',
    bg: '#F0FDF4',
    requirement: 4.5,
    name: 'Success Badge (Green)'
  },
  // Warning Badge
  warningBadge: {
    fg: '#92400E',
    bg: '#FFFBEB',
    requirement: 4.5,
    name: 'Warning Badge (Amber)'
  },
  // Danger Badge
  dangerBadge: {
    fg: '#991B1B',
    bg: '#FEF2F2',
    requirement: 4.5,
    name: 'Danger Badge (Red)'
  }
};

/**
 * Run all CRO color validations
 */
export function validateCROColors(): void {
  console.log('🎨 CRO Color Contrast Validation\n');

  Object.entries(CRO_COLOR_TESTS).forEach(([key, test]) => {
    const ratio = getContrastRatio(test.fg, test.bg);
    const passes = ratio >= test.requirement;
    const level = getWCAGLevel(test.fg, test.bg, key.includes('Button'));

    console.log(
      `${passes ? '✅' : '❌'} ${test.name}: ${ratio.toFixed(2)}:1 (${level}) - Required: ${test.requirement}:1`
    );
  });
}
