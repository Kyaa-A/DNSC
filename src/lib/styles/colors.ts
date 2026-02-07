/**
 * Color System for DNSC Attendance
 *
 * This file defines the color hierarchy using Tailwind CSS v4 @theme directive
 * and provides utility functions for consistent color usage across components.
 */

// Base color palette (HSL values for better color manipulation)
export const baseColors = {
  // Primary brand colors - DNSC Green
  primary: {
    50: 'hsl(140, 60%, 98%)',   // Very light green
    100: 'hsl(140, 50%, 95%)',  // Light green
    200: 'hsl(140, 50%, 90%)',  // Lighter green
    300: 'hsl(140, 40%, 80%)',  // Light green
    400: 'hsl(140, 45%, 65%)',  // Medium light green
    500: 'hsl(142, 70%, 45%)',  // Main Green
    600: 'hsl(142, 76%, 36%)',  // Deep Green (Brand)
    700: 'hsl(145, 80%, 25%)',  // Dark Institutional Green
    800: 'hsl(145, 85%, 20%)',  // Darker Green
    900: 'hsl(145, 90%, 15%)',  // Very Dark Green
    950: 'hsl(145, 90%, 10%)',  // Darkest Green
  },
  
  // Secondary accent colors - Cool Grays/Greens
  secondary: {
    50: 'hsl(150, 20%, 98%)',
    100: 'hsl(150, 20%, 94%)',
    200: 'hsl(150, 15%, 88%)',
    300: 'hsl(150, 12%, 80%)',
    400: 'hsl(150, 10%, 65%)',
    500: 'hsl(150, 10%, 45%)',
    600: 'hsl(150, 12%, 35%)',
    700: 'hsl(150, 20%, 25%)',
    800: 'hsl(150, 25%, 15%)',
    900: 'hsl(150, 30%, 10%)',
    950: 'hsl(150, 30%, 5%)',
  },
  
  // Success colors (Similar to primary but distinct enough if needed)
  success: {
    50: 'hsl(138, 76%, 97%)',
    100: 'hsl(141, 84%, 93%)',
    200: 'hsl(141, 79%, 85%)',
    300: 'hsl(142, 77%, 73%)',
    400: 'hsl(142, 69%, 58%)',
    500: 'hsl(142, 71%, 45%)',
    600: 'hsl(142, 76%, 36%)',
    700: 'hsl(142, 72%, 29%)',
    800: 'hsl(143, 64%, 24%)',
    900: 'hsl(144, 61%, 20%)',
    950: 'hsl(145, 80%, 14%)',
  },
  
  // Warning colors
  warning: {
    50: 'hsl(48, 100%, 96%)',
    100: 'hsl(48, 96%, 89%)',
    200: 'hsl(48, 96%, 77%)',
    300: 'hsl(47, 95%, 57%)',
    400: 'hsl(47, 95%, 44%)',
    500: 'hsl(47, 96%, 89%)',
    600: 'hsl(35, 100%, 50%)',
    700: 'hsl(32, 95%, 44%)',
    800: 'hsl(26, 90%, 37%)',
    900: 'hsl(23, 83%, 31%)',
    950: 'hsl(15, 100%, 15%)',
  },
  
  // Error colors
  error: {
    50: 'hsl(0, 85%, 97%)',
    100: 'hsl(0, 93%, 94%)',
    200: 'hsl(0, 96%, 89%)',
    300: 'hsl(0, 94%, 82%)',
    400: 'hsl(0, 91%, 71%)',
    500: 'hsl(0, 84%, 60%)',
    600: 'hsl(0, 72%, 51%)',
    700: 'hsl(0, 74%, 42%)',
    800: 'hsl(0, 70%, 35%)',
    900: 'hsl(0, 63%, 31%)',
    950: 'hsl(0, 85%, 15%)',
  },
  
  // Neutral colors
  neutral: {
    50: 'hsl(0, 0%, 98%)',
    100: 'hsl(0, 0%, 96%)',
    200: 'hsl(0, 0%, 90%)',
    300: 'hsl(0, 0%, 83%)',
    400: 'hsl(0, 0%, 64%)',
    500: 'hsl(0, 0%, 45%)',
    600: 'hsl(0, 0%, 32%)',
    700: 'hsl(0, 0%, 25%)',
    800: 'hsl(0, 0%, 15%)',
    900: 'hsl(0, 0%, 9%)',
    950: 'hsl(0, 0%, 4%)',
  },
} as const;

