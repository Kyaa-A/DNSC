/**
 * Accessibility Utilities for DNSC Attendance
 *
 * This file provides utilities for ensuring proper contrast ratios
 * and accessibility compliance across the interface.
 */

import { baseColors } from './colors';

// WCAG 2.1 AA contrast ratio requirements
export const WCAG_AA_CONTRAST_RATIOS = {
  normal: 4.5,      // Normal text (12pt and larger)
  large: 3.0,       // Large text (18pt+ or 14pt+ bold)
  ui: 3.0,          // UI components and graphics
} as const;

// WCAG 2.1 AAA contrast ratio requirements
export const WCAG_AAA_CONTRAST_RATIOS = {
  normal: 7.0,      // Normal text (12pt and larger)
  large: 4.5,       // Large text (18pt+ or 14pt+ bold)
  ui: 3.0,          // UI components and graphics
} as const;

// Contrast calculation utilities
export function calculateContrastRatio(
  foreground: string,
  background: string
): number {
  // Convert colors to luminance values
  const foregroundLuminance = getLuminance(foreground);
  const backgroundLuminance = getLuminance(background);
  
  // Calculate contrast ratio
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  
  return (lighter + 0.05) / (darker + 0.05);
}

// Get luminance value for a color
export function getLuminance(color: string): number {
  // Parse color to RGB values
  const rgb = parseColor(color);
  if (!rgb) return 0;
  
  const [r, g, b] = rgb.map(component => {
    const normalized = component / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4);
  });
  
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Parse color string to RGB values
export function parseColor(color: string): [number, number, number] | null {
  // Handle HSL colors
  if (color.startsWith('hsl(')) {
    return parseHSL(color);
  }
  
  // Handle hex colors
  if (color.startsWith('#')) {
    return parseHex(color);
  }
  
  // Handle named colors (basic mapping)
  const namedColors: Record<string, [number, number, number]> = {
    black: [0, 0, 0],
    white: [255, 255, 255],
    red: [255, 0, 0],
    green: [0, 255, 0],
    blue: [0, 0, 255],
    yellow: [255, 255, 0],
    cyan: [0, 255, 255],
    magenta: [255, 0, 255],
    gray: [128, 128, 128],
    grey: [128, 128, 128],
  };
  
  if (color.toLowerCase() in namedColors) {
    return namedColors[color.toLowerCase()];
  }
  
  return null;
}

// Parse HSL color string
export function parseHSL(hsl: string): [number, number, number] | null {
  const match = hsl.match(/hsl\(([^)]+)\)/);
  if (!match) return null;
  
  const [h, s, l] = match[1].split(',').map(s => parseFloat(s.trim()));
  if (isNaN(h) || isNaN(s) || isNaN(l)) return null;
  
  // Convert HSL to RGB
  const hue = h / 360;
  const saturation = s / 100;
  const lightness = l / 100;
  
  const c = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const x = c * (1 - Math.abs((hue * 6) % 2 - 1));
  const m = lightness - c / 2;
  
  let r = 0, g = 0, b = 0;
  
  if (hue < 1/6) {
    [r, g, b] = [c, x, 0];
  } else if (hue < 2/6) {
    [r, g, b] = [x, c, 0];
  } else if (hue < 3/6) {
    [r, g, b] = [0, c, x];
  } else if (hue < 4/6) {
    [r, g, b] = [0, x, c];
  } else if (hue < 5/6) {
    [r, g, b] = [x, 0, c];
  } else {
    [r, g, b] = [c, 0, x];
  }
  
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255)
  ];
}

// Parse hex color string
export function parseHex(hex: string): [number, number, number] | null {
  const cleanHex = hex.replace('#', '');
  
  if (cleanHex.length === 3) {
    // Expand 3-digit hex to 6-digit
    const expanded = cleanHex.split('').map(char => char + char).join('');
    return parseHex('#' + expanded);
  }
  
  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substr(0, 2), 16);
    const g = parseInt(cleanHex.substr(2, 2), 16);
    const b = parseInt(cleanHex.substr(4, 2), 16);
    
    if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
    return [r, g, b];
  }
  
  return null;
}

// Check if contrast ratio meets WCAG requirements
export function meetsContrastRequirement(
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AA',
  size: 'normal' | 'large' | 'ui' = 'normal'
): boolean {
  const ratio = calculateContrastRatio(foreground, background);
  const requirements = level === 'AA' ? WCAG_AA_CONTRAST_RATIOS : WCAG_AAA_CONTRAST_RATIOS;
  
  return ratio >= requirements[size];
}

