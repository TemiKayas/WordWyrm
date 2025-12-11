'use client';

import Image from 'next/image';

type Character = {
  id: number;
  name: string;
  rarity: 'mythic' | 'legendary' | 'epic' | 'rare' | 'common';
  image: string;
  bgColor: string;
};

type CharacterShelfProps = {
  characters: Character[];
  unlockedCharacters: number[];
  topPosition: number;
};

export default function CharacterShelf({ characters, unlockedCharacters, topPosition }: CharacterShelfProps) {
  return (
    <div className={`absolute left-[350px] w-[1000px] h-[400px]`} style={{ top: `${topPosition}px` }}>
      {/* Shelf Image */}
      <Image
        src="/assets/shop/shelf.png"
        alt="Shelf"
        fill
        className="object-fit"
      />

      {/* Character Bubbles - 4 per shelf, sitting flush on top of shelf */}
      <div className="absolute top-0 left-0 right-0 flex justify-around px-12">
        {characters.map((char) => {
          const unlocked = unlockedCharacters.includes(char.id);
          return (
            <div
              key={char.id}
              className="w-[80px] h-[80px] rounded-full border-[3px] border-[#473025] flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer"
              style={{ background: unlocked ? char.bgColor : '#b58975' }}
              title={unlocked ? char.name : '???'}
            >
              {unlocked ? (
                <Image
                  src={char.image}
                  alt={char.name}
                  width={55}
                  height={55}
                  className="w-[55px] h-[55px] object-contain"
                />
              ) : (
                <span className="text-white font-quicksand font-bold text-[36px]">?</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
