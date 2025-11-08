'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Package, Sparkles, Star, Trophy, Lock, Coins, Crown } from 'lucide-react';
import Button from '@/components/ui/Button';
import BackButton from '@/components/ui/BackButton';
import Image from 'next/image';

// Character data
const CHARACTERS = [
  { id: 1, name: 'Floopa', rarity: 'mythic', emoji: null, image: '/assets/dashboard/floopa-character.png', color: 'from-yellow-400 to-amber-500' },
  { id: 2, name: 'Wizard Wyrm', rarity: 'legendary', emoji: '🧙', image: null, color: 'from-purple-500 to-pink-500' },
  { id: 3, name: 'Dragon Wyrm', rarity: 'legendary', emoji: '🐲', image: null, color: 'from-red-500 to-orange-500' },
  { id: 4, name: 'Knight Wyrm', rarity: 'epic', emoji: '⚔️', image: null, color: 'from-blue-500 to-cyan-500' },
  { id: 5, name: 'Ninja Wyrm', rarity: 'epic', emoji: '🥷', image: null, color: 'from-gray-700 to-gray-900' },
  { id: 6, name: 'Pirate Wyrm', rarity: 'epic', emoji: '🏴‍☠️', image: null, color: 'from-amber-700 to-yellow-600' },
  { id: 7, name: 'Chef Wyrm', rarity: 'rare', emoji: '👨‍🍳', image: null, color: 'from-green-500 to-emerald-500' },
  { id: 8, name: 'Detective Wyrm', rarity: 'rare', emoji: '🕵️', image: null, color: 'from-indigo-500 to-blue-500' },
  { id: 9, name: 'Artist Wyrm', rarity: 'rare', emoji: '🎨', image: null, color: 'from-pink-500 to-rose-500' },
  { id: 10, name: 'Scientist Wyrm', rarity: 'common', emoji: '🔬', image: null, color: 'from-teal-500 to-cyan-500' },
  { id: 11, name: 'Astronaut Wyrm', rarity: 'common', emoji: '🚀', image: null, color: 'from-slate-600 to-gray-700' },
  { id: 12, name: 'Cowboy Wyrm', rarity: 'common', emoji: '🤠', image: null, color: 'from-yellow-700 to-amber-800' },
  { id: 13, name: 'Superhero Wyrm', rarity: 'common', emoji: '🦸', image: null, color: 'from-red-600 to-blue-600' },
];

const RARITY_COLORS = {
  mythic: 'border-yellow-500 bg-yellow-500/10 text-yellow-700',
  legendary: 'border-purple-500 bg-purple-500/10 text-purple-700',
  epic: 'border-blue-500 bg-blue-500/10 text-blue-700',
  rare: 'border-green-500 bg-green-500/10 text-green-700',
  common: 'border-gray-400 bg-gray-400/10 text-gray-700',
};

const RARITY_RATES = {
  mythic: 0.01,
  legendary: 0.04,
  epic: 0.15,
  rare: 0.30,
  common: 0.50,
};

