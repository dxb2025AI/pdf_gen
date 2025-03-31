export interface Dimensions {
  width: number;
  height: number;
}

export interface BookFormat {
  id: string;
  name: string;
  // Dimensions without bleed
  noBleed: Dimensions;
  // Dimensions with bleed
  withBleed: Dimensions;
  // Is this a spread (two pages)
  isSpread: boolean;
  // Gutter width in inches
  gutterWidth: number;
  // Spine width in inches (for covers)
  spineWidth?: number;
  // Page count (for spine width calculation)
  pageCount?: number;
}

export interface TemplateElement {
  id: string;
  type: 'image' | 'text' | 'placeholder';
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  isPlaceholder: boolean;
  content?: string;
  src?: string;
}

export interface Template {
  id: string;
  name: string;
  format: BookFormat;
  elements: TemplateElement[];
}

// Book format presets based on Lulu specifications
export const BOOK_FORMATS: Record<string, BookFormat> = {
  pocketbook: {
    id: 'pocketbook',
    name: 'Pocketbook',
    noBleed: { width: 4.25, height: 6.875 },
    withBleed: { width: 4.5, height: 7.125 },
    isSpread: false,
    gutterWidth: 0
  },
  digest: {
    id: 'digest',
    name: 'Digest',
    noBleed: { width: 5.5, height: 8.5 },
    withBleed: { width: 5.75, height: 8.75 },
    isSpread: false,
    gutterWidth: 0
  },
  a5: {
    id: 'a5',
    name: 'A5',
    noBleed: { width: 5.83, height: 8.27 },
    withBleed: { width: 6.08, height: 8.52 },
    isSpread: false,
    gutterWidth: 0
  },
  royal: {
    id: 'royal',
    name: 'Royal',
    noBleed: { width: 6.14, height: 9.21 },
    withBleed: { width: 6.39, height: 9.46 },
    isSpread: false,
    gutterWidth: 0
  },
  usTrade: {
    id: 'usTrade',
    name: 'US Trade',
    noBleed: { width: 6, height: 9 },
    withBleed: { width: 6.25, height: 9.25 },
    isSpread: false,
    gutterWidth: 0
  },
  comicBook: {
    id: 'comicBook',
    name: 'Comic Book',
    noBleed: { width: 6.63, height: 10.25 },
    withBleed: { width: 6.88, height: 10.5 },
    isSpread: false,
    gutterWidth: 0
  },
  // Spreads (for covers)
  pocketbookSpread: {
    id: 'pocketbookSpread',
    name: 'Pocketbook Cover',
    noBleed: { width: 8.5, height: 6.875 },
    withBleed: { width: 9, height: 7.125 },
    isSpread: true,
    gutterWidth: 0.125,
    spineWidth: 0
  },
  digestSpread: {
    id: 'digestSpread',
    name: 'Digest Cover',
    noBleed: { width: 11, height: 8.5 },
    withBleed: { width: 11.5, height: 8.75 },
    isSpread: true,
    gutterWidth: 0.125,
    spineWidth: 0
  }
};

// Gutter width based on page count (from Lulu guide)
export const getGutterWidth = (pageCount: number): number => {
  if (pageCount < 60) return 0;
  if (pageCount <= 150) return 0.125;
  if (pageCount <= 400) return 0.5;
  if (pageCount <= 600) return 0.625;
  return 0.75;
};

// Spine width calculation for paperback (from Lulu guide)
export const calculatePaperbackSpineWidth = (pageCount: number): number => {
  return (pageCount / 444) + 0.06;
};

// Spine width calculation for hardcover (from Lulu guide)
export const calculateHardcoverSpineWidth = (pageCount: number): number => {
  if (pageCount < 24) return 0;
  if (pageCount <= 84) return 0.25;
  if (pageCount <= 140) return 0.5;
  if (pageCount <= 168) return 0.625;
  if (pageCount <= 194) return 0.688;
  if (pageCount <= 222) return 0.75;
  if (pageCount <= 250) return 0.813;
  if (pageCount <= 278) return 0.875;
  if (pageCount <= 306) return 0.938;
  if (pageCount <= 334) return 1.0;
  if (pageCount <= 360) return 1.063;
  if (pageCount <= 388) return 1.125;
  if (pageCount <= 416) return 1.188;
  if (pageCount <= 444) return 1.25;
  if (pageCount <= 472) return 1.313;
  if (pageCount <= 500) return 1.375;
  if (pageCount <= 528) return 1.438;
  if (pageCount <= 556) return 1.5;
  if (pageCount <= 582) return 1.563;
  return 1.625; // For page counts > 582
};
