export enum HighlightType {
  UNDERLINE = 'underline',
  GLOSSARY = 'glossary'
}

export interface PDFCoordinate {
  left: number;
  top: number;
  width: number;
  height: number;
  pageIndex: number;
}

export interface Highlight {
  id: string;
  type: HighlightType;
  page: number
  content: string;
  coords: PDFCoordinate;
  roomId: string;
}