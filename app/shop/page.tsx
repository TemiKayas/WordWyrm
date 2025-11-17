'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Edit2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import Image from 'next/image';
import TeacherPageLayout from '@/components/shared/TeacherPageLayout';
import { useProfile } from '@/lib/contexts/ProfileContext';

type Character = {
    id: number;
    name: string;
    rarity: 'mythic' | 'legendary' | 'epic' | 'rare' | 'common';
    image: string;
    bgColor: string;
};

const CHARACTERS: Character[] = [
    { id: 1, name: 'Golden Floopa', rarity: 'mythic', image: '/assets/dashboard/floopa-character.png', bgColor: '#FFD700' },
    { id: 2, name: 'Purple Floopa', rarity: 'legendary', image: '/assets/dashboard/floopa-character.png', bgColor: '#A855F7' },
    { id: 3, name: 'Red Floopa', rarity: 'legendary', image: '/assets/dashboard/floopa-character.png', bgColor: '#EF4444' },
    { id: 4, name: 'Blue Floopa', rarity: 'epic', image: '/assets/dashboard/floopa-character.png', bgColor: '#3B82F6' },
    { id: 5, name: 'Dark Floopa', rarity: 'epic', image: '/assets/dashboard/floopa-character.png', bgColor: '#374151' },
    { id: 6, name: 'Amber Floopa', rarity: 'epic', image: '/assets/dashboard/floopa-character.png', bgColor: '#F59E0B' },
    { id: 7, name: 'Green Floopa', rarity: 'rare', image: '/assets/dashboard/floopa-character.png', bgColor: '#10B981' },
    { id: 8, name: 'Indigo Floopa', rarity: 'rare', image: '/assets/dashboard/floopa-character.png', bgColor: '#6366F1' },
    { id: 9, name: 'Pink Floopa', rarity: 'rare', image: '/assets/dashboard/floopa-character.png', bgColor: '#EC4899' },
    { id: 10, name: 'Teal Floopa', rarity: 'common', image: '/assets/dashboard/floopa-character.png', bgColor: '#14B8A6' },
    { id: 11, name: 'Gray Floopa', rarity: 'common', image: '/assets/dashboard/floopa-character.png', bgColor: '#6B7280' },
    { id: 12, name: 'Brown Floopa', rarity: 'common', image: '/assets/dashboard/floopa-character.png', bgColor: '#92400E' },
    { id: 13, name: 'Rainbow Floopa', rarity: 'common', image: '/assets/dashboard/floopa-character.png', bgColor: '#8B5CF6' },
];

const RARITY_COLORS: Record<Character['rarity'], string> = {
    mythic: 'border-[#FFD700]',
    legendary: 'border-[#A855F7]',
    epic: 'border-[#3B82F6]',
    rare: 'border-[#10B981]',
    common: 'border-[#9CA3AF]',
};

const RARITY_RATES: Record<Character['rarity'], number> = {
    mythic: 0.01,
    legendary: 0.04,
    epic: 0.15,
    rare: 0.30,
    common: 0.50,
};

