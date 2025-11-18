import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const StatsCard = ({ title, value, icon, color, trend, delay = 0, onClick, isMobile = false }) => {
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      const duration = 1000;
      const steps = 60;
      const increment = value / steps;
      let current = 0;

      const counter = setInterval(() => {
        current += increment;
        if (current >= value) {
          setAnimatedValue(value);
          clearInterval(counter);
        } else {
          setAnimatedValue(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(counter);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={onClick ? { y: -4, scale: 1.01 } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
      transition={{ duration: 0.3, delay: delay / 1000 }}
      onClick={onClick}
      style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: '20px',
        padding: isMobile ? '20px' : 'var(--space-8, 32px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        width: '100%',
        boxSizing: 'border-box'
      }}>


      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '16px'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white'
          }}>
            {icon}
          </div>
          {trend && !isMobile && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: trend > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              color: trend > 0 ? '#10b981' : '#ef4444',
              fontSize: '12px',
              fontWeight: '600',
              padding: '6px 10px',
              borderRadius: '20px',
              border: `1px solid ${trend > 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
              boxShadow: `0 2px 8px ${trend > 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'}`
            }}>
              {trend > 0 ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7,14L12,9L17,14H7Z"/>
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7,10L12,15L17,10H7Z"/>
                </svg>
              )}
              <span>{Math.abs(trend)}</span>
            </div>
          )}
        </div>

        <div style={{
          fontSize: isMobile ? '32px' : 'var(--font-3xl, 32px)',
          fontWeight: '800',
          color: '#0f172a',
          marginBottom: '8px',
          fontFamily: '"SF Pro Display", -apple-system, sans-serif'
        }}>
          {animatedValue.toLocaleString()}
        </div>

        <div style={{
          color: '#64748b',
          fontSize: isMobile ? '14px' : 'var(--font-sm, 14px)',
          fontWeight: '500',
          fontFamily: '"SF Pro Text", -apple-system, sans-serif',
          letterSpacing: '0.025em'
        }}>
          {title}
        </div>
      </div>
    </motion.div>
  );
};

export default StatsCard;