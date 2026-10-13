import React from 'react';

export const AppleDotsRing: React.FC = () => {
  const dots: Array<{ cx: number; cy: number; r: number; color: string }> = [];
  const rings = [
    { count: 12, radius: 24, size: 2.2 },
    { count: 18, radius: 34, size: 2.5 },
    { count: 24, radius: 44, size: 2.8 },
  ];

  rings.forEach((ring) => {
    for (let i = 0; i < ring.count; i++) {
      const angle = (i / ring.count) * 2 * Math.PI - Math.PI / 2;
      const cx = 60 + ring.radius * Math.cos(angle);
      const cy = 60 + ring.radius * Math.sin(angle);
      const hue = Math.round((i / ring.count) * 360);
      dots.push({
        cx,
        cy,
        r: ring.size,
        color: `hsl(${hue}, 85%, 65%)`,
      });
    }
  });

  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
      {dots.map((d, idx) => (
        <circle key={idx} cx={d.cx} cy={d.cy} r={d.r} fill={d.color} opacity={0.85} />
      ))}
    </svg>
  );
};
