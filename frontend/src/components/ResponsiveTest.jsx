import { useResponsive } from '../hooks/useResponsive';

const ResponsiveTest = () => {
  const { width, height, scaleFactor, isMobile, isTablet, isDesktop } = useResponsive();

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: 'var(--space-4, 16px)',
      borderRadius: 'var(--radius-md, 8px)',
      fontSize: 'var(--font-sm, 12px)',
      zIndex: 9999,
      fontFamily: 'monospace'
    }}>
      <div>Screen: {width}x{height}</div>
      <div>Scale: {scaleFactor.toFixed(2)}</div>
      <div>Device: {isMobile ? 'Mobile' : isTablet ? 'Tablet' : 'Desktop'}</div>
      <div>CSS Scale: var(--scale-factor)</div>
    </div>
  );
};

export default ResponsiveTest;