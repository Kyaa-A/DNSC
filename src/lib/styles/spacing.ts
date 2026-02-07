/**
 * Spacing System for DNSC Attendance
 * 
 * This file defines the spacing hierarchy using Tailwind CSS v4 @theme directive
 * and provides utility functions for consistent spacing across components.
 */

// Base spacing unit (4px = 0.25rem)
export const baseSpacingUnit = 4; // px

// Spacing scale (based on 8px grid system)
export const spacingScale = {
  // Micro spacing (0-8px)
  0: '0px',
  1: '4px',    // 0.25rem
  2: '8px',    // 0.5rem
  3: '12px',   // 0.75rem
  4: '16px',   // 1rem
  
  // Small spacing (16-32px)
  5: '20px',   // 1.25rem
  6: '24px',   // 1.5rem
  7: '28px',   // 1.75rem
  8: '32px',   // 2rem
  
  // Medium spacing (32-64px)
  9: '36px',   // 2.25rem
  10: '40px',  // 2.5rem
  11: '44px',  // 2.75rem
  12: '48px',  // 3rem
  13: '52px',  // 3.25rem
  14: '56px',  // 3.5rem
  15: '60px',  // 3.75rem
  16: '64px',  // 4rem
  
  // Large spacing (64-128px)
  20: '80px',  // 5rem
  24: '96px',  // 6rem
  28: '112px', // 7rem
  32: '128px', // 8rem
  
  // Extra large spacing (128px+)
  40: '160px', // 10rem
  48: '192px', // 12rem
  56: '224px', // 14rem
  64: '256px', // 16rem
} as const;

// Component spacing tokens
export const componentSpacing = {
  // Layout spacing
  layout: {
    page: spacingScale[8],      // 32px - Page margins
    section: spacingScale[6],    // 24px - Section spacing
    subsection: spacingScale[4], // 16px - Subsection spacing
    group: spacingScale[3],      // 12px - Group spacing
    item: spacingScale[2],       // 8px - Item spacing
  },
  
  // Component spacing
  component: {
    card: {
      padding: spacingScale[4],  // 16px - Card padding
      margin: spacingScale[3],   // 12px - Card margin
      gap: spacingScale[3],      // 12px - Card content gap
    },
    form: {
      field: spacingScale[4],    // 16px - Form field spacing
      group: spacingScale[6],    // 24px - Form group spacing
      section: spacingScale[8],  // 32px - Form section spacing
    },
    button: {
      padding: {
        sm: `${spacingScale[2]} ${spacingScale[3]}`,  // 8px 12px
        md: `${spacingScale[3]} ${spacingScale[4]}`,  // 12px 16px
        lg: `${spacingScale[4]} ${spacingScale[6]}`,  // 16px 24px
      },
      gap: spacingScale[2],      // 8px - Button content gap
    },
    input: {
      padding: `${spacingScale[2]} ${spacingScale[3]}`, // 8px 12px
      height: '40px',            // Fixed height for consistency
    },
    table: {
      cell: spacingScale[3],     // 12px - Table cell padding
      row: spacingScale[1],      // 4px - Table row spacing
      header: spacingScale[4],   // 16px - Table header padding
    },
  },
  
  // Content spacing
  content: {
    text: {
      paragraph: spacingScale[3], // 12px - Paragraph spacing
      heading: spacingScale[4],   // 16px - Heading spacing
      list: spacingScale[2],      // 8px - List item spacing
    },
    media: {
      image: spacingScale[4],     // 16px - Image margins
      video: spacingScale[4],     // 16px - Video margins
      icon: spacingScale[2],      // 8px - Icon spacing
    },
  },
  
  // Navigation spacing
  navigation: {
    menu: spacingScale[2],       // 8px - Menu item spacing
    breadcrumb: spacingScale[2], // 8px - Breadcrumb spacing
    tab: spacingScale[4],        // 16px - Tab spacing
    sidebar: spacingScale[3],    // 12px - Sidebar item spacing
  },
} as const;

// Responsive spacing breakpoints
export const responsiveSpacing = {
  sm: {
    layout: {
      page: spacingScale[4],     // 16px - Smaller page margins on mobile
      section: spacingScale[4],  // 16px - Smaller section spacing on mobile
    },
    component: {
      card: {
        padding: spacingScale[3], // 12px - Smaller card padding on mobile
        margin: spacingScale[2],  // 8px - Smaller card margin on mobile
      },
    },
  },
  md: {
    layout: {
      page: spacingScale[6],     // 24px - Medium page margins on tablet
      section: spacingScale[5],  // 20px - Medium section spacing on tablet
    },
  },
  lg: {
    layout: {
      page: spacingScale[8],     // 32px - Full page margins on desktop
      section: spacingScale[6],  // 24px - Full section spacing on desktop
    },
  },
} as const;

// Spacing utility functions
export function getSpacing(size: keyof typeof spacingScale): string {
  return spacingScale[size];
}

export function getComponentSpacing(
  category: keyof typeof componentSpacing,
  subcategory: string,
  property?: string
): string | Record<string, string> | unknown {
  const categorySpacing = componentSpacing[category];
  if (property && typeof categorySpacing === 'object' && property in categorySpacing) {
    return (categorySpacing as Record<string, string>)[property];
  }
  return categorySpacing;
}

export function getResponsiveSpacing(
  breakpoint: keyof typeof responsiveSpacing,
  category: string,
  subcategory?: string
): string | Record<string, string> | unknown {
  const breakpointSpacing = responsiveSpacing[breakpoint];
  if (subcategory && typeof breakpointSpacing === 'object' && subcategory in breakpointSpacing) {
    return (breakpointSpacing as Record<string, unknown>)[subcategory];
  }
  return breakpointSpacing;
}

// CSS custom properties for use in CSS-in-JS or global styles
export const spacingCSSVariables = {
  // Base spacing unit
  '--spacing-base': `${baseSpacingUnit}px`,
  
  // Spacing scale
  '--spacing-0': spacingScale[0],
  '--spacing-1': spacingScale[1],
  '--spacing-2': spacingScale[2],
  '--spacing-3': spacingScale[3],
  '--spacing-4': spacingScale[4],
  '--spacing-5': spacingScale[5],
  '--spacing-6': spacingScale[6],
  '--spacing-7': spacingScale[7],
  '--spacing-8': spacingScale[8],
  '--spacing-9': spacingScale[9],
  '--spacing-10': spacingScale[10],
  '--spacing-11': spacingScale[11],
  '--spacing-12': spacingScale[12],
  '--spacing-13': spacingScale[13],
  '--spacing-14': spacingScale[14],
  '--spacing-15': spacingScale[15],
  '--spacing-16': spacingScale[16],
  '--spacing-20': spacingScale[20],
  '--spacing-24': spacingScale[24],
  '--spacing-28': spacingScale[28],
  '--spacing-32': spacingScale[32],
  '--spacing-40': spacingScale[40],
  '--spacing-48': spacingScale[48],
  '--spacing-56': spacingScale[56],
  '--spacing-64': spacingScale[64],
  
  // Component spacing
  '--spacing-card-padding': componentSpacing.component.card.padding,
  '--spacing-card-margin': componentSpacing.component.card.margin,
  '--spacing-card-gap': componentSpacing.component.card.gap,
  '--spacing-form-field': componentSpacing.component.form.field,
  '--spacing-form-group': componentSpacing.component.form.group,
  '--spacing-form-section': componentSpacing.component.form.section,
  '--spacing-button-gap': componentSpacing.component.button.gap,
  '--spacing-input-padding': componentSpacing.component.input.padding,
  '--spacing-table-cell': componentSpacing.component.table.cell,
  '--spacing-table-row': componentSpacing.component.table.row,
  '--spacing-table-header': componentSpacing.component.table.header,
  
  // Layout spacing
  '--spacing-layout-page': componentSpacing.layout.page,
  '--spacing-layout-section': componentSpacing.layout.section,
  '--spacing-layout-subsection': componentSpacing.layout.subsection,
  '--spacing-layout-group': componentSpacing.layout.group,
  '--spacing-layout-item': componentSpacing.layout.item,
  
  // Content spacing
  '--spacing-text-paragraph': componentSpacing.content.text.paragraph,
  '--spacing-text-heading': componentSpacing.content.text.heading,
  '--spacing-text-list': componentSpacing.content.text.list,
  '--spacing-media-image': componentSpacing.content.media.image,
  '--spacing-media-video': componentSpacing.content.media.video,
  '--spacing-media-icon': componentSpacing.content.media.icon,
  
  // Navigation spacing
  '--spacing-nav-menu': componentSpacing.navigation.menu,
  '--spacing-nav-breadcrumb': componentSpacing.navigation.breadcrumb,
  '--spacing-nav-tab': componentSpacing.navigation.tab,
  '--spacing-nav-sidebar': componentSpacing.navigation.sidebar,
} as const;

