/**
 * Typography System for DNSC Attendance
 * 
 * This file defines the typography hierarchy using Tailwind CSS v4 @theme directive
 * and provides utility functions for consistent text styling across components.
 */

// Font family definitions
export const fontFamilies = {
  sans: ['Inter', 'system-ui', 'sans-serif'],
  mono: ['JetBrains Mono', 'Consolas', 'monospace'],
} as const;

// Font size scale (based on 1.25 ratio)
export const fontSizes = {
  xs: '0.75rem',      // 12px
  sm: '0.875rem',     // 14px
  base: '1rem',       // 16px
  lg: '1.125rem',     // 18px
  xl: '1.25rem',      // 20px
  '2xl': '1.5rem',    // 24px
  '3xl': '1.875rem',  // 30px
  '4xl': '2.25rem',   // 36px
  '5xl': '3rem',      // 48px
  '6xl': '3.75rem',   // 60px
} as const;

// Font weight scale
export const fontWeights = {
  thin: '100',
  extralight: '200',
  light: '300',
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
  black: '900',
} as const;

// Line height scale
export const lineHeights = {
  none: '1',
  tight: '1.25',
  snug: '1.375',
  normal: '1.5',
  relaxed: '1.625',
  loose: '2',
} as const;

// Letter spacing scale
export const letterSpacings = {
  tighter: '-0.05em',
  tight: '-0.025em',
  normal: '0em',
  wide: '0.025em',
  wider: '0.05em',
  widest: '0.1em',
} as const;

// Typography variants for common use cases
export const typographyVariants = {
  // Display text (large headings)
  display: {
    '2xl': {
      fontSize: fontSizes['6xl'],
      fontWeight: fontWeights.bold,
      lineHeight: lineHeights.tight,
      letterSpacing: letterSpacings.tight,
    },
    xl: {
      fontSize: fontSizes['5xl'],
      fontWeight: fontWeights.bold,
      lineHeight: lineHeights.tight,
      letterSpacing: letterSpacings.tight,
    },
    lg: {
      fontSize: fontSizes['4xl'],
      fontWeight: fontWeights.bold,
      lineHeight: lineHeights.tight,
      letterSpacing: letterSpacings.tight,
    },
    md: {
      fontSize: fontSizes['3xl'],
      fontWeight: fontWeights.bold,
      lineHeight: lineHeights.snug,
      letterSpacing: letterSpacings.tight,
    },
    sm: {
      fontSize: fontSizes['2xl'],
      fontWeight: fontWeights.bold,
      lineHeight: lineHeights.snug,
      letterSpacing: letterSpacings.tight,
    },
  },
  
  // Headings
  heading: {
    h1: {
      fontSize: fontSizes['4xl'],
      fontWeight: fontWeights.bold,
      lineHeight: lineHeights.tight,
      letterSpacing: letterSpacings.tight,
    },
    h2: {
      fontSize: fontSizes['3xl'],
      fontWeight: fontWeights.semibold,
      lineHeight: lineHeights.snug,
      letterSpacing: letterSpacings.tight,
    },
    h3: {
      fontSize: fontSizes['2xl'],
      fontWeight: fontWeights.semibold,
      lineHeight: lineHeights.snug,
      letterSpacing: letterSpacings.normal,
    },
    h4: {
      fontSize: fontSizes.xl,
      fontWeight: fontWeights.semibold,
      lineHeight: lineHeights.snug,
      letterSpacing: letterSpacings.normal,
    },
    h5: {
      fontSize: fontSizes.lg,
      fontWeight: fontWeights.semibold,
      lineHeight: lineHeights.snug,
      letterSpacing: letterSpacings.normal,
    },
    h6: {
      fontSize: fontSizes.base,
      fontWeight: fontWeights.semibold,
      lineHeight: lineHeights.normal,
      letterSpacing: letterSpacings.normal,
    },
  },
  
  // Body text
  body: {
    lg: {
      fontSize: fontSizes.lg,
      fontWeight: fontWeights.normal,
      lineHeight: lineHeights.relaxed,
      letterSpacing: letterSpacings.normal,
    },
    base: {
      fontSize: fontSizes.base,
      fontWeight: fontWeights.normal,
      lineHeight: lineHeights.relaxed,
      letterSpacing: letterSpacings.normal,
    },
    sm: {
      fontSize: fontSizes.sm,
      fontWeight: fontWeights.normal,
      lineHeight: lineHeights.relaxed,
      letterSpacing: letterSpacings.normal,
    },
    xs: {
      fontSize: fontSizes.xs,
      fontWeight: fontWeights.normal,
      lineHeight: lineHeights.relaxed,
      letterSpacing: letterSpacings.normal,
    },
  },
  
  // UI text
  ui: {
    lg: {
      fontSize: fontSizes.lg,
      fontWeight: fontWeights.medium,
      lineHeight: lineHeights.normal,
      letterSpacing: letterSpacings.normal,
    },
    base: {
      fontSize: fontSizes.base,
      fontWeight: fontWeights.medium,
      lineHeight: lineHeights.normal,
      letterSpacing: letterSpacings.normal,
    },
    sm: {
      fontSize: fontSizes.sm,
      fontWeight: fontWeights.medium,
      lineHeight: lineHeights.normal,
      letterSpacing: letterSpacings.normal,
    },
    xs: {
      fontSize: fontSizes.xs,
      fontWeight: fontWeights.medium,
      lineHeight: lineHeights.normal,
      letterSpacing: letterSpacings.normal,
    },
  },
  
  // Caption text
  caption: {
    base: {
      fontSize: fontSizes.sm,
      fontWeight: fontWeights.normal,
      lineHeight: lineHeights.normal,
      letterSpacing: letterSpacings.wide,
    },
    sm: {
      fontSize: fontSizes.xs,
      fontWeight: fontWeights.normal,
      lineHeight: lineHeights.normal,
      letterSpacing: letterSpacings.wide,
    },
  },
  
  // Code text
  code: {
    base: {
      fontFamily: fontFamilies.mono,
      fontSize: fontSizes.sm,
      fontWeight: fontWeights.normal,
      lineHeight: lineHeights.normal,
      letterSpacing: letterSpacings.normal,
    },
    sm: {
      fontFamily: fontFamilies.mono,
      fontSize: fontSizes.xs,
      fontWeight: fontWeights.normal,
      lineHeight: lineHeights.normal,
      letterSpacing: letterSpacings.normal,
    },
  },
} as const;

