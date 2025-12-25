/**
 * Layout Template Type Definitions
 * Types for page layout templates
 */

// Layout slot definition (positions are percentages 0-100)
export interface LayoutSlot {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Layout template
export interface LayoutTemplate {
  id: string;
  name: string;
  description: string;
  slotCount: number;
  slots: LayoutSlot[];
}