export default function ShopPage() {
  const router = useRouter();
  const [coins, setCoins] = useState(500);
  const [unlockedCharacters, setUnlockedCharacters] = useState<number[]>([1, 9]); // Start with 2 characters
  const [openingPack, setOpeningPack] = useState(false);
  const [revealedCharacters, setRevealedCharacters] = useState<typeof CHARACTERS>([]);
  const [showPackResult, setShowPackResult] = useState(false);

  const openPack = () => {
    if (coins < 100) return;

    setCoins(coins - 100);
    setOpeningPack(true);

    // Simulate pack opening animation
    setTimeout(() => {
      const newCharacters = drawCharacters(3);
      setRevealedCharacters(newCharacters);

      // Add new characters to unlocked list
      const newIds = newCharacters.map(c => c.id).filter(id => !unlockedCharacters.includes(id));
      setUnlockedCharacters([...unlockedCharacters, ...newIds]);

      setOpeningPack(false);
      setShowPackResult(true);
    }, 2000);
  };

  const drawCharacters = (count: number) => {
    const drawn: typeof CHARACTERS = [];

    for (let i = 0; i < count; i++) {
      const rand = Math.random();
      let rarity: 'mythic' | 'legendary' | 'epic' | 'rare' | 'common' = 'common';

      if (rand < RARITY_RATES.mythic) {
        rarity = 'mythic';
      } else if (rand < RARITY_RATES.mythic + RARITY_RATES.legendary) {
        rarity = 'legendary';
      } else if (rand < RARITY_RATES.mythic + RARITY_RATES.legendary + RARITY_RATES.epic) {
        rarity = 'epic';
      } else if (rand < RARITY_RATES.mythic + RARITY_RATES.legendary + RARITY_RATES.epic + RARITY_RATES.rare) {
        rarity = 'rare';
      }

      const availableChars = CHARACTERS.filter(c => c.rarity === rarity);
      const char = availableChars[Math.floor(Math.random() * availableChars.length)];
      drawn.push(char);
    }

    return drawn;
  };

  const closePackResult = () => {
    setShowPackResult(false);
    setRevealedCharacters([]);
  };

  return (
    <div className="min-h-screen bg-[#fffaf2] pb-12">
      {/* Back button */}
      <div className="absolute top-6 left-6 z-10">
        <BackButton onClick={() => router.back()} />
      </div>

      {/* Coin display */}
      <div className="absolute top-6 right-6 z-10">
        <div className="bg-[#fd9227] border-[3px] border-[#730f11] rounded-[15px] px-6 py-3 flex items-center gap-3 shadow-[0_6px_0_0_#730f11]">
          <Coins size={24} className="text-white" />
          <span className="font-quicksand font-bold text-white text-[20px]">{coins}</span>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-4 pt-24">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-quicksand font-bold text-[#473025] text-[48px] sm:text-[56px] leading-tight mb-2">
            Dragon Drops Shop
          </h1>
          <p className="font-quicksand text-[#473025]/70 text-[18px]">
            Open packs to unlock new Wyrm characters!
          </p>
        </div>

        {/* Pack purchase section */}
        <div className="bg-white rounded-[20px] shadow-lg border-[3px] border-[#473025]/20 p-8 mb-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            {/* Pack visual */}
            <div className="flex-shrink-0">
              <div className="relative">
                <div className={`w-[180px] h-[220px] bg-gradient-to-br from-[#ff9f22] to-[#fd9227] border-4 border-[#730f11] rounded-[20px] shadow-2xl ${openingPack ? 'animate-pulse' : ''}`}>
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white to-transparent opacity-20 rounded-[16px]"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Package size={80} className="text-white/90" />
                  </div>
                  <div className="absolute bottom-3 left-0 right-0 text-center">
                    <span className="font-quicksand font-bold text-white text-[14px]">DRAGON PACK</span>
                  </div>
                </div>
                {openingPack && (
                  <div className="absolute -top-2 -right-2">
                    <Sparkles size={32} className="text-[#96b902] animate-spin" />
                  </div>
                )}
              </div>
            </div>

            {/* Pack info */}
            <div className="flex-1 text-center md:text-left">
              <h2 className="font-quicksand font-bold text-[#473025] text-[32px] mb-3">Dragon Pack</h2>
              <p className="font-quicksand text-[#473025]/70 text-[16px] mb-4">
                Each pack contains 3 random Wyrm characters with varying rarities!
              </p>
              <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-6">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 border-yellow-500 bg-yellow-500/10 font-quicksand font-bold text-[12px] text-yellow-700">
                  <Crown size={14} /> Mythic 1%
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 border-purple-500 bg-purple-500/10 font-quicksand font-bold text-[12px] text-purple-700">
                  <Star size={14} /> Legendary 4%
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 border-blue-500 bg-blue-500/10 font-quicksand font-bold text-[12px] text-blue-700">
                  <Trophy size={14} /> Epic 15%
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 border-green-500 bg-green-500/10 font-quicksand font-bold text-[12px] text-green-700">
                  <Sparkles size={14} /> Rare 30%
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 border-gray-400 bg-gray-400/10 font-quicksand font-bold text-[12px] text-gray-700">
                  Common 50%
                </span>
              </div>

              <Button
                onClick={openPack}
                disabled={coins < 100 || openingPack}
                variant="success"
                size="lg"
                fullWidth={false}
                className="min-w-[200px]"
              >
                {openingPack ? 'Opening...' : `Open Pack (100 coins)`}
              </Button>
            </div>
          </div>
        </div>

        {/* Character collection */}
        <div className="bg-white rounded-[20px] shadow-lg border-[3px] border-[#473025]/20 p-8">
          <h2 className="font-quicksand font-bold text-[#473025] text-[28px] mb-6">
            Your Collection ({unlockedCharacters.length}/{CHARACTERS.length})
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {CHARACTERS.map((char) => {
              const isUnlocked = unlockedCharacters.includes(char.id);
              return (
                <div
                  key={char.id}
                  className={`relative rounded-[15px] border-[3px] p-4 transition-all ${
                    isUnlocked
                      ? `${RARITY_COLORS[char.rarity as keyof typeof RARITY_COLORS]} hover:scale-105`
                      : 'border-gray-300 bg-gray-100 opacity-50'
                  }`}
                >
                  {isUnlocked ? (
                    <>
                      <div className="text-center mb-2">
                        <div className={`w-16 h-16 mx-auto rounded-full bg-gradient-to-br ${char.color} flex items-center justify-center text-[32px] mb-2 overflow-hidden`}>
                          {char.image ? (
                            <Image src={char.image} alt={char.name} width={64} height={64} className="object-cover" />
                          ) : (
                            char.emoji
                          )}
                        </div>
                        <p className="font-quicksand font-bold text-[#473025] text-[12px] line-clamp-2">
                          {char.name}
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto rounded-full bg-gray-300 flex items-center justify-center mb-2">
                        <Lock size={28} className="text-gray-500" />
                      </div>
                      <p className="font-quicksand font-bold text-gray-500 text-[12px]">Locked</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Pack result modal */}
      {showPackResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[20px] shadow-2xl border-[3px] border-[#473025] p-8 max-w-2xl w-full animate-fade-in">
            <div className="text-center mb-6">
              <h2 className="font-quicksand font-bold text-[#473025] text-[32px] mb-2">Pack Opened!</h2>
              <p className="font-quicksand text-[#473025]/70 text-[16px]">You got:</p>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              {revealedCharacters.map((char, index) => {
                const isNew = !unlockedCharacters.includes(char.id) ||
                             revealedCharacters.slice(0, index).some(c => c.id === char.id);
                return (
                  <div key={index} className="relative">
                    <div className={`rounded-[15px] border-[3px] p-4 ${RARITY_COLORS[char.rarity as keyof typeof RARITY_COLORS]}`}>
                      <div className="text-center">
                        <div className={`w-20 h-20 mx-auto rounded-full bg-gradient-to-br ${char.color} flex items-center justify-center text-[40px] mb-2 overflow-hidden`}>
                          {char.image ? (
                            <Image src={char.image} alt={char.name} width={80} height={80} className="object-cover" />
                          ) : (
                            char.emoji
                          )}
                        </div>
                        <p className="font-quicksand font-bold text-[#473025] text-[14px] mb-1">
                          {char.name}
                        </p>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-quicksand font-bold uppercase ${RARITY_COLORS[char.rarity as keyof typeof RARITY_COLORS]}`}>
                          {char.rarity}
                        </span>
                      </div>
                    </div>
                    {isNew && (
                      <div className="absolute -top-2 -right-2 bg-[#96b902] border-2 border-[#006029] rounded-full px-2 py-1">
                        <span className="font-quicksand font-bold text-white text-[10px]">NEW!</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <Button onClick={closePackResult} variant="success" size="lg" fullWidth>
              Continue
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