// Utility function to get typography variant
export function getTypographyVariant(
  category: keyof typeof typographyVariants,
  size: keyof (typeof typographyVariants)[typeof category]
) {
  return typographyVariants[category][size];
}

// CSS custom properties for use in CSS-in-JS or global styles
export const typographyCSSVariables = {
  '--font-family-sans': fontFamilies.sans.join(', '),
  '--font-family-mono': fontFamilies.mono.join(', '),
  
  // Font sizes
  '--font-size-xs': fontSizes.xs,
  '--font-size-sm': fontSizes.sm,
  '--font-size-base': fontSizes.base,
  '--font-size-lg': fontSizes.lg,
  '--font-size-xl': fontSizes.xl,
  '--font-size-2xl': fontSizes['2xl'],
  '--font-size-3xl': fontSizes['3xl'],
  '--font-size-4xl': fontSizes['4xl'],
  '--font-size-5xl': fontSizes['5xl'],
  '--font-size-6xl': fontSizes['6xl'],
  
  // Font weights
  '--font-weight-thin': fontWeights.thin,
  '--font-weight-extralight': fontWeights.extralight,
  '--font-weight-light': fontWeights.light,
  '--font-weight-normal': fontWeights.normal,
  '--font-weight-medium': fontWeights.medium,
  '--font-weight-semibold': fontWeights.semibold,
  '--font-weight-bold': fontWeights.bold,
  '--font-weight-extrabold': fontWeights.extrabold,
  '--font-weight-black': fontWeights.black,
  
  // Line heights
  '--line-height-none': lineHeights.none,
  '--line-height-tight': lineHeights.tight,
  '--line-height-snug': lineHeights.snug,
  '--line-height-normal': lineHeights.normal,
  '--line-height-relaxed': lineHeights.relaxed,
  '--line-height-loose': lineHeights.loose,
  
  // Letter spacings
  '--letter-spacing-tighter': letterSpacings.tighter,
  '--letter-spacing-tight': letterSpacings.tight,
  '--letter-spacing-normal': letterSpacings.normal,
  '--letter-spacing-wide': letterSpacings.wide,
  '--letter-spacing-wider': letterSpacings.wider,
  '--letter-spacing-widest': letterSpacings.widest,
} as const;

// Tailwind CSS v4 @theme directive content
export const typographyThemeDirective = `
@theme {
  --font-family-sans: ${fontFamilies.sans.join(', ')};
  --font-family-mono: ${fontFamilies.mono.join(', ')};
  
  --font-size-xs: ${fontSizes.xs};
  --font-size-sm: ${fontSizes.sm};
  --font-size-base: ${fontSizes.base};
  --font-size-lg: ${fontSizes.lg};
  --font-size-xl: ${fontSizes.xl};
  --font-size-2xl: ${fontSizes['2xl']};
  --font-size-3xl: ${fontSizes['3xl']};
  --font-size-4xl: ${fontSizes['4xl']};
  --font-size-5xl: ${fontSizes['5xl']};
  --font-size-6xl: ${fontSizes['6xl']};
  
  --font-weight-thin: ${fontWeights.thin};
  --font-weight-extralight: ${fontWeights.extralight};
  --font-weight-light: ${fontWeights.light};
  --font-weight-normal: ${fontWeights.normal};
  --font-weight-medium: ${fontWeights.medium};
  --font-weight-semibold: ${fontWeights.semibold};
  --font-weight-bold: ${fontWeights.bold};
  --font-weight-extrabold: ${fontWeights.extrabold};
  --font-weight-black: ${fontWeights.black};
  
  --line-height-none: ${lineHeights.none};
  --line-height-tight: ${lineHeights.tight};
  --line-height-snug: ${lineHeights.snug};
  --line-height-normal: ${lineHeights.normal};
  --line-height-relaxed: ${lineHeights.relaxed};
  --line-height-loose: ${lineHeights.loose};
  
  --letter-spacing-tighter: ${letterSpacings.tighter};
  --letter-spacing-tight: ${letterSpacings.tight};
  --letter-spacing-normal: ${letterSpacings.normal};
  --letter-spacing-wide: ${letterSpacings.wide};
  --letter-spacing-wider: ${letterSpacings.wider};
  --letter-spacing-widest: ${letterSpacings.widest};
}
`;

// Type exports for use in components
export type FontFamily = typeof fontFamilies[keyof typeof fontFamilies];
export type FontSize = typeof fontSizes[keyof typeof fontSizes];
export type FontWeight = typeof fontWeights[keyof typeof fontWeights];
export type LineHeight = typeof lineHeights[keyof typeof lineHeights];
export type LetterSpacing = typeof letterSpacings[keyof typeof letterSpacings];
export type TypographyVariant = typeof typographyVariants;
