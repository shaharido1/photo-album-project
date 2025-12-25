/**
 * Layout Templates for Photo Album Editor
 * Position/size values are percentages (0-100) of the page dimensions
 */

const layoutTemplates = [
  {
    id: 'single',
    name: 'Single Photo',
    description: 'Full page single photo',
    slotCount: 1,
    slots: [{ x: 2, y: 2, width: 96, height: 96 }],
  },
  {
    id: 'single-margin',
    name: 'Single (Margins)',
    description: 'Single photo with larger margins',
    slotCount: 1,
    slots: [{ x: 10, y: 10, width: 80, height: 80 }],
  },
  {
    id: '2-horizontal',
    name: 'Two Horizontal',
    description: 'Two photos side by side',
    slotCount: 2,
    slots: [
      { x: 2, y: 2, width: 47, height: 96 },
      { x: 51, y: 2, width: 47, height: 96 },
    ],
  },
  {
    id: '2-vertical',
    name: 'Two Vertical',
    description: 'Two photos stacked vertically',
    slotCount: 2,
    slots: [
      { x: 2, y: 2, width: 96, height: 47 },
      { x: 2, y: 51, width: 96, height: 47 },
    ],
  },
  {
    id: '3-left',
    name: 'Three (Large Left)',
    description: 'One large on left, two small on right',
    slotCount: 3,
    slots: [
      { x: 2, y: 2, width: 60, height: 96 },
      { x: 64, y: 2, width: 34, height: 47 },
      { x: 64, y: 51, width: 34, height: 47 },
    ],
  },
  {
    id: '3-top',
    name: 'Three (Large Top)',
    description: 'One large on top, two small on bottom',
    slotCount: 3,
    slots: [
      { x: 2, y: 2, width: 96, height: 60 },
      { x: 2, y: 64, width: 47, height: 34 },
      { x: 51, y: 64, width: 47, height: 34 },
    ],
  },
  {
    id: '4-grid',
    name: 'Four Grid',
    description: '2x2 grid layout',
    slotCount: 4,
    slots: [
      { x: 2, y: 2, width: 47, height: 47 },
      { x: 51, y: 2, width: 47, height: 47 },
      { x: 2, y: 51, width: 47, height: 47 },
      { x: 51, y: 51, width: 47, height: 47 },
    ],
  },
  {
    id: '6-grid',
    name: 'Six Grid',
    description: '2x3 grid layout',
    slotCount: 6,
    slots: [
      { x: 2, y: 2, width: 47, height: 30 },
      { x: 51, y: 2, width: 47, height: 30 },
      { x: 2, y: 34, width: 47, height: 30 },
      { x: 51, y: 34, width: 47, height: 30 },
      { x: 2, y: 66, width: 47, height: 32 },
      { x: 51, y: 66, width: 47, height: 32 },
    ],
  },
];

export function getLayoutById(layoutId) {
  return layoutTemplates.find((layout) => layout.id === layoutId) || null;
}

export function getAllLayouts() {
  return layoutTemplates;
}

export function getLayoutSlots(layoutId) {
  const layout = getLayoutById(layoutId);
  return layout ? layout.slots : null;
}

export function getLayoutSlotCount(layoutId) {
  const layout = getLayoutById(layoutId);
  return layout ? layout.slotCount : null;
}

export default layoutTemplates;