// Semantic color mapping
export const semanticColors = {
  // Background colors
  background: {
    primary: baseColors.neutral[50],
    secondary: baseColors.neutral[100],
    tertiary: baseColors.neutral[200],
    card: baseColors.neutral[50],
    muted: baseColors.neutral[100],
    accent: baseColors.primary[50],
  },
  
  // Text colors
  text: {
    primary: baseColors.neutral[900],
    secondary: baseColors.neutral[700],
    tertiary: baseColors.neutral[500],
    muted: baseColors.neutral[400],
    inverse: baseColors.neutral[50],
    accent: baseColors.primary[700],
  },
  
  // Border colors
  border: {
    primary: baseColors.neutral[200],
    secondary: baseColors.neutral[300],
    accent: baseColors.primary[200],
    muted: baseColors.neutral[100],
  },
  
  // Interactive colors
  interactive: {
    primary: baseColors.primary[600],
    primaryHover: baseColors.primary[700],
    primaryActive: baseColors.primary[800],
    secondary: baseColors.secondary[600],
    secondaryHover: baseColors.secondary[700],
    secondaryActive: baseColors.secondary[800],
  },
  
  // Status colors
  status: {
    success: baseColors.success[600],
    successLight: baseColors.success[100],
    warning: baseColors.warning[600],
    warningLight: baseColors.warning[100],
    error: baseColors.error[600],
    errorLight: baseColors.error[100],
    info: baseColors.primary[600],
    infoLight: baseColors.primary[100],
  },
} as const;

// Color utility functions
export function getColor(colorPath: string): string {
  const path = colorPath.split('.');
  let current: Record<string, unknown> = { ...baseColors, ...semanticColors };
  
  for (const key of path) {
    if (current[key] !== undefined) {
      current = current[key] as Record<string, unknown>;
    } else {
      console.warn(`Color path "${colorPath}" not found`);
      return baseColors.neutral[500]; // Fallback
    }
  }
  
  // At this point, current should be a string value, not a Record
  if (typeof current === 'string') {
    return current;
  }
  
  // Fallback if the final value is not a string
  console.warn(`Color path "${colorPath}" does not resolve to a string value`);
  return baseColors.neutral[500];
}

export function getColorWithOpacity(colorPath: string, opacity: number): string {
  const color = getColor(colorPath);
  if (color.startsWith('hsl(')) {
    return color.replace(')', `, ${opacity})`).replace('hsl(', 'hsla(');
  }
  return color;
}

export function getContrastColor(backgroundColor: string): string {
  // Simple contrast calculation for light/dark backgrounds
  if (backgroundColor.includes('hsl(')) {
    const lightness = parseInt(backgroundColor.match(/,\s*(\d+)%/)![1]);
    return lightness > 50 ? baseColors.neutral[900] : baseColors.neutral[50];
  }
  return baseColors.neutral[900]; // Fallback
}

// CSS custom properties for use in CSS-in-JS or global styles
export const colorCSSVariables = {
  // Base colors
  '--color-primary-50': baseColors.primary[50],
  '--color-primary-100': baseColors.primary[100],
  '--color-primary-200': baseColors.primary[200],
  '--color-primary-300': baseColors.primary[300],
  '--color-primary-400': baseColors.primary[400],
  '--color-primary-500': baseColors.primary[500],
  '--color-primary-600': baseColors.primary[600],
  '--color-primary-700': baseColors.primary[700],
  '--color-primary-800': baseColors.primary[800],
  '--color-primary-900': baseColors.primary[900],
  '--color-primary-950': baseColors.primary[950],
  
  '--color-secondary-50': baseColors.secondary[50],
  '--color-secondary-100': baseColors.secondary[100],
  '--color-secondary-200': baseColors.secondary[200],
  '--color-secondary-300': baseColors.secondary[300],
  '--color-secondary-400': baseColors.secondary[400],
  '--color-secondary-500': baseColors.secondary[500],
  '--color-secondary-600': baseColors.secondary[600],
  '--color-secondary-700': baseColors.secondary[700],
  '--color-secondary-800': baseColors.secondary[800],
  '--color-secondary-900': baseColors.secondary[900],
  '--color-secondary-950': baseColors.secondary[950],
  
  '--color-success-50': baseColors.success[50],
  '--color-success-100': baseColors.success[100],
  '--color-success-200': baseColors.success[200],
  '--color-success-300': baseColors.success[300],
  '--color-success-400': baseColors.success[400],
  '--color-success-500': baseColors.success[500],
  '--color-success-600': baseColors.success[600],
  '--color-success-700': baseColors.success[700],
  '--color-success-800': baseColors.success[800],
  '--color-success-900': baseColors.success[900],
  '--color-success-950': baseColors.success[950],
  
  '--color-warning-50': baseColors.warning[50],
  '--color-warning-100': baseColors.warning[100],
  '--color-warning-200': baseColors.warning[200],
  '--color-warning-300': baseColors.warning[300],
  '--color-warning-400': baseColors.warning[400],
  '--color-warning-500': baseColors.warning[500],
  '--color-warning-600': baseColors.warning[600],
  '--color-warning-700': baseColors.warning[700],
  '--color-warning-800': baseColors.warning[800],
  '--color-warning-900': baseColors.warning[900],
  '--color-warning-950': baseColors.warning[950],
  
  '--color-error-50': baseColors.error[50],
  '--color-error-100': baseColors.error[100],
  '--color-error-200': baseColors.error[200],
  '--color-error-300': baseColors.error[300],
  '--color-error-400': baseColors.error[400],
  '--color-error-500': baseColors.error[500],
  '--color-error-600': baseColors.error[600],
  '--color-error-700': baseColors.error[700],
  '--color-error-800': baseColors.error[800],
  '--color-error-900': baseColors.error[900],
  '--color-error-950': baseColors.error[950],
  
  '--color-neutral-50': baseColors.neutral[50],
  '--color-neutral-100': baseColors.neutral[100],
  '--color-neutral-200': baseColors.neutral[200],
  '--color-neutral-300': baseColors.neutral[300],
  '--color-neutral-400': baseColors.neutral[400],
  '--color-neutral-500': baseColors.neutral[500],
  '--color-neutral-600': baseColors.neutral[600],
  '--color-neutral-700': baseColors.neutral[700],
  '--color-neutral-800': baseColors.neutral[800],
  '--color-neutral-900': baseColors.neutral[900],
  '--color-neutral-950': baseColors.neutral[950],
  
  // Semantic colors
  '--color-background-primary': semanticColors.background.primary,
  '--color-background-secondary': semanticColors.background.secondary,
  '--color-background-tertiary': semanticColors.background.tertiary,
  '--color-background-card': semanticColors.background.card,
  '--color-background-muted': semanticColors.background.muted,
  '--color-background-accent': semanticColors.background.accent,
  
  '--color-text-primary': semanticColors.text.primary,
  '--color-text-secondary': semanticColors.text.secondary,
  '--color-text-tertiary': semanticColors.text.tertiary,
  '--color-text-muted': semanticColors.text.muted,
  '--color-text-inverse': semanticColors.text.inverse,
  '--color-text-accent': semanticColors.text.accent,
  
  '--color-border-primary': semanticColors.border.primary,
  '--color-border-secondary': semanticColors.border.secondary,
  '--color-border-accent': semanticColors.border.accent,
  '--color-border-muted': semanticColors.border.muted,
  
  '--color-interactive-primary': semanticColors.interactive.primary,
  '--color-interactive-primary-hover': semanticColors.interactive.primaryHover,
  '--color-interactive-primary-active': semanticColors.interactive.primaryActive,
  '--color-interactive-secondary': semanticColors.interactive.secondary,
  '--color-interactive-secondary-hover': semanticColors.interactive.secondaryHover,
  '--color-interactive-secondary-active': semanticColors.interactive.secondaryActive,
  
  '--color-status-success': semanticColors.status.success,
  '--color-status-success-light': semanticColors.status.successLight,
  '--color-status-warning': semanticColors.status.warning,
  '--color-status-warning-light': semanticColors.status.warningLight,
  '--color-status-error': semanticColors.status.error,
  '--color-status-error-light': semanticColors.status.errorLight,
  '--color-status-info': semanticColors.status.info,
  '--color-status-info-light': semanticColors.status.infoLight,
} as const;

