import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, ChevronRight, ChevronLeft, Lock, Unlock } from 'lucide-react';

const CATEGORIES = ['Academics', 'Social', 'Infrastructure', 'Career'];
const MOCK_ORBS = [
  { id: 1, building: 'Engineering Block', category: 'Academics', title: 'GPU Secret', keywords: ['gpu', 'pc', 'lab'] },
  { id: 2, building: 'Engineering Block', category: 'Social', title: 'Rooftop Access', keywords: ['roof', 'chill', 'view'] },
  { id: 3, building: 'Library', category: 'Academics', title: 'Quiet Spot', keywords: ['study', 'quiet', 'hide'] },
];

export default function TimeCapsuleSidebar({ selectedBuilding }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const processedOrbs = useMemo(() => {
    if (!selectedBuilding) return [];

    const buildingOrbs = MOCK_ORBS.filter((orb) => orb.building === selectedBuilding);
    const query = searchQuery.toLowerCase().trim();
    
    return buildingOrbs.map((orb) => {
      if (!query) {
        return { ...orb, isUnlocked: false };
      }

      const isMatch = 
        orb.title.toLowerCase().includes(query) || 
        orb.category.toLowerCase().includes(query) ||
        orb.keywords.some(kw => kw.toLowerCase().includes(query));

      return { ...orb, isUnlocked: isMatch };
    });
  }, [selectedBuilding, searchQuery]);

  const renderOrbCategory = (categoryName) => {
    const orb = processedOrbs.find((o) => o.category === categoryName);
    const isUnlocked = orb?.isUnlocked;

    return (
      <div key={categoryName} className="flex items-center justify-between p-4 mb-3 rounded-lg border border-white/10 bg-black/20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isUnlocked ? 'bg-cyan-400 shadow-[0_0_10px_#22d3ee]' : 'bg-gray-600'}`} />
          <span className={`font-medium ${isUnlocked ? 'text-white' : 'text-gray-500'}`}>
            {categoryName}
          </span>
        </div>
        {isUnlocked ? <Unlock size={16} className="text-cyan-400" /> : <Lock size={16} className="text-gray-600" />}
        
        {isUnlocked && (
          <div className="w-full mt-2 text-sm text-gray-300">
             Revealed: {orb.title}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <motion.div
        initial={false}
        animate={{ 
          width: isExpanded ? 320 : 0, 
          opacity: isExpanded ? 1 : 0 
        }}
        transition={{ duration: 0.4, type: "spring", bounce: 0.1 }}
        className="fixed top-0 right-0 h-full bg-[#050814]/90 backdrop-blur-xl border-l border-white/10 z-40 overflow-hidden flex flex-col"
      >
        <div className="p-6 w-[320px]">
          <h2 className="text-2xl font-black text-white mb-2 tracking-wide">
            {selectedBuilding || 'Select a Building'}
          </h2>
          <p className="text-sm text-gray-400 mb-8">
            Search to reveal hidden memories and secrets.
          </p>

          <div className="relative mb-8">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input
              type="text"
              placeholder="Search intended memory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={!selectedBuilding}
              className="w-full bg-white/5 border border-white/10 rounded-full py-2.5 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/50 transition-all disabled:opacity-50"
            />
          </div>

          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
              Building Orbs
            </h3>
            {CATEGORIES.map(renderOrbCategory)}
          </div>
        </div>
      </motion.div>

      <motion.button
        animate={{ right: isExpanded ? 320 : 0 }}
        transition={{ duration: 0.4, type: "spring", bounce: 0.1 }}
        onClick={() => setIsExpanded(!isExpanded)}
        className="fixed top-1/2 -translate-y-1/2 z-50 bg-[#050814] border border-white/10 border-r-0 rounded-l-xl p-2 py-6 text-gray-400 hover:text-white transition-colors shadow-2xl cursor-pointer"
      >
        {isExpanded ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
      </motion.button>
    </>
  );
}