// Get accessible text color for a background
export function getAccessibleTextColor(
  background: string,
  level: 'AA' | 'AAA' = 'AA',
  size: 'normal' | 'large' | 'ui' = 'normal'
): string {
  // Try white text first
  if (meetsContrastRequirement('#ffffff', background, level, size)) {
    return '#ffffff';
  }
  
  // Try black text
  if (meetsContrastRequirement('#000000', background, level, size)) {
    return '#000000';
  }
  
  // Try primary colors
  const testColors = [
    baseColors.primary[900],
    baseColors.secondary[900],
    baseColors.neutral[900],
    baseColors.success[900],
    baseColors.warning[900],
    baseColors.error[900],
  ];
  
  for (const color of testColors) {
    if (meetsContrastRequirement(color, background, level, size)) {
      return color;
    }
  }
  
  // Fallback to highest contrast option
  return '#000000';
}

// Accessibility validation utilities
export interface AccessibilityValidationResult {
  isValid: boolean;
  issues: string[];
  warnings: string[];
  recommendations: string[];
}

// Validate color combination accessibility
export function validateColorAccessibility(
  foreground: string,
  background: string,
  context: 'text' | 'ui' | 'graphic' = 'text',
  size: 'normal' | 'large' = 'normal'
): AccessibilityValidationResult {
  const result: AccessibilityValidationResult = {
    isValid: true,
    issues: [],
    warnings: [],
    recommendations: [],
  };
  
  const aaRatio = calculateContrastRatio(foreground, background);
  const aaaRatio = calculateContrastRatio(foreground, background);
  
  // Check AA compliance
  const aaRequirement = context === 'text' 
    ? (size === 'large' ? WCAG_AA_CONTRAST_RATIOS.large : WCAG_AA_CONTRAST_RATIOS.normal)
    : WCAG_AA_CONTRAST_RATIOS.ui;
  
  if (aaRatio < aaRequirement) {
    result.isValid = false;
    result.issues.push(
      `Contrast ratio ${aaRatio.toFixed(2)}:1 does not meet WCAG 2.1 AA requirement of ${aaRequirement}:1`
    );
  }
  
  // Check AAA compliance
  const aaaRequirement = context === 'text'
    ? (size === 'large' ? WCAG_AAA_CONTRAST_RATIOS.large : WCAG_AAA_CONTRAST_RATIOS.normal)
    : WCAG_AAA_CONTRAST_RATIOS.ui;
  
  if (aaaRatio < aaaRequirement) {
    result.warnings.push(
      `Contrast ratio ${aaaRatio.toFixed(2)}:1 does not meet WCAG 2.1 AAA requirement of ${aaaRequirement}:1`
    );
  }
  
  // Provide recommendations
  if (aaRatio < aaRequirement) {
    result.recommendations.push(
      'Consider using a darker text color or lighter background for better readability'
    );
    result.recommendations.push(
      'Test with users who have visual impairments'
    );
  }
  
  if (aaRatio >= aaRequirement && aaaRatio < aaaRequirement) {
    result.recommendations.push(
      'Consider improving contrast to meet AAA standards for better accessibility'
    );
  }
  
  return result;
}

// Generate accessible color palette
export function generateAccessiblePalette(
  baseColor: string,
  level: 'AA' | 'AAA' = 'AA'
): {
  text: string;
  background: string;
  border: string;
  hover: string;
} {
  const textColor = getAccessibleTextColor(baseColor, level);
  const backgroundColor = baseColor;
  
  // Generate border color (slightly darker)
  const borderColor = adjustColorBrightness(baseColor, -0.1);
  
  // Generate hover color (slightly lighter)
  const hoverColor = adjustColorBrightness(baseColor, 0.1);
  
  return {
    text: textColor,
    background: backgroundColor,
    border: borderColor,
    hover: hoverColor,
  };
}

// Adjust color brightness
export function adjustColorBrightness(
  color: string,
  factor: number // -1 to 1, where negative makes darker, positive makes lighter
): string {
  const rgb = parseColor(color);
  if (!rgb) return color;
  
  const [r, g, b] = rgb.map(component => {
    const adjusted = component + (factor * 255);
    return Math.max(0, Math.min(255, adjusted));
  });
  
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}

// Focus management utilities
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const focusableSelectors = [
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
  ];
  
  return Array.from(container.querySelectorAll(focusableSelectors.join(', '))) as HTMLElement[];
}

// Trap focus within a container
export function trapFocus(container: HTMLElement, event: KeyboardEvent): void {
  const focusableElements = getFocusableElements(container);
  if (focusableElements.length === 0) return;
  
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  
  if (event.key === 'Tab') {
    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }
}

// Type exports
export type ContrastLevel = 'AA' | 'AAA';
export type TextSize = 'normal' | 'large';
export type ContextType = 'text' | 'ui' | 'graphic';
