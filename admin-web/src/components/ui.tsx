// Minimal shared admin UI primitives.
import React from 'react';

export const colors = {
  gold: '#D4A026',
  goldLight: '#F2C94C',
  bg: '#0A0F1F',
  card: '#13203B',
  text: '#F5F3EC',
  dim: '#9AA6BF',
  border: '#1E2C4A',
};

export const Card: React.FC<React.PropsWithChildren<{ style?: React.CSSProperties }>> = ({ children, style }) => (
  <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 16, marginBottom: 16, ...style }}>
    {children}
  </div>
);

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ style, ...p }) => (
  <button
    {...p}
    style={{ background: colors.gold, color: '#0B1E3F', border: 'none', borderRadius: 8, padding: '10px 16px', fontWeight: 700, cursor: 'pointer', ...style }}
  />
);

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ style, ...p }) => (
  <input
    {...p}
    style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: 8, padding: 10, margin: '4px 0', width: '100%', boxSizing: 'border-box', ...style }}
  />
);

export const Field: React.FC<React.PropsWithChildren<{ label: string }>> = ({ label, children }) => (
  <label style={{ display: 'block', marginBottom: 8 }}>
    <span style={{ color: colors.dim, fontSize: 13 }}>{label}</span>
    {children}
  </label>
);
