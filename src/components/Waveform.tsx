import { useCurrentFrame, useVideoConfig, spring, AbsoluteFill } from 'remotion';
import React, { useMemo } from 'react';

interface WaveformProps {
  barCount?: number;
  barWidth?: number;
  barGap?: number;
  startFrame?: number;
  color?: string;
  height?: number;
}

// Simple animated waveform bars (placeholder until audio integration is working)
export const Waveform: React.FC<WaveformProps> = ({
  barCount = 48,
  barWidth = 8,
  barGap = 4,
  startFrame = 15,
  color = '#00D4FF',
  height = 120,
}) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();

  const isVisible = frame >= startFrame;

  const animatedOpacity = spring({
    frame: frame - startFrame,
    fps,
    config: { damping: 14, stiffness: 120 },
  });

  // Generate animated bar heights based on frame
  const bars = useMemo(() => {
    return Array.from({ length: barCount }, (_, i) => {
      const progress = frame / fps;
      const base = Math.sin(progress * 3 + i * 0.15) * 0.5 + 0.5;
      const variation = Math.sin(progress * 7 + i * 0.3) * 0.3;
      return Math.max(0.2, Math.min(1, base + variation));
    });
  }, [frame, fps, barCount]);

  if (!isVisible) return null;

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-end',
        alignItems: 'center',
        bottom: 40,
        pointerEvents: 'none',
      }}
    >
      <div style={{ opacity: animatedOpacity, display: 'flex', gap: barGap }}>
        {bars.map((amplitude, i) => {
          const barHeight = Math.max(amplitude * height * 0.8, 4);
          return (
            <div
              key={i}
              style={{
                width: barWidth,
                height: barHeight,
                backgroundColor: color,
                borderRadius: barWidth / 2,
                boxShadow: `0 0 8px ${color}40`,
              }}
            />
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
