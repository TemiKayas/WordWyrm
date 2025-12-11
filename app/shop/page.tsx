'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import TeacherPageLayout from '@/components/shared/TeacherPageLayout';
import CharacterShelf from '@/components/shop/CharacterShelf';
import ShopkeeperSection from '@/components/shop/ShopkeeperSection';

type Character = {
  id: number;
  name: string;
  rarity: 'mythic' | 'legendary' | 'epic' | 'rare' | 'common';
  image: string;
  bgColor: string;
};

const CHARACTERS: Character[] = [
  { id: 1, name: 'Golden', rarity: 'mythic', image: '/assets/dashboard/woah-floopa.png', bgColor: '#FFD700' },
  { id: 2, name: 'Purple', rarity: 'legendary', image: '/assets/login/welcome-floopa.png', bgColor: '#A855F7' },
  { id: 3, name: 'Red', rarity: 'legendary', image: '/assets/landing/floopa-wrong-answer.png', bgColor: '#EF4444' },
  { id: 4, name: 'Blue', rarity: 'epic', image: '/assets/landing/floopa-correct-answer.png', bgColor: '#3B82F6' },
  { id: 5, name: 'Dark', rarity: 'epic', image: '/assets/onboarding/27f0bc773218feb1f33fcb7da210f02c61215925.png', bgColor: '#374151' },
  { id: 6, name: 'Amber', rarity: 'epic', image: '/assets/onboarding/4e9b715f5084e888d240a18368dbfaab69eb1299.png', bgColor: '#F59E0B' },
  { id: 7, name: 'Green', rarity: 'rare', image: '/assets/onboarding/8e89875a574638f8c7324ec764e151aae13edc02.png', bgColor: '#10B981' },
  { id: 8, name: 'Indigo', rarity: 'rare', image: '/assets/onboarding/c7d97bc4f08e16c5bf0692b8a1696dd9b6696103.png', bgColor: '#6366F1' },
  { id: 9, name: 'Pink', rarity: 'rare', image: '/assets/dashboard/floopa-character.png', bgColor: '#EC4899' },
  { id: 10, name: 'Teal', rarity: 'common', image: '/assets/landing/floopa-mascot-small.png', bgColor: '#14B8A6' },
  { id: 11, name: 'Gray', rarity: 'common', image: '/assets/dashboard/floopa-character.png', bgColor: '#6B7280' },
  { id: 12, name: 'Brown', rarity: 'common', image: '/assets/login/welcome-floopa.png', bgColor: '#92400E' },
  { id: 13, name: 'Lime', rarity: 'common', image: '/assets/login/welcome-floopa.png', bgColor: '#84CC16' },
  { id: 14, name: 'Cyan', rarity: 'common', image: '/assets/landing/floopa-wrong-answer.png', bgColor: '#06B6D4' },
  { id: 15, name: 'Rose', rarity: 'rare', image: '/assets/landing/floopa-correct-answer.png', bgColor: '#F43F5E' },
  { id: 16, name: 'Violet', rarity: 'rare', image: '/assets/onboarding/27f0bc773218feb1f33fcb7da210f02c61215925.png', bgColor: '#8B5CF6' },
  { id: 17, name: 'Emerald', rarity: 'epic', image: '/assets/onboarding/4e9b715f5084e888d240a18368dbfaab69eb1299.png', bgColor: '#10B981' },
  { id: 18, name: 'Sky', rarity: 'epic', image: '/assets/onboarding/8e89875a574638f8c7324ec764e151aae13edc02.png', bgColor: '#0EA5E9' },
  { id: 19, name: 'Fuchsia', rarity: 'legendary', image: '/assets/onboarding/c7d97bc4f08e16c5bf0692b8a1696dd9b6696103.png', bgColor: '#D946EF' },
  { id: 20, name: 'Rainbow', rarity: 'mythic', image: '/assets/dashboard/floopa-character.png', bgColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
];

const RARITY_RATES: Record<Character['rarity'], number> = {
  mythic: 0.01,
  legendary: 0.04,
  epic: 0.15,
  rare: 0.30,
  common: 0.50,
};

export default function ShopPage() {
  const [coins, setCoins] = useState(700);
  const [unlockedCharacters, setUnlockedCharacters] = useState<number[]>([1]);
  const [openingBox, setOpeningBox] = useState(false);
  const [revealedCharacter, setRevealedCharacter] = useState<Character | null>(null);
  const [showBoxResult, setShowBoxResult] = useState(false);

  useEffect(() => {
    const savedCoins = localStorage.getItem('userCoins');
    const savedUnlocked = localStorage.getItem('unlockedCharacters');
    if (savedCoins) setCoins(parseInt(savedCoins));
    if (savedUnlocked) setUnlockedCharacters(JSON.parse(savedUnlocked));
  }, []);

  useEffect(() => {
    localStorage.setItem('userCoins', coins.toString());
  }, [coins]);

  useEffect(() => {
    localStorage.setItem('unlockedCharacters', JSON.stringify(unlockedCharacters));
  }, [unlockedCharacters]);

  const drawCharacter = (): Character => {
    const rand = Math.random();
    let rarity: Character['rarity'] = 'common';

    if (rand < RARITY_RATES.mythic) {
      rarity = 'mythic';
    } else if (rand < RARITY_RATES.mythic + RARITY_RATES.legendary) {
      rarity = 'legendary';
    } else if (rand < RARITY_RATES.mythic + RARITY_RATES.legendary + RARITY_RATES.epic) {
      rarity = 'epic';
    } else if (rand < RARITY_RATES.mythic + RARITY_RATES.legendary + RARITY_RATES.epic + RARITY_RATES.rare) {
      rarity = 'rare';
    }

    const available = CHARACTERS.filter((c) => c.rarity === rarity);
    return available[Math.floor(Math.random() * available.length)];
  };

  const openBox = () => {
    if (coins < 100 || openingBox) return;
    setCoins((prev) => prev - 100);
    setOpeningBox(true);
    const newChar = drawCharacter();
    setRevealedCharacter(newChar);

    setTimeout(() => {
      setOpeningBox(false);
      setShowBoxResult(true);
      setUnlockedCharacters((prev) =>
        prev.includes(newChar.id) ? prev : [...prev, newChar.id]
      );
    }, 2000);
  };

  return (
    <TeacherPageLayout>
      <div className="relative w-full h-[calc(100vh-64px)] bg-[#fffaf2] overflow-hidden">
        {/* Sign - Hanging off top */}
        <div className="absolute left-1/4 -translate-x-1/2 -top-[60px] w-[325px] h-[225px] z-[100] hidden lg:block transition-all duration-300">
          <Image
            src="/assets/shop/Sign.svg"
            alt="Shop Sign"
            fill
            className="object-contain"
          />
        </div>

        {/* Shopa.gif Background - LHS, full height, hidden on mobile */}
        <div className="hidden lg:block absolute left-0 bottom-0 w-[78%] h-full z-0 transition-all duration-300">
          <Image
            src="/assets/shop/Shopa.gif"
            alt="Shop Background"
            fill
            className="object-contain object-left-bottom"
            priority
            unoptimized
          />
        </div>

        {/* Speech Bubble - positioned in upper area */}
        <div className="hidden lg:block absolute top-[120px] left-[25%] w-[330px] h-[220px] z-[50] transition-all duration-300">
          <Image
            src="/assets/shop/chat.svg"
            alt="Speech bubble"
            fill
            className="object-contain"
          />
        </div>


        {/* Content Container */}
        <div className="relative flex flex-col lg:flex-row justify-center lg:justify-end mx-auto pt-8 lg:pt-0 h-full lg:pr-8">
          {/* Collection - Right Side */}
          <div className="relative w-full max-w-[550px] flex flex-col p-6 lg:p-8 bg-[#fffaf2] z-10">
            {/* Header with Collection and Coins */}
            <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <h1 className="font-quicksand font-bold text-[28px] md:text-[32px] text-[#473025]">
                  Your Collection
                </h1>
                <div className="bg-[#fd9227] rounded-full h-[38px] px-4 flex items-center justify-center">
                  <p className="font-quicksand font-bold text-white text-[18px] md:text-[21px]">
                    {unlockedCharacters.length}/12
                  </p>
                </div>
              </div>

              {/* Coins Display */}
              <div className="bg-[#fffcf8] border-[#473025] border-[3px] rounded-full h-[56px] md:h-[63px] px-4 flex items-center justify-center gap-2">
                <Image
                  src="/assets/shop/b5537993144d95b93a959b526aa2e8089401a375.png"
                  alt="Coin"
                  width={49}
                  height={49}
                  className="w-[40px] h-[40px] md:w-[49px] md:h-[49px]"
                />
                <p className="font-quicksand font-bold text-[28px] md:text-[32px] text-[#473025]">
                  {coins}
                </p>
              </div>
            </div>

            {/* Character Grid - Simplified */}
            <div className="grid grid-cols-4 gap-2 md:gap-4 mb-4 max-w-[450px]">
              {CHARACTERS.slice(0, 12).map((char) => {
                const unlocked = unlockedCharacters.includes(char.id);
                return (
                  <div
                    key={char.id}
                    className="aspect-square rounded-full border-[3px] border-[#473025] flex items-center justify-center shadow-md hover:scale-110 transition-transform cursor-pointer"
                    style={{ background: unlocked ? char.bgColor : '#b58975' }}
                    title={unlocked ? char.name : '???'}
                  >
                    {unlocked ? (
                      <Image
                        src={char.image}
                        alt={char.name}
                        width={100}
                        height={100}
                        className="w-[75%] h-[75%] object-fill object-center"
                      />
                    ) : (
                      <span className="text-white font-quicksand font-bold text-[24px] md:text-[32px]">?</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Buy Box Button - Desktop centered under collection */}
            <div className="hidden lg:flex mt-6 justify-center">
              <button
                onClick={openBox}
                disabled={coins < 100 || openingBox}
                className={`bg-[#95b607] border-[#006029] border-[3px] rounded-[14px] w-[210px] h-[104px] flex flex-col items-center justify-center shadow-[0px_0px_22px_0px_rgba(0,0,0,0.53),0px_4px_0px_0px_#006029] hover:shadow-[0px_0px_15px_0px_rgba(0,0,0,0.4),0px_2px_0px_0px_#006029] hover:translate-y-[2px] active:shadow-[0px_0px_10px_0px_rgba(0,0,0,0.3),0px_1px_0px_0px_#006029] active:translate-y-[3px] transition-all ${
                  coins < 100 || openingBox ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                <p className="font-quicksand font-bold text-white text-[28px] text-center mb-2">
                  {openingBox ? 'OPENING...' : 'BUY BOX'}
                </p>
                <div className="bg-[rgba(0,96,41,0.26)] rounded-full h-[32px] w-[157px] flex items-center justify-center gap-1">
                  <span className="font-quicksand font-bold text-white text-[13px]">x</span>
                  <Image
                    src="/assets/shop/coin.png"
                    alt="Coin"
                    width={25}
                    height={25}
                    className="w-[25px] h-[25px]"
                  />
                  <span className="font-quicksand font-bold text-white text-[18px]">100</span>
                </div>
              </button>
            </div>

            {/* Buy Box Button - Mobile only */}
            <div className="lg:hidden mt-6 flex justify-center">
              <button
                onClick={openBox}
                disabled={coins < 100 || openingBox}
                className={`bg-[#95b607] border-[#006029] border-[3px] rounded-[14px] w-[200px] h-[100px] flex flex-col items-center justify-center shadow-[0px_0px_22px_0px_rgba(0,0,0,0.53),0px_4px_0px_0px_#006029] hover:shadow-[0px_0px_15px_0px_rgba(0,0,0,0.4),0px_2px_0px_0px_#006029] hover:translate-y-[2px] active:shadow-[0px_0px_10px_0px_rgba(0,0,0,0.3),0px_1px_0px_0px_#006029] active:translate-y-[3px] transition-all ${
                  coins < 100 || openingBox ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                <p className="font-quicksand font-bold text-white text-[26px] text-center mb-2">
                  {openingBox ? 'OPENING...' : 'BUY BOX'}
                </p>
                <div className="bg-[rgba(0,96,41,0.26)] rounded-full h-[32px] w-[150px] flex items-center justify-center gap-1">
                  <span className="font-quicksand font-bold text-white text-[13px]">x</span>
                  <Image
                    src="/assets/shop/coin.png"
                    alt="Coin"
                    width={25}
                    height={25}
                    className="w-[25px] h-[25px]"
                  />
                  <span className="font-quicksand font-bold text-white text-[18px]">100</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Opening Animation Modal */}
        {openingBox && (
          <div className="fixed inset-0 z-[1000] bg-black/80 flex items-center justify-center">
            <div className="text-center">
              <div className="relative w-64 h-64">
                <div className="absolute inset-0 bg-gradient-to-b from-[#95b607] to-[#638500] border-[4px] border-[#006029] rounded-[16px] flex items-center justify-center animate-pulse">
                  <span className="text-white text-[6rem] font-quicksand font-bold">?</span>
                </div>
              </div>
              <p className="mt-6 text-white font-quicksand text-[1.75rem] font-bold animate-pulse">
                Opening Box...
              </p>
            </div>
          </div>
        )}

        {/* Result Modal */}
        {showBoxResult && revealedCharacter && (
          <div className="fixed inset-0 z-[1000] bg-black/80 flex items-center justify-center p-4">
            <div className="bg-[#fffaf2] rounded-[20px] border-[4px] border-[#473025] p-8 max-w-md w-full">
              <h2 className="font-quicksand text-[1.75rem] text-[#473025] font-bold text-center mb-4">
                {unlockedCharacters.includes(revealedCharacter.id)
                  ? 'Duplicate Character!'
                  : 'New Character Unlocked!'}
              </h2>

              <div className="flex justify-center my-6">
                <div
                  className="w-48 h-48 rounded-full border-[4px] border-[#473025] flex items-center justify-center p-6"
                  style={{ background: revealedCharacter.bgColor }}
                >
                  <Image
                    src={revealedCharacter.image}
                    alt={revealedCharacter.name}
                    width={120}
                    height={120}
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              <div className="text-center mb-6">
                <h3 className="font-quicksand font-bold text-[1.5rem] text-[#473025] mb-2">
                  {revealedCharacter.name}
                </h3>
                <p className="font-quicksand text-[#9b7651] capitalize">
                  {revealedCharacter.rarity}
                </p>
              </div>

              <button
                onClick={() => {
                  setShowBoxResult(false);
                  setRevealedCharacter(null);
                }}
                className="w-full py-4 bg-[#96b902] border-[3px] border-[#006029] rounded-[12px] text-white font-quicksand text-[1.25rem] font-bold shadow-[0_3px_0_0_#006029] hover:shadow-[0_2px_0_0_#006029] hover:translate-y-[1px] active:shadow-[0_1px_0_0_#006029] active:translate-y-[2px] transition-all"
              >
                Continue
              </button>
            </div>
          </div>
        )}
      </div>
    </TeacherPageLayout>
  );
}
