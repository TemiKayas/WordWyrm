'use client';

import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import Image from 'next/image';
import TeacherPageLayout from '@/components/shared/TeacherPageLayout';

type Character = {
    id: number;
    name: string;
    rarity: 'mythic' | 'legendary' | 'epic' | 'rare' | 'common';
    image: string;
    bgColor: string;
};

const CHARACTERS: Character[] = [
    { id: 1, name: 'Golden', rarity: 'mythic', image: '/assets/dashboard/floopa-character.png', bgColor: '#FFD700' },
    { id: 2, name: 'Purple', rarity: 'legendary', image: '/assets/dashboard/floopa-character.png', bgColor: '#A855F7' },
    { id: 3, name: 'Red', rarity: 'legendary', image: '/assets/dashboard/floopa-character.png', bgColor: '#EF4444' },
    { id: 4, name: 'Blue', rarity: 'epic', image: '/assets/dashboard/floopa-character.png', bgColor: '#3B82F6' },
    { id: 5, name: 'Dark', rarity: 'epic', image: '/assets/dashboard/floopa-character.png', bgColor: '#374151' },
    { id: 6, name: 'Amber', rarity: 'epic', image: '/assets/dashboard/floopa-character.png', bgColor: '#F59E0B' },
    { id: 7, name: 'Green', rarity: 'rare', image: '/assets/dashboard/floopa-character.png', bgColor: '#10B981' },
    { id: 8, name: 'Indigo', rarity: 'rare', image: '/assets/dashboard/floopa-character.png', bgColor: '#6366F1' },
    { id: 9, name: 'Pink', rarity: 'rare', image: '/assets/dashboard/floopa-character.png', bgColor: '#EC4899' },
    { id: 10, name: 'Teal', rarity: 'common', image: '/assets/dashboard/floopa-character.png', bgColor: '#14B8A6' },
    { id: 11, name: 'Gray', rarity: 'common', image: '/assets/dashboard/floopa-character.png', bgColor: '#6B7280' },
    { id: 12, name: 'Brown', rarity: 'common', image: '/assets/dashboard/floopa-character.png', bgColor: '#92400E' },
    { id: 13, name: 'Lime', rarity: 'common', image: '/assets/dashboard/floopa-character.png', bgColor: '#84CC16' },
    { id: 14, name: 'Cyan', rarity: 'common', image: '/assets/dashboard/floopa-character.png', bgColor: '#06B6D4' },
    { id: 15, name: 'Rose', rarity: 'rare', image: '/assets/dashboard/floopa-character.png', bgColor: '#F43F5E' },
    { id: 16, name: 'Violet', rarity: 'rare', image: '/assets/dashboard/floopa-character.png', bgColor: '#8B5CF6' },
    { id: 17, name: 'Emerald', rarity: 'epic', image: '/assets/dashboard/floopa-character.png', bgColor: '#10B981' },
    { id: 18, name: 'Sky', rarity: 'epic', image: '/assets/dashboard/floopa-character.png', bgColor: '#0EA5E9' },
    { id: 19, name: 'Fuchsia', rarity: 'legendary', image: '/assets/dashboard/floopa-character.png', bgColor: '#D946EF' },
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

    const armBackRef = useRef<HTMLDivElement | null>(null);
    const armForwardRef = useRef<HTMLDivElement | null>(null);

    useLayoutEffect(() => {
        let ctx: any = null;
        let gsapLib: any = null;

        const start = async () => {
            try {
                const m = await import('gsap');
                gsapLib = m.gsap || m.default || m;

                const tl = gsapLib.timeline({ repeat: -1, yoyo: true });
                if (armForwardRef.current) tl.to(armForwardRef.current, { y: -3, rotation: 2, duration: 1.2 }, 0);
                if (armBackRef.current) tl.to(armBackRef.current, { y: 2, rotation: -1, duration: 1.2 }, 0);
                ctx = tl;
            } catch { }
        };

        start();
        return () => ctx?.kill?.();
    }, []);

    useEffect(() => {
        const savedCoins = localStorage.getItem('userCoins');
        const savedUnlocked = localStorage.getItem('unlockedCharacters');
        if (savedCoins) setCoins(parseInt(savedCoins));
        if (savedUnlocked) setUnlockedCharacters(JSON.parse(savedUnlocked));
    }, []);

    useEffect(() => localStorage.setItem('userCoins', coins.toString()), [coins]);
    useEffect(() => localStorage.setItem('unlockedCharacters', JSON.stringify(unlockedCharacters)), [unlockedCharacters]);

    const drawCharacter = (): Character => {
        const rand = Math.random();
        let rarity: Character['rarity'] = 'common';

        if (rand < RARITY_RATES.mythic) rarity = 'mythic';
        else if (rand < RARITY_RATES.mythic + RARITY_RATES.legendary) rarity = 'legendary';
        else if (rand < RARITY_RATES.mythic + RARITY_RATES.legendary + RARITY_RATES.epic) rarity = 'epic';
        else if (rand < RARITY_RATES.mythic + RARITY_RATES.legendary + RARITY_RATES.epic + RARITY_RATES.rare) rarity = 'rare';

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
            setUnlockedCharacters((prev) => prev.includes(newChar.id) ? prev : [...prev, newChar.id]);
        }, 2000);
    };

    return (
        <TeacherPageLayout>
            <div className="flex w-full justify-center bg-[#fffaf2]">
                <div className="relative w-full max-w-[1440px] aspect-[1440/832] overflow-hidden">

                    {/* BACKGROUND IMAGES */}
                    <div ref={armBackRef} className="absolute inset-0 pointer-events-none">
                        <Image src="/assets/shop/arm-back.png" alt="" fill className="object-cover" priority />
                    </div>

                    <div className="absolute inset-0 pointer-events-none">
                        <Image src="/assets/shop/register.png" alt="" fill className="object-cover" priority />
                    </div>

                    <div className="absolute inset-0 pointer-events-none">
                        <Image src="/assets/shop/floopa-shop.png" alt="" fill className="object-cover" priority />
                    </div>

                    {/* CABINET + COLLECTION GRID */}
                    <div className="absolute inset-0">
                        <div className="relative w-full h-full">
                            <Image src="/assets/shop/Cabinet.svg" alt="Cabinet" fill className="object-cover" priority />

                            <div className="absolute right-[6%] top-[8%] w-[34%] pointer-events-auto">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <p className="font-quicksand font-bold text-[2rem] text-[#473025]">
                                            Your Collection
                                        </p>
                                        <div className="bg-[#fd9227] rounded-full px-3 h-[2.4rem] flex items-center">
                                            <p className="font-quicksand font-bold text-white">
                                                {unlockedCharacters.length}/20
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 rounded-full bg-[#fffcf8] border-[3px] border-[#473025] px-3 h-[4rem]">
                                        <Image src="/assets/shop/coin-large.png" alt="" width={36} height={36} />
                                        <p className="font-quicksand font-bold text-[#473025] text-[1.6rem]">
                                            {coins}
                                        </p>
                                    </div>
                                </div>

                                {/* GRID */}
                                <div className="mt-24 ml-12 flex flex-col gap-13">
                                    {[0, 1, 2, 3].map((rowIndex) => (
                                        <div key={rowIndex} className="flex justify-between">
                                            {CHARACTERS.slice(rowIndex * 5, rowIndex * 5 + 5).map((char) => {
                                                const unlocked = unlockedCharacters.includes(char.id);
                                                return (
                                                    <div key={char.id} className="flex flex-col items-center w-[18%]">
                                                        <div className="aspect-square w-full rounded-full border-[5px] border-[#473025] bg-[#fffcf8] flex items-center justify-center overflow-hidden">
                                                            {unlocked ? (
                                                                <div className="h-[70%] w-[70%] rounded-full flex items-center justify-center"
                                                                     style={{ background: char.bgColor }}>
                                                                    <Image src={char.image} alt={char.name} width={50} height={50} />
                                                                </div>
                                                            ) : (
                                                                <span className="text-white font-quicksand font-bold text-[2.8rem]">?</span>
                                                            )}
                                                        </div>
                                                        <p className="mt-1 font-quicksand font-bold text-[#473025] text-[0.9rem]">
                                                            {unlocked ? char.name : '???'}
                                                        </p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* DESK + BUY BUTTON */}
                    <div className="absolute left-0 top-0 w-full h-full pointer-events-none">
                        <div className="relative w-full h-full">
                            <Image src="/assets/shop/desk.png" alt="Desk" fill className="object-cover" priority />

                            <button
                                onClick={openBox}
                                disabled={coins < 100 || openingBox}
                                className={`pointer-events-auto absolute left-[27%] bottom-[2%] w-[17%] aspect-[233/115] bg-[#95b607] border-[3px] border-[#006029] rounded-[15px] flex items-center justify-center transition-all ${
                                    coins < 100 || openingBox ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'
                                }`}
                            >
                                <div className="flex flex-col items-center justify-center h-full">
                                    <span className="font-quicksand font-bold text-white text-[1.4rem]">
                                        {openingBox ? 'OPENING...' : 'BUY BOX'}
                                    </span>
                                    <div className="mt-1 flex items-center gap-2 bg-[rgba(0,96,41,0.18)] px-3 py-1 rounded-full">
                                        <Image src="/assets/shop/coin-large.png" alt="" width={24} height={24} />
                                        <span className="font-quicksand font-bold text-white text-[1rem]">100</span>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* CHAT BUBBLE */}
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="relative w-full h-full">
                            <Image src="/assets/shop/chat.png" alt="chat" fill className="object-cover" priority />
                            <div className="absolute left-[31%] top-[30%] w-[24%] text-center">
                                <p className="font-quicksand font-bold text-[#473025]">
                                    Test your luck by purchasing Dragon Drop Box! Unlock rare profile pictures to flex on your friends!
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* ARM FORWARD */}
                    <div ref={armForwardRef} className="absolute inset-0 pointer-events-none">
                        <Image src="/assets/shop/arm-forward.png" alt="" fill className="object-cover" priority />
                    </div>

                    {/* SIGN */}
                    <div className="absolute left-[16%] top-[7%] w-[27%] aspect-[377/139]">
                        <Image src="/assets/shop/Sign.svg" alt="Shop Sign" fill className="object-contain" priority />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <p className="font-quicksand font-bold text-[1.9rem] text-[#473025]"
                               style={{ textShadow: '#fe9659 0px 2px 8.9px' }}>
                                Dragon Drop Shop
                            </p>
                        </div>
                    </div>

                    {/* BOX OPENING OVERLAY */}
                    {openingBox && (
                        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
                            <div className="text-center">
                                <div className="relative w-64 h-64">
                                    <div className="absolute inset-0 bg-gradient-to-b from-[#7a9700] to-[#5a7000] border-[4px] border-[#006029] rounded-[16px] flex items-center justify-center animate-pulse">
                                        <span className="text-white text-[6rem] font-quicksand font-bold">?</span>
                                    </div>
                                </div>
                                <p className="mt-3 text-white font-quicksand text-[1.75rem] animate-pulse">Opening Box...</p>
                            </div>
                        </div>
                    )}

                    {/* RESULT MODAL */}
                    {showBoxResult && revealedCharacter && (
                        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                            <div className="bg-[#fffbf6] rounded-[20px] border-[4px] border-[#473025] p-8 max-w-md w-full">
                                <h2 className="font-quicksand text-[1.75rem] text-[#473025] font-bold text-center mb-2">
                                    {unlockedCharacters.includes(revealedCharacter.id) ? 'Duplicate Character' : 'New Character Unlocked!'}
                                </h2>

                                <div className="flex justify-center my-6">
                                    <div className="relative">
                                        <div className="w-48 h-48 rounded-full border-[4px] border-[#473025] bg-white flex items-center justify-center"
                                             style={{ background: revealedCharacter.bgColor }}>
                                            <Image src={revealedCharacter.image} alt="" width={120} height={120} />
                                        </div>
                                    </div>
                                </div>

                                <div className="text-center">
                                    <h3 className="font-quicksand font-bold text-[1.5rem] text-[#473025]">{revealedCharacter.name}</h3>
                                </div>

                                <button
                                    onClick={() => { setShowBoxResult(false); setRevealedCharacter(null); }}
                                    className="w-full mt-6 py-4 bg-gradient-to-b from-[#a8d903] to-[#7a9700] border-[3px] border-[#006029] rounded-[12px] text-white font-quicksand text-[1.25rem] font-bold hover:scale-105 active:scale-95 transition"
                                >
                                    Continue
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </TeacherPageLayout>
    );
}