// Tailwind CSS v4 @theme directive content
export const colorThemeDirective = `
@theme {
  /* Base Colors */
  --color-primary-50: ${baseColors.primary[50]};
  --color-primary-100: ${baseColors.primary[100]};
  --color-primary-200: ${baseColors.primary[200]};
  --color-primary-300: ${baseColors.primary[300]};
  --color-primary-400: ${baseColors.primary[400]};
  --color-primary-500: ${baseColors.primary[500]};
  --color-primary-600: ${baseColors.primary[600]};
  --color-primary-700: ${baseColors.primary[700]};
  --color-primary-800: ${baseColors.primary[800]};
  --color-primary-900: ${baseColors.primary[900]};
  --color-primary-950: ${baseColors.primary[950]};
  
  --color-secondary-50: ${baseColors.secondary[50]};
  --color-secondary-100: ${baseColors.secondary[100]};
  --color-secondary-200: ${baseColors.secondary[200]};
  --color-secondary-300: ${baseColors.secondary[300]};
  --color-secondary-400: ${baseColors.secondary[400]};
  --color-secondary-500: ${baseColors.secondary[500]};
  --color-secondary-600: ${baseColors.secondary[600]};
  --color-secondary-700: ${baseColors.secondary[700]};
  --color-secondary-800: ${baseColors.secondary[800]};
  --color-secondary-900: ${baseColors.secondary[900]};
  --color-secondary-950: ${baseColors.secondary[950]};
  
  --color-success-50: ${baseColors.success[50]};
  --color-success-100: ${baseColors.success[100]};
  --color-success-200: ${baseColors.success[200]};
  --color-success-300: ${baseColors.success[300]};
  --color-success-400: ${baseColors.success[400]};
  --color-success-500: ${baseColors.success[500]};
  --color-success-600: ${baseColors.success[600]};
  --color-success-700: ${baseColors.success[700]};
  --color-success-800: ${baseColors.success[800]};
  --color-success-900: ${baseColors.success[900]};
  --color-success-950: ${baseColors.success[950]};
  
  --color-warning-50: ${baseColors.warning[50]};
  --color-warning-100: ${baseColors.warning[100]};
  --color-warning-200: ${baseColors.warning[200]};
  --color-warning-300: ${baseColors.warning[300]};
  --color-warning-400: ${baseColors.warning[400]};
  --color-warning-500: ${baseColors.warning[500]};
  --color-warning-600: ${baseColors.warning[600]};
  --color-warning-700: ${baseColors.warning[700]};
  --color-warning-800: ${baseColors.warning[800]};
  --color-warning-900: ${baseColors.warning[900]};
  --color-warning-950: ${baseColors.warning[950]};
  
  --color-error-50: ${baseColors.error[50]};
  --color-error-100: ${baseColors.error[100]};
  --color-error-200: ${baseColors.error[200]};
  --color-error-300: ${baseColors.error[300]};
  --color-error-400: ${baseColors.error[400]};
  --color-error-500: ${baseColors.error[500]};
  --color-error-600: ${baseColors.error[600]};
  --color-error-700: ${baseColors.error[700]};
  --color-error-800: ${baseColors.error[800]};
  --color-error-900: ${baseColors.error[900]};
  --color-error-950: ${baseColors.error[950]};
  
  --color-neutral-50: ${baseColors.neutral[50]};
  --color-neutral-100: ${baseColors.neutral[100]};
  --color-neutral-200: ${baseColors.neutral[200]};
  --color-neutral-300: ${baseColors.neutral[300]};
  --color-neutral-400: ${baseColors.neutral[400]};
  --color-neutral-500: ${baseColors.neutral[500]};
  --color-neutral-600: ${baseColors.neutral[600]};
  --color-neutral-700: ${baseColors.neutral[700]};
  --color-neutral-800: ${baseColors.neutral[800]};
  --color-neutral-900: ${baseColors.neutral[900]};
  --color-neutral-950: ${baseColors.neutral[950]};
  
  /* Semantic Colors */
  --color-background-primary: ${semanticColors.background.primary};
  --color-background-secondary: ${semanticColors.background.secondary};
  --color-background-tertiary: ${semanticColors.background.tertiary};
  --color-background-card: ${semanticColors.background.card};
  --color-background-muted: ${semanticColors.background.muted};
  --color-background-accent: ${semanticColors.background.accent};
  
  --color-text-primary: ${semanticColors.text.primary};
  --color-text-secondary: ${semanticColors.text.secondary};
  --color-text-tertiary: ${semanticColors.text.tertiary};
  --color-text-muted: ${semanticColors.text.muted};
  --color-text-inverse: ${semanticColors.text.inverse};
  --color-text-accent: ${semanticColors.text.accent};
  
  --color-border-primary: ${semanticColors.border.primary};
  --color-border-secondary: ${semanticColors.border.secondary};
  --color-border-accent: ${semanticColors.border.accent};
  --color-border-muted: ${semanticColors.border.muted};
  
  --color-interactive-primary: ${semanticColors.interactive.primary};
  --color-interactive-primary-hover: ${semanticColors.interactive.primaryHover};
  --color-interactive-primary-active: ${semanticColors.interactive.primaryActive};
  --color-interactive-secondary: ${semanticColors.interactive.secondary};
  --color-interactive-secondary-hover: ${semanticColors.interactive.secondaryHover};
  --color-interactive-secondary-active: ${semanticColors.interactive.secondaryActive};
  
  --color-status-success: ${semanticColors.status.success};
  --color-status-success-light: ${semanticColors.status.successLight};
  --color-status-warning: ${semanticColors.status.warning};
  --color-status-warning-light: ${semanticColors.status.warningLight};
  --color-status-error: ${semanticColors.status.error};
  --color-status-error-light: ${semanticColors.status.errorLight};
  --color-status-info: ${semanticColors.status.info};
  --color-status-info-light: ${semanticColors.status.infoLight};
}
`;
