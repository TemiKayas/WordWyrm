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

    // Animate character arms with subtle breathing motion
    useLayoutEffect(() => {
        let timeline: any = null;

        const initAnimation = async () => {
            try {
                const { gsap } = await import('gsap');

                timeline = gsap.timeline({ repeat: -1, yoyo: true });

                if (armForwardRef.current) {
                    timeline.to(armForwardRef.current, {
                        y: -2,
                        rotation: 0.5,
                        duration: 2,
                        ease: 'sine.inOut'
                    }, 0);
                }

                if (armBackRef.current) {
                    timeline.to(armBackRef.current, {
                        y: 1,
                        rotation: -0.3,
                        duration: 2,
                        ease: 'sine.inOut'
                    }, 0);
                }
            } catch (error) {
                console.error('Failed to load GSAP:', error);
            }
        };

        initAnimation();
        return () => timeline?.kill?.();
    }, []);

    // Load saved progress from localStorage on mount
    useEffect(() => {
        const savedCoins = localStorage.getItem('userCoins');
        const savedUnlocked = localStorage.getItem('unlockedCharacters');

        if (savedCoins) setCoins(parseInt(savedCoins));
        if (savedUnlocked) setUnlockedCharacters(JSON.parse(savedUnlocked));
    }, []);

    // Persist state to localStorage
    useEffect(() => {
        localStorage.setItem('userCoins', coins.toString());
    }, [coins]);

    useEffect(() => {
        localStorage.setItem('unlockedCharacters', JSON.stringify(unlockedCharacters));
    }, [unlockedCharacters]);

    // Draw a random character based on rarity probability
    const drawCharacter = (): Character => {
        const rand = Math.random();
        let rarity: Character['rarity'] = 'common';

        // Determine rarity based on cumulative probabilities
        if (rand < RARITY_RATES.mythic) {
            rarity = 'mythic';
        } else if (rand < RARITY_RATES.mythic + RARITY_RATES.legendary) {
            rarity = 'legendary';
        } else if (rand < RARITY_RATES.mythic + RARITY_RATES.legendary + RARITY_RATES.epic) {
            rarity = 'epic';
        } else if (rand < RARITY_RATES.mythic + RARITY_RATES.legendary + RARITY_RATES.epic + RARITY_RATES.rare) {
            rarity = 'rare';
        }

        // Select random character from the determined rarity tier
        const available = CHARACTERS.filter((c) => c.rarity === rarity);
        return available[Math.floor(Math.random() * available.length)];
    };

    // Handle loot box opening
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
            <div className="relative w-full h-[calc(100vh-80px)] bg-[#fffaf2] overflow-hidden">
                {/* Full viewport container - simple and responsive */}
                <div className="absolute inset-0">
                    <div className="relative w-full h-full">

                        {/* Layer 1: Arm Back - Bottom layer */}
                        <div ref={armBackRef} className="absolute inset-0 w-full h-full pointer-events-none">
                            <Image
                                src="/assets/shop/arm-back.png"
                                alt=""
                                fill
                                className="object-cover object-bottom"
                                priority
                            />
                        </div>

                        {/* Layer 2: Register */}
                        <div className="absolute inset-0 w-full h-full pointer-events-none">
                            <Image
                                src="/assets/shop/register.png"
                                alt=""
                                fill
                                className="object-cover object-bottom"
                                priority
                            />
                        </div>

                        {/* Layer 3: Floopa Character */}
                        <div className="absolute inset-0 w-full h-full pointer-events-none">
                            <Image
                                src="/assets/shop/floopa-shop.png"
                                alt=""
                                fill
                                className="object-cover object-bottom"
                                priority
                            />
                        </div>

                        {/* Layer 4: Cabinet (background for collection) */}
                        <div className="absolute inset-0 w-full h-full pointer-events-none">
                            <Image
                                src="/assets/shop/Cabinet.svg"
                                alt=""
                                fill
                                className="object-cover object-bottom"
                                priority
                            />
                        </div>

                        {/* Layer 5: Desk */}
                        <div className="absolute inset-0 w-full h-full pointer-events-none">
                            <Image
                                src="/assets/shop/desk.png"
                                alt=""
                                fill
                                className="object-cover object-bottom"
                                priority
                            />
                        </div>

                        {/* Layer 6: Chat Bubble */}
                        <div className="absolute inset-0 w-full h-full pointer-events-none">
                            <Image
                                src="/assets/shop/chat.png"
                                alt=""
                                fill
                                className="object-cover object-bottom"
                                priority
                            />
                        </div>

                        {/* Layer 7: Arm Forward - Top most background layer */}
                        <div ref={armForwardRef} className="absolute inset-0 w-full h-full pointer-events-none">
                            <Image
                                src="/assets/shop/arm-forward.png"
                                alt=""
                                fill
                                className="object-cover object-bottom"
                                priority
                            />
                        </div>

                        {/* INTERACTIVE CONTENT - Positioned absolutely in responsive percentages */}

                        {/* Sign Title - Positioned at top edge (y: -18px in Figma = touching nav) */}
                        <div className="absolute left-[18.26%] top-{0} w-[26.18%]">
                            <Image
                                src="/assets/shop/Sign.svg"
                                alt="Shop Sign"
                                width={377}
                                height={139}
                                className="w-full h-auto"
                            />
                            <p className="absolute inset-0 flex items-center justify-center font-quicksand font-bold text-[2.22vw] md:text-[32px] text-[#473025] pt-[1%]"
                               style={{ textShadow: '#fe9659 0px 2px 8.9px' }}>
                                Dragon Drop Shop
                            </p>
                        </div>

                        {/* Chat Bubble Text - Centered inside chat bubble (Figma: left: 625.5px centered, top: 234px) */}
                        <div className="absolute left-[44.5%] top-[30%] w-[20.35%] -translate-x-1/2 text-center">
                            <p className="font-quicksand font-bold text-[#473025] text-[1.30vw] md:text-[18px] leading-[1.1]">
                                Test your luck by purchasing Dragon Drop Box! Unlock rare profile pictures to flex on your friends!
                            </p>
                        </div>

                        {/* Collection Header - Inside cabinet (Figma: left: 842px, top: 102px) */}
                        <div className="absolute left-[58.47%] top-[8%] right-[4.2%] flex items-center justify-between">
                            <div className="flex items-center gap-[0.5vw]">
                                <h2 className="font-quicksand font-bold text-[1.8vw] md:text-[24px] lg:text-[32px] text-[#473025] leading-tight whitespace-nowrap">
                                    Your Collection
                                </h2>
                                <div className="bg-[#fd9227] rounded-full px-[0.8vw] py-[0.2vw] h-[2.7vw] md:h-[32px] lg:h-[38px] flex items-center justify-center">
                                    <p className="font-quicksand font-bold text-white text-[1.2vw] md:text-[16px] lg:text-[21.42px]">
                                        {unlockedCharacters.length}/20
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-[0.5vw] rounded-full bg-[#fffcf8] border-[3px] border-[#473025] px-[0.8vw] h-[4.5vw] md:h-[50px] lg:h-[63px]">
                                <Image src="/assets/shop/coin-large.png" alt="" width={49} height={49} className="w-[2.8vw] md:w-[36px] lg:w-[49px] h-auto" />
                                <p className="font-quicksand font-bold text-[#473025] text-[1.8vw] md:text-[24px] lg:text-[32px]">
                                    {coins}
                                </p>
                            </div>
                        </div>

                        {/* Collection Grid - 4 rows x 5 columns (Figma: left: 900px, top: 219px, size: 482x522) */}
                        <div className="absolute left-[60%] top-[25%] w-[29.5%] h-[62.74%] pointer-events-auto">
                            <div className="relative w-full h-full flex flex-col justify-between gap-3">
                                {[0, 1, 2, 3].map((rowIndex) => (
                                    <div key={rowIndex} className="flex justify-between w-full">
                                        {CHARACTERS.slice(rowIndex * 5, rowIndex * 5 + 5).map((char) => {
                                            const unlocked = unlockedCharacters.includes(char.id);
                                            return (
                                                <div key={char.id} className="flex flex-col items-center" style={{ width: '18.5%' }}>
                                                    {/* Circle Icon */}
                                                    <div className="w-full aspect-square rounded-full border-[0.35vw] md:border-[4px] lg:border-[5px] border-[#473025] bg-[#b58975] flex items-center justify-center overflow-hidden">
                                                        {unlocked ? (
                                                            <div className="w-full h-full rounded-full flex items-center justify-center p-[8%]"
                                                                 style={{ background: char.bgColor }}>
                                                                <Image
                                                                    src={char.image}
                                                                    alt={char.name}
                                                                    width={60}
                                                                    height={60}
                                                                    className="w-full h-full object-contain"
                                                                />
                                                            </div>
                                                        ) : (
                                                            <span className="text-white font-quicksand font-bold text-[3vw] md:text-[36px] lg:text-[48px] leading-none">?</span>
                                                        )}
                                                    </div>
                                                    {/* Name Label */}
                                                    <div className="mt-[8%] bg-[#fffcf8] border-[0.35vw] md:border-[4px] lg:border-[5px] border-[#473025] rounded-[0.5vw] md:rounded-[6px] h-[2.6vw] md:h-[32px] lg:h-[37px] w-full flex items-center justify-center">
                                                        <p className="font-quicksand font-bold text-[#473025] text-[0.8vw] md:text-[12px] lg:text-[15px] leading-none">
                                                            {unlocked ? char.name : '???'}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Buy Box Button - Inside desk (Figma: left: 411px, top: 635px, size: 233x115) */}
                        <button
                            onClick={openBox}
                            disabled={coins < 100 || openingBox}
                            className={`pointer-events-auto absolute left-[28.54%] top-[76.32%] w-[16.18%] h-[13.82%] bg-[#95b607] border-[3px] border-[#006029] rounded-[15px] flex flex-col items-center justify-center transition-all ${
                                coins < 100 || openingBox ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'
                            }`}
                        >
                            <span className="font-quicksand font-bold text-white text-[1.8vw] md:text-[24px] lg:text-[31px]">
                                {openingBox ? 'OPENING...' : 'BUY BOX'}
                            </span>
                            <div className="mt-[4%] flex items-center gap-[0.3vw] bg-[rgba(0,96,41,0.26)] px-[0.8vw] h-[2.5vw] md:h-[32px] lg:h-[36px] rounded-full">
                                <span className="font-quicksand font-bold text-white text-[0.8vw] md:text-[12px] lg:text-[15px]">x</span>
                                <Image src="/assets/shop/coin-large.png" alt="" width={28} height={28} className="w-[1.6vw] md:w-[22px] lg:w-[28px] h-auto" />
                                <span className="font-quicksand font-bold text-white text-[1.2vw] md:text-[16px] lg:text-[20px]">100</span>
                            </div>
                        </button>

                    </div>
                </div>

                {/* Opening Animation Modal */}
                {openingBox && (
                    <div className="fixed inset-0 z-[1000] bg-black/80 flex items-center justify-center">
                        <div className="text-center">
                            <div className="relative w-64 h-64">
                                <div className="absolute inset-0 bg-gradient-to-b from-[#7a9700] to-[#5a7000] border-[4px] border-[#006029] rounded-[16px] flex items-center justify-center animate-pulse">
                                    <span className="text-white text-[6rem] font-quicksand font-bold">?</span>
                                </div>
                            </div>
                            <p className="mt-3 text-white font-quicksand text-[1.75rem] animate-pulse">
                                Opening Box...
                            </p>
                        </div>
                    </div>
                )}

                {/* Result Modal */}
                {showBoxResult && revealedCharacter && (
                    <div className="fixed inset-0 z-[1000] bg-black/80 flex items-center justify-center p-4">
                        <div className="bg-[#fffbf6] rounded-[20px] border-[4px] border-[#473025] p-8 max-w-md w-full">
                            <h2 className="font-quicksand text-[1.75rem] text-[#473025] font-bold text-center mb-2">
                                {unlockedCharacters.includes(revealedCharacter.id)
                                    ? 'Duplicate Character'
                                    : 'New Character Unlocked!'}
                            </h2>

                            <div className="flex justify-center my-6">
                                <div className="relative">
                                    <div className="w-48 h-48 rounded-full border-[4px] border-[#473025] bg-white flex items-center justify-center p-6"
                                         style={{ background: revealedCharacter.bgColor }}>
                                        <Image src={revealedCharacter.image} alt="" width={120} height={120} className="w-full h-full object-contain" />
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
        </TeacherPageLayout>
    );
}
