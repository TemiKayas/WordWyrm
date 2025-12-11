'use client';

import { Search } from 'lucide-react';

type SearchBarProps = {
  search: string;
  setSearch: (value: string) => void;
};

export default function SearchBar({ search, setSearch }: SearchBarProps) {
  return (
    <div className="mb-4">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#473025]" size={20} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search games by title, teacher, or description..."
          className="w-full h-[50px] pl-12 pr-4 border-[3px] border-[#473025] rounded-[12px] font-quicksand font-bold text-[16px] text-[#473025] placeholder:text-[#bfa183] focus:outline-none focus:border-[#96b902] focus:ring-4 focus:ring-[#96b902]/20 transition-all bg-[#fffaf2]"
        />
      </div>
    </div>
  );
}
