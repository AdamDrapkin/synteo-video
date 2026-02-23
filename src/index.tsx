import { registerRoot, Composition } from 'remotion';
import React from 'react';
import { SocialClip } from './compositions/SocialClip';
import { DEFAULT_PROPS, SocialClipPropsSchema } from './types';

const App: React.FC = () => {
  return (
    <Composition
      id="SocialClip"
      component={SocialClip}
      defaultProps={DEFAULT_PROPS}
      schema={SocialClipPropsSchema}
      durationInFrames={300}
      fps={30}
      width={1080}
      height={1920}
    />
  );
};

registerRoot(App);
