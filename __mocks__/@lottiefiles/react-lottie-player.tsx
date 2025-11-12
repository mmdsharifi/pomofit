export type PlayerEvent = any;

export const Player = ({ children }: { children?: React.ReactNode }) => {
  return <div data-testid="lottie-player">{children}</div>;
};

export default Player;