export default function ShopPage() {
    const router = useRouter();
    const { profilePictureId, setProfilePictureId } = useProfile();
    const [coins, setCoins] = useState(700);
    const [unlockedCharacters, setUnlockedCharacters] = useState<number[]>([1, 9]);
    const [openingPack, setOpeningPack] = useState(false);
    const [revealedCharacter, setRevealedCharacter] = useState<Character | null>(null);
    const [showPackResult, setShowPackResult] = useState(false);

    const openPack = () => {
        if (coins < 100 || openingPack) return;

        setCoins(coins - 100);
        setOpeningPack(true);

        const newChar = drawCharacter();
        setRevealedCharacter(newChar);

        setTimeout(() => {
            setOpeningPack(false);
            setShowPackResult(true);

            if (!unlockedCharacters.includes(newChar.id)) {
                setUnlockedCharacters([...unlockedCharacters, newChar.id]);
            }
        }, 1500);
    };

    const drawCharacter = (): Character => {
        const rand = Math.random();
        let rarity: Character['rarity'] = 'common';

        if (rand < RARITY_RATES.mythic) rarity = 'mythic';
        else if (rand < RARITY_RATES.mythic + RARITY_RATES.legendary) rarity = 'legendary';
        else if (rand < RARITY_RATES.mythic + RARITY_RATES.legendary + RARITY_RATES.epic) rarity = 'epic';
        else if (rand < RARITY_RATES.mythic + RARITY_RATES.legendary + RARITY_RATES.epic + RARITY_RATES.rare)
            rarity = 'rare';

        const available = CHARACTERS.filter(c => c.rarity === rarity);
        return available[Math.floor(Math.random() * available.length)];
    };

    const closePackResult = () => {
        setShowPackResult(false);
        setRevealedCharacter(null);
    };

    const setAsProfilePic = () => {
        if (revealedCharacter) {
            setProfilePictureId(revealedCharacter.id);
            closePackResult();
        }
    };

    const currentChar = CHARACTERS.find(c => c.id === profilePictureId);

    return (
        <TeacherPageLayout>
            <>
                <div className="h-[calc(100vh-4rem)] overflow-auto bg-[#FFFAF2] px-4 py-4">
                    <div className="max-w-6xl mx-auto h-full flex flex-col gap-4">
                        <div className="text-center">
                            <h1 className="font-quicksand font-bold text-[#473025] text-2xl mb-1">
                                Dragon Drops Shop
                            </h1>
                            <p className="font-quicksand text-[#BE9F91] text-sm">
                                Spend coins to unlock special profile pictures!
                            </p>
                        </div>

                        <div className="flex gap-4 flex-1 min-h-0">
                            <div className="w-56 flex-shrink-0 flex flex-col gap-4">
                                <div className="bg-[#FFFCF8] border-[3px] border-[#473025] rounded-[15px] p-4">
                                    <div className={`w-full h-44 bg-[#95b607] rounded-[15px] border-[3px] border-[#006029] flex items-center justify-center overflow-hidden relative transition-all ${openingPack ? 'animate-pulse' : ''}`}>
                                        <div className="w-full h-full flex items-center justify-center bg-[#95b607]">
                                            <Image
                                                src="/assets/dashboard/floopa-character.png"
                                                alt="Pack"
                                                width={110}
                                                height={110}
                                                className="object-contain opacity-80"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={openPack}
                                    disabled={coins < 100 || openingPack}
                                    className="w-full bg-[#95b607] border-[3px] border-[#006029] rounded-[15px] h-[57px] px-6 flex items-center justify-center text-white font-quicksand font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_6px_0_0_#006029] active:shadow-[0_2px_0_0_#006029] active:translate-y-1 hover:-translate-y-0.5 hover:shadow-[0_8px_0_0_#006029] transition-all duration-150"
                                >
                  <span className="text-lg mr-2">
                    {openingPack ? 'OPENING...' : 'OPEN PACK'}
                  </span>
                                    <Image
                                        src="/assets/shop/coin-icon.png"
                                        alt="coin"
                                        width={20}
                                        height={20}
                                        className="object-contain"
                                    />
                                    <span className="text-base ml-1">100</span>
                                </button>

                                <button
                                    onClick={() => {
                                        document.querySelector('#collection-grid')?.scrollIntoView({ behavior: 'smooth' });
                                    }}
                                    className="flex items-center gap-3 bg-[#FFFCF8] border-[3px] border-[#473025] rounded-[15px] p-3 hover:bg-[#fff5e8] transition-all cursor-pointer group"
                                >
                                    <div className="relative">
                                        <div
                                            className={`w-12 h-12 rounded-full flex items-center justify-center overflow-hidden border-[3px] bg-[#FFFCF8] ${
                                                currentChar ? RARITY_COLORS[currentChar.rarity] : 'border-[#473025]'
                                            }`}
                                        >
                                            {currentChar && (
                                                <div
                                                    className="w-full h-full rounded-full flex items-center justify-center"
                                                    style={{ backgroundColor: currentChar.bgColor }}
                                                >
                                                    <Image
                                                        src={currentChar.image}
                                                        alt={currentChar.name}
                                                        width={36}
                                                        height={36}
                                                        className="object-contain"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full border-2 border-[#473025] flex items-center justify-center group-hover:bg-gray-100 transition-colors">
                                            <Edit2 size={8} className="text-[#473025]" />
                                        </div>
                                    </div>
                                    <div className="text-left flex-1">
                                        <p className="font-quicksand font-bold text-[#473025] text-xs leading-tight">
                                            Current
                                        </p>
                                        <p className="font-quicksand text-[#BE9F91] text-xs leading-tight">
                                            {currentChar?.name.replace(' Floopa', '') || 'None'}
                                        </p>
                                    </div>
                                </button>

                                <div className="bg-[#FFFCF8] border-[3px] border-[#473025] rounded-[15px] h-14 px-4 flex items-center justify-center gap-2">
                                    <Image
                                        src="/assets/shop/coin-icon.png"
                                        alt="coin"
                                        width={28}
                                        height={28}
                                        className="object-contain"
                                    />
                                    <span className="font-quicksand font-bold text-[#473025] text-xl">{coins}</span>
                                </div>
                            </div>

                            <div className="flex-1 min-h-0" id="collection-grid">
                                <div className="bg-[#FFFCF8] border-[3px] border-[#473025] rounded-[15px] p-6 h-full flex flex-col">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="font-quicksand font-bold text-[#473025] text-xl">
                                            Your Collection
                                        </h2>
                                        <div className="bg-[#fd9227] h-9 px-5 rounded-full flex items-center justify-center border-[3px] border-[#cc7425]">
                      <span className="font-quicksand font-bold text-white text-base">
                        {unlockedCharacters.length}/{CHARACTERS.length}
                      </span>
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto">
                                        <div className="grid grid-cols-5 gap-4">
                                            {CHARACTERS.map((char) => {
                                                const isUnlocked = unlockedCharacters.includes(char.id);
                                                const isCurrent = char.id === profilePictureId;
                                                return (
                                                    <div
                                                        key={char.id}
                                                        onClick={() => isUnlocked && setProfilePictureId(char.id)}
                                                        className={`relative rounded-[12px] border-[3px] p-3 transition-all duration-200 ${
                                                            isUnlocked
                                                                ? `${RARITY_COLORS[char.rarity]} bg-white hover:scale-105 cursor-pointer ${isCurrent ? 'ring-[3px] ring-[#95b607]' : ''}`
                                                                : 'border-[#e5e7eb] bg-[#f9fafb] cursor-not-allowed'
                                                        }`}
                                                    >
                                                        {isUnlocked ? (
                                                            <div className="text-center">
                                                                <div
                                                                    className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-2 overflow-hidden"
                                                                    style={{ backgroundColor: char.bgColor }}
                                                                >
                                                                    <Image src={char.image} alt={char.name} width={56} height={56} className="object-contain" />
                                                                </div>
                                                                <p className="font-quicksand font-semibold text-[#473025] text-sm line-clamp-1">
                                                                    {char.name.replace(' Floopa', '')}
                                                                </p>
                                                                {isCurrent && (
                                                                    <div className="absolute top-2 right-2 w-5 h-5 bg-[#95b607] rounded-full flex items-center justify-center border-2 border-white">
                                                                        <span className="text-white text-xs font-bold">✓</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div className="text-center opacity-40">
                                                                <div className="w-20 h-20 mx-auto rounded-full bg-[#e5e7eb] flex items-center justify-center mb-2">
                                                                    <Lock size={24} className="text-[#9ca3af]" />
                                                                </div>
                                                                <p className="font-quicksand font-semibold text-[#9ca3af] text-sm">Locked</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                {openingPack && (
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                        <div className="text-center">
                            <div className="w-64 h-64 bg-[#95b607] rounded-xl border-4 border-[#006029] flex items-center justify-center animate-pulse shadow-2xl">
                                <div className="text-white text-6xl font-bold">?</div>
                            </div>
                            <p className="font-quicksand font-bold text-white text-xl mt-4">
                                Opening Pack...
                            </p>
                        </div>
                    </div>
                )}

                {showPackResult && revealedCharacter && (
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                        <div className="max-w-sm w-full">
                            <div className="bg-[#FFFCF8] rounded-xl shadow-2xl border-2 border-[#473025] p-6">
                                <div className="text-center mb-4">
                                    <h2 className="font-quicksand font-bold text-[#473025] text-xl mb-1">
                                        {!unlockedCharacters.slice(0, -1).includes(revealedCharacter.id)
                                            ? 'New Character Unlocked'
                                            : 'Duplicate Character'}
                                    </h2>
                                    <p className="font-quicksand text-[#BE9F91] text-sm">
                                        {!unlockedCharacters.slice(0, -1).includes(revealedCharacter.id)
                                            ? 'Added to your collection'
                                            : 'Already in your collection'}
                                    </p>
                                </div>

                                <div className="flex justify-center mb-6">
                                    <div className={`rounded-xl border-2 ${RARITY_COLORS[revealedCharacter.rarity]} bg-white p-6`}>
                                        <div className="text-center">
                                            <div
                                                className="w-32 h-32 mx-auto rounded-full flex items-center justify-center mb-3 overflow-hidden"
                                                style={{ backgroundColor: revealedCharacter.bgColor }}
                                            >
                                                <Image
                                                    src={revealedCharacter.image}
                                                    alt={revealedCharacter.name}
                                                    width={96}
                                                    height={96}
                                                    className="object-contain"
                                                />
                                            </div>
                                            <p className="font-quicksand font-bold text-[#473025] text-base mb-2">
                                                {revealedCharacter.name}
                                            </p>
                                            <span className={`inline-block px-3 py-1 rounded-full ${
                                                revealedCharacter.rarity === 'mythic' ? 'bg-yellow-500' :
                                                    revealedCharacter.rarity === 'legendary' ? 'bg-purple-500' :
                                                        revealedCharacter.rarity === 'epic' ? 'bg-blue-500' :
                                                            revealedCharacter.rarity === 'rare' ? 'bg-green-500' :
                                                                'bg-gray-500'
                                            } text-white text-xs font-quicksand font-bold uppercase`}>
                        {revealedCharacter.rarity}
                      </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Button onClick={setAsProfilePic} variant="success" size="md" fullWidth>
                                        Set as Profile Picture
                                    </Button>
                                    <Button onClick={closePackResult} variant="secondary" size="md" fullWidth>
                                        Continue
                                    </Button>
                                </div>

                            </div>
                        </div>
                    </div>
                )}
            </>
        </TeacherPageLayout>
    );
}
