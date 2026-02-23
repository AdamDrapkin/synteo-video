import { useCurrentFrame, useVideoConfig, spring, AbsoluteFill, Video, Audio } from 'remotion';
import React, { useMemo } from 'react';
import { z } from 'zod';
import { SocialClipPropsSchema } from '../types';
import { Waveform } from '../components/Waveform';
import { Captions } from '../components/Captions';

export const compositionId = 'SocialClip';

const FPS = 30;
const WIDTH = 1080;
const HEIGHT = 1920;

export const SocialClip: React.FC<z.infer<typeof SocialClipPropsSchema>> = ({
  hookClipUrl,
  mainClipUrl,
  captionData,
  campaignTag,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const timeInSeconds = frame / fps;

  // Switch from hook to main at 3 seconds (90 frames)
  const switchFrame = 90;
  const isHookPhase = frame < switchFrame;

  // Current video URL based on phase
  const currentVideoUrl = isHookPhase ? hookClipUrl : mainClipUrl;

  // Campaign tag appears at 2.8 seconds (84 frames)
  const tagStartFrame = 84;
  const isTagVisible = frame >= tagStartFrame;

  const tagOpacity = spring({
    frame: frame - tagStartFrame,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  // Campaign tag styling
  const tagStyle: React.CSSProperties = {
    position: 'absolute' as const,
    bottom: 280,
    left: '50%',
    transform: 'translateX(-50%)',
    fontSize: 28,
    fontFamily: 'Inter, sans-serif',
    fontWeight: 600,
    color: '#FFFFFF',
    textShadow: `
      -2px -2px 0 #000000,
      2px -2px 0 #000000,
      -2px 2px 0 #000000,
      2px 2px 0 #000000
    `,
    opacity: tagOpacity,
    textAlign: 'center' as const,
    whiteSpace: 'nowrap' as const,
  };

  return (
    <AbsoluteFill style={{ backgroundColor: '#000000' }}>
      {/* Main video layer */}
      {currentVideoUrl && (
        <Video
          src={currentVideoUrl}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )}

      {/* Audio and waveform - use main clip audio after switch */}
      {mainClipUrl && (
        <>
          <Audio src={mainClipUrl} />
          <Waveform
            barCount={48}
            startFrame={15}
            color="#00D4FF"
            height={100}
          />
        </>
      )}

      {/* TikTok-style captions */}
      <Captions
        captions={captionData}
        combineTokensWithinMs={400}
        activeColor="#FFD700"
        inactiveColor="#FFFFFF"
        textColor="#FFFFFF"
        outlineColor="#000000"
        fontSize={42}
      />

      {/* Campaign tag overlay */}
      {isTagVisible && (
        <div style={tagStyle}>
          {campaignTag}
        </div>
      )}
    </AbsoluteFill>
  );
};

export const defaultProps = {
  hookClipUrl: '',
  mainClipUrl: '',
  captionData: [],
  campaignTag: '@synteo #ContentRewards',
  aspectRatio: '9:16' as const,
};

export const schema = SocialClipPropsSchema;
