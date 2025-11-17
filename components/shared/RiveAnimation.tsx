import { useRive } from '@rive-app/react-canvas';

interface RiveAnimationProps {
  src: string;
  width?: string;
  height?: string;
  className?: string;
}

export default function RiveAnimation({
  src,
  width = '100%',
  height = '400px',
  className = ''
}: RiveAnimationProps) {
  const { RiveComponent } = useRive({
    src: src,
    autoplay: true,
  });

  return (
    <div
      style={{
        width,
        height,
        background: 'transparent'
      }}
      className={className}
    >
      <RiveComponent style={{ background: 'transparent' }} />
    </div>
  );
}
