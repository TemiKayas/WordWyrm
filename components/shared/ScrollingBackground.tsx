interface ScrollingBackgroundProps {
  children: React.ReactNode;
}

export default function ScrollingBackground({ children }: ScrollingBackgroundProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#b8e6f0] to-[#7dd3e8]">
      {/* Sky - Static background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#b8e6f0] to-[#7dd3e8]" />

      {/* Clouds Layer - Slow scroll */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="clouds-scroll">
          <div
            className="absolute top-0 h-[30vh] w-[200vw]"
            style={{
              backgroundImage: 'url(/assets/join/clouds.png)',
              backgroundRepeat: 'repeat-x',
              backgroundSize: 'auto 100%',
            }}
          />
          <div
            className="absolute top-0 h-[30vh] w-[200vw]"
            style={{
              backgroundImage: 'url(/assets/join/clouds.png)',
              backgroundRepeat: 'repeat-x',
              backgroundSize: 'auto 100%',
              left: '200vw',
            }}
          />
        </div>
      </div>

      {/* Content Layer */}
      <div className="relative z-10">
        {children}
      </div>

      {/* Trees Layer - Fast scroll (foreground) */}
      <div className="absolute bottom-0 left-0 right-0 overflow-hidden h-[50vh] pointer-events-none z-20">
        <div className="trees-scroll">
          <div
            className="absolute bottom-0 h-full w-[200vw]"
            style={{
              backgroundImage: 'url(/assets/join/trees.png)',
              backgroundRepeat: 'repeat-x',
              backgroundSize: 'cover',
              backgroundPosition: 'bottom',
            }}
          />
          <div
            className="absolute bottom-0 h-full w-[200vw]"
            style={{
              backgroundImage: 'url(/assets/join/trees.png)',
              backgroundRepeat: 'repeat-x',
              backgroundSize: 'cover',
              backgroundPosition: 'bottom',
              left: '200vw',
            }}
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes scroll-clouds {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-200vw);
          }
        }

        @keyframes scroll-trees {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-200vw);
          }
        }

        .clouds-scroll {
          animation: scroll-clouds 60s linear infinite;
          width: 400vw;
          height: 30vh;
          position: absolute;
          top: 0;
        }

        .trees-scroll {
          animation: scroll-trees 25s linear infinite;
          width: 400vw;
          height: 50vh;
          position: absolute;
          bottom: 0;
        }
      `}</style>
    </div>
  );
}
