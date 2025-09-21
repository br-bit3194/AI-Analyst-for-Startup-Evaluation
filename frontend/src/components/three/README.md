# 3D Visualization Components

This directory contains 3D visualization components built with Three.js and React Three Fiber for the Startalytica application.

## Components

### `InvestmentVisualization.tsx`

A 3D visualization component that displays an interactive investment portfolio visualization with:
- A central sphere representing the core portfolio
- Floating 3D icons representing different investment aspects (growth, innovation, analytics, etc.)
- Smooth animations and orbit controls for user interaction
- Responsive design that works across different screen sizes

### `Scene.tsx`

A basic 3D scene component that can be used as a starting point for other 3D visualizations.

## Setup

1. Install the required dependencies:

```bash
npm install three @react-three/fiber @react-three/drei @react-three/postprocessing
```

2. Import and use the components in your React application:

```tsx
import { InvestmentVisualization } from '@/components/three/InvestmentVisualization';

function MyPage() {
  return (
    <div style={{ width: '100%', height: '600px' }}>
      <InvestmentVisualization />
    </div>
  );
}
```

## Customization

### Changing Icons
Edit the `icons` array in `InvestmentVisualization.tsx` to change the emoji icons and their colors.

### Adjusting Animation
Modify the `useFrame` hooks to adjust animation speeds and behaviors.

### Adding New Visualizations
Create new components following the patterns in the existing files, using Three.js and React Three Fiber documentation for reference.

## Performance Considerations

- The 3D scene uses React's Suspense for lazy loading
- Consider using `useMemo` for expensive calculations
- For complex scenes, implement level-of-detail (LOD) techniques

## Browser Support

- Modern browsers with WebGL 2.0 support
- For older browsers, consider adding polyfills or fallback content

## License

MIT
