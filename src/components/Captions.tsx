import { useCurrentFrame, useVideoConfig, spring, AbsoluteFill } from 'remotion';
import { createTikTokStyleCaptions, TikTokPage } from '@remotion/captions';
import React, { useMemo } from 'react';
import { Caption } from '../types';

interface CaptionsProps {
  captions: Caption[];
  combineTokensWithinMs?: number;
  activeColor?: string;
  inactiveColor?: string;
  textColor?: string;
  outlineColor?: string;
  fontSize?: number;
  fontFamily?: string;
}

export const Captions: React.FC<CaptionsProps> = ({
  captions,
  combineTokensWithinMs = 400,
  activeColor = '#FFD700',
  inactiveColor = '#FFFFFF',
  textColor = '#FFFFFF',
  outlineColor = '#000000',
  fontSize = 42,
  fontFamily = 'Inter',
}) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const timeInMs = (frame / fps) * 1000;

  const tikTokPages = useMemo(() => {
    const result = createTikTokStyleCaptions({
      captions,
      combineTokensWithinMilliseconds: combineTokensWithinMs,
    });
    return result.pages;
  }, [captions, combineTokensWithinMs]);

  const currentPage = useMemo(() => {
    return tikTokPages.find(
      (page: TikTokPage) =>
        timeInMs >= page.tokens[0].fromMs &&
        timeInMs <= page.tokens[page.tokens.length - 1].toMs
    );
  }, [tikTokPages, timeInMs]);

  if (!currentPage) return null;

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-end',
        alignItems: 'center',
        bottom: 200,
        paddingLeft: 40,
        paddingRight: 40,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          maxWidth: width - 80,
        }}
      >
        {currentPage.tokens.map((token, i) => {
          const isActive = timeInMs >= token.fromMs && timeInMs <= token.toMs;

          const scale = spring({
            frame: frame - (token.fromMs / 1000) * fps,
            fps,
            config: { damping: 15, stiffness: 200 },
          });

          const scaleValue = isActive ? 1 + scale * 0.1 : 1;

          return (
            <span
              key={i}
              style={{
                fontSize: fontSize,
                fontFamily,
                color: isActive ? activeColor : inactiveColor,
                textShadow: `
                  -2px -2px 0 ${outlineColor},
                  2px -2px 0 ${outlineColor},
                  -2px 2px 0 ${outlineColor},
                  2px 2px 0 ${outlineColor},
                  0px 2px 4px ${outlineColor}80
                `,
                transform: `scale(${scaleValue})`,
                display: 'inline-block',
                margin: '0 4px',
                transition: 'color 0.1s ease',
              }}
            >
              {token.text}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
