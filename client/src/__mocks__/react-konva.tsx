import React, { ReactNode } from 'react';

interface MockComponentProps {
  children?: ReactNode;
  [key: string]: unknown;
}

// Mock Stage component
export const Stage = React.forwardRef<HTMLDivElement, MockComponentProps>(
  ({ children, ...props }, ref) => (
    <div ref={ref} data-testid="konva-stage" {...props}>
      {children}
    </div>
  )
);
Stage.displayName = 'Stage';

// Mock Layer component
export const Layer = React.forwardRef<HTMLDivElement, MockComponentProps>(
  ({ children, ...props }, ref) => (
    <div ref={ref} data-testid="konva-layer" {...props}>
      {children}
    </div>
  )
);
Layer.displayName = 'Layer';

// Mock Rect component
export const Rect = React.forwardRef<HTMLDivElement, MockComponentProps>(
  (props, ref) => <div ref={ref} data-testid="konva-rect" {...props} />
);
Rect.displayName = 'Rect';

// Mock Group component
export const Group = React.forwardRef<HTMLDivElement, MockComponentProps>(
  ({ children, ...props }, ref) => (
    <div ref={ref} data-testid="konva-group" {...props}>
      {children}
    </div>
  )
);
Group.displayName = 'Group';

// Mock Image component
export const Image = React.forwardRef<HTMLDivElement, MockComponentProps>(
  (props, ref) => <div ref={ref} data-testid="konva-image" {...props} />
);
Image.displayName = 'Image';

// Mock Transformer component
export const Transformer = React.forwardRef<HTMLDivElement, MockComponentProps>(
  (props, ref) => <div ref={ref} data-testid="konva-transformer" {...props} />
);
Transformer.displayName = 'Transformer';

// Mock Text component
export const Text = React.forwardRef<HTMLDivElement, MockComponentProps>(
  (props, ref) => <div ref={ref} data-testid="konva-text" {...props} />
);
Text.displayName = 'Text';

// Mock Circle component
export const Circle = React.forwardRef<HTMLDivElement, MockComponentProps>(
  (props, ref) => <div ref={ref} data-testid="konva-circle" {...props} />
);
Circle.displayName = 'Circle';

// Mock Line component
export const Line = React.forwardRef<HTMLDivElement, MockComponentProps>(
  (props, ref) => <div ref={ref} data-testid="konva-line" {...props} />
);
Line.displayName = 'Line';

interface MockImage {
  width: number;
  height: number;
}

// Mock useImage hook
export const useImage = (
  url: string | undefined
): [MockImage | null, 'loading' | 'loaded'] => {
  const mockImage: MockImage | null = url ? { width: 100, height: 100 } : null;
  return [mockImage, url ? 'loaded' : 'loading'];
};