// Tailwind CSS v4 @theme directive content
export const spacingThemeDirective = `
@theme {
  --spacing-base: ${baseSpacingUnit}px;
  
  --spacing-0: ${spacingScale[0]};
  --spacing-1: ${spacingScale[1]};
  --spacing-2: ${spacingScale[2]};
  --spacing-3: ${spacingScale[3]};
  --spacing-4: ${spacingScale[4]};
  --spacing-5: ${spacingScale[5]};
  --spacing-6: ${spacingScale[6]};
  --spacing-7: ${spacingScale[7]};
  --spacing-8: ${spacingScale[8]};
  --spacing-9: ${spacingScale[9]};
  --spacing-10: ${spacingScale[10]};
  --spacing-11: ${spacingScale[11]};
  --spacing-12: ${spacingScale[12]};
  --spacing-13: ${spacingScale[13]};
  --spacing-14: ${spacingScale[14]};
  --spacing-15: ${spacingScale[15]};
  --spacing-16: ${spacingScale[16]};
  --spacing-20: ${spacingScale[20]};
  --spacing-24: ${spacingScale[24]};
  --spacing-28: ${spacingScale[28]};
  --spacing-32: ${spacingScale[32]};
  --spacing-40: ${spacingScale[40]};
  --spacing-48: ${spacingScale[48]};
  --spacing-56: ${spacingScale[56]};
  --spacing-64: ${spacingScale[64]};
  
  --spacing-card-padding: ${componentSpacing.component.card.padding};
  --spacing-card-margin: ${componentSpacing.component.card.margin};
  --spacing-card-gap: ${componentSpacing.component.card.gap};
  --spacing-form-field: ${componentSpacing.component.form.field};
  --spacing-form-group: ${componentSpacing.component.form.group};
  --spacing-form-section: ${componentSpacing.component.form.section};
  --spacing-button-gap: ${componentSpacing.component.button.gap};
  --spacing-input-padding: ${componentSpacing.component.input.padding};
  --spacing-table-cell: ${componentSpacing.component.table.cell};
  --spacing-table-row: ${componentSpacing.component.table.row};
  --spacing-table-header: ${componentSpacing.component.table.header};
  
  --spacing-layout-page: ${componentSpacing.layout.page};
  --spacing-layout-section: ${componentSpacing.layout.section};
  --spacing-layout-subsection: ${componentSpacing.layout.subsection};
  --spacing-layout-group: ${componentSpacing.layout.group};
  --spacing-layout-item: ${componentSpacing.layout.item};
  
  --spacing-text-paragraph: ${componentSpacing.content.text.paragraph};
  --spacing-text-heading: ${componentSpacing.content.text.heading};
  --spacing-text-list: ${componentSpacing.content.text.list};
  --spacing-media-image: ${componentSpacing.content.media.image};
  --spacing-media-video: ${componentSpacing.content.media.video};
  --spacing-media-icon: ${componentSpacing.content.media.icon};
  
  --spacing-nav-menu: ${componentSpacing.navigation.menu};
  --spacing-nav-breadcrumb: ${componentSpacing.navigation.breadcrumb};
  --spacing-nav-tab: ${componentSpacing.navigation.tab};
  --spacing-nav-sidebar: ${componentSpacing.navigation.sidebar};
}
`;

// Type exports for use in components
export type SpacingScale = typeof spacingScale;
export type ComponentSpacing = typeof componentSpacing;
export type ResponsiveSpacing = typeof responsiveSpacing;
export type SpacingToken = keyof typeof spacingScale;
