import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../firebase";

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ hd: "stu.srmuniversity.ac.in" });

const MEMORIES = [
  { id: 1, year: '2019', title: 'The First Day', description: 'Walking through the main gates for the very first time. The rush of anxiety and excitement mixed with the distant hum of the university blocks.', img: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&auto=format&fit=crop' },
  { id: 2, year: '2020', title: 'Late Night Projects', description: 'Coffee fueled coding sessions in the Engineering Block before the hackathon deadline. The silence of the campus at 3 AM.', img: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop' },
  { id: 3, year: '2021', title: 'The Quiet Campus', description: 'Online classes kicked in. The physical campus was empty, but our digital world was more vibrant than ever.', img: 'https://images.unsplash.com/photo-1588702545922-b25867a57c50?w=800&auto=format&fit=crop' },
  { id: 4, year: '2022', title: 'The Grand Reunion', description: 'Finally coming back. The joy of reuniting with friends at the UB Canteen and walking the familiar sunny paths.', img: 'https://images.unsplash.com/photo-1623041926617-6447c2fc9329?w=800&auto=format&fit=crop' },
  { id: 5, year: '2023', title: 'Graduation Day', description: 'Tossing the caps into the sky. The end of a grand era, leaving behind memories for the next generation to unearth.', img: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&auto=format&fit=crop' },
];

export default function LandingPage() {
  const containerRef = useRef(null);
  
  // Track scroll progress for the whole page (0 to 1)
  const { scrollYProgress } = useScroll({ 
    target: containerRef, 
    offset: ["start start", "end end"] 
  });
  
  // Smooth era transition:
  // Starts with a nostalgic sepia/light mode (#fdf6e3)
  // Transitions into a vibrant present/future dark mode (#0d2d25 - from modern palette)
  const backgroundColor = useTransform(scrollYProgress, [0, 0.4, 0.8, 1], ['#fdf6e3', '#ebdca7', '#1b4332', '#0d2d25']);
  const textColor = useTransform(scrollYProgress, [0, 0.6, 1], ['#2d2d2d', '#2d2d2d', '#edf1ed']);
  
  // SVG drawing progress down the center line (eased with spring for smoothness)
  const pathLength = useSpring(scrollYProgress, { stiffness: 400, damping: 90 });

  return (
    <motion.div 
      ref={containerRef} 
      style={{ backgroundColor, color: textColor }} 
      className="relative w-full overflow-hidden transition-colors duration-200 font-['Akkurat']"
    >
      {/* Centered Timeline SVG */}
      <div className="absolute left-1/2 top-0 bottom-0 w-[2px] -translate-x-1/2 z-0 hidden lg:block" style={{ height: "100%" }}>
        <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 2 100">
          <line x1="1" y1="0" x2="1" y2="100" stroke="rgba(128,128,128,0.2)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          <motion.line x1="1" y1="0" x2="1" y2="100" stroke="#ff6b35" strokeWidth="2" vectorEffect="non-scaling-stroke" style={{ pathLength }} />
        </svg>
      </div>

      <HeroSection scrollYProgress={scrollYProgress} />
      <MemorySection />
      <FooterSection />
    </motion.div>
  );
}

function HeroSection({ scrollYProgress }) {
  // 1. "Time-Travel" Parallax Effect
  // Different elements scroll at different speeds.
  const bgY = useTransform(scrollYProgress, [0, 0.2], ['0%', '15%']);
  const textY = useTransform(scrollYProgress, [0, 0.3], ['0%', '60%']);
  const extraParallaxY = useTransform(scrollYProgress, [0, 0.5], ['0%', '-40%']);
  const textOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);

  return (
    <section className="relative h-screen w-full flex items-center justify-center overflow-hidden px-4">
      {/* Giant faded watermark background moving slower */}
      <motion.div style={{ y: bgY }} className="absolute inset-0 z-0 flex items-center justify-center opacity-10 pointer-events-none">
        <h1 className="text-[18vw] font-black tracking-tighter select-none whitespace-nowrap">N O S T A L G I A</h1>
      </motion.div>

      {/* Foreground fast-moving aesthetic floating photos (visible on large screens) */}
      <motion.div style={{ y: extraParallaxY }} className="absolute inset-0 z-10 pointer-events-none hidden md:block">
        <div className="absolute top-[20%] left-[8%] w-56 h-72 bg-white/40 backdrop-blur-md rounded-2xl shadow-2xl rotate-[-8deg] p-3 border border-white/60">
           <img src={MEMORIES[0].img} alt="TBT" className="w-full h-full object-cover rounded-xl grayscale opacity-80" />
        </div>
        <div className="absolute bottom-[10%] right-[10%] w-64 h-56 bg-white/40 backdrop-blur-md rounded-2xl shadow-2xl rotate-[6deg] p-3 border border-white/60">
           <img src={MEMORIES[4].img} alt="Grad" className="w-full h-full object-cover rounded-xl grayscale opacity-80" />
        </div>
      </motion.div>

      {/* Main Text Content */}
      <motion.div style={{ y: textY, opacity: textOpacity }} className="relative z-20 text-center max-w-4xl mx-auto">
        <h2 className="text-sm md:text-xl font-bold tracking-[0.3em] text-[#ff6b35] uppercase mb-4 md:mb-6">Unearthing the Past</h2>
        <h1 className="text-6xl md:text-8xl lg:text-9xl font-black mb-6 leading-none tracking-tight">
          SRM Time <br/> 
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff6b35] to-[#fcd34d]">Capsule</span>
        </h1>
        <p className="max-w-2xl mx-auto text-lg md:text-2xl font-medium opacity-80 mb-16 px-4">
          Discover forgotten stories, quiet nights, and triumphant days. Scroll down to travel through time and unearth the legacy.
        </p>
        
        {/* Animated Scroll Indicator */}
        <motion.div 
          animate={{ y: [0, 15, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="flex flex-col items-center justify-center opacity-60"
        >
          <span className="text-xs font-bold uppercase tracking-[0.2em] mb-4">Scroll to Begin</span>
          <div className="w-[2px] h-16 bg-gradient-to-b from-current to-transparent"></div>
        </motion.div>
      </motion.div>
    </section>
  );
}

function MemorySection() {
  return (
    <section className="relative w-full max-w-6xl mx-auto py-24 md:py-48 px-6 z-10">
      <div className="flex flex-col gap-32 md:gap-64">
        {MEMORIES.map((memory, index) => (
          <MemoryCard key={memory.id} memory={memory} index={index} />
        ))}
      </div>
    </section>
  );
}

function MemoryCard({ memory, index }) {
  // 2. The "Unearthing" Reveal
  // Slide up and fade in only when entering the viewport
  const isEven = index % 2 === 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 150, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-15%" }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      className={`relative flex flex-col md:flex-row items-center gap-10 md:gap-20 ${isEven ? '' : 'md:flex-row-reverse'}`}
    >
      {/* Node indicator for the timeline (hidden on mobile, aligns with the center SVG line) */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden lg:flex items-center justify-center z-10 w-6 h-6 rounded-full bg-[#ff6b35] shadow-[0_0_20px_rgba(255,107,53,0.8)] border-4 border-[#fdf6e3]"></div>

      {/* Image Side */}
      <div className="w-full md:w-1/2 relative group">
         <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl ring-1 ring-black/10">
           <motion.img 
             whileHover={{ scale: 1.05 }}
             transition={{ duration: 0.8, ease: "easeOut" }}
             src={memory.img} 
             alt={memory.title} 
             className="w-full h-full object-cover filter sepia-[0.4] group-hover:sepia-0 transition-all duration-700 ease-in-out"
           />
         </div>
         {/* Floating Year Badge */}
         <div className={`absolute -top-8 ${isEven ? '-right-6 md:-right-12' : '-left-6 md:-left-12'} bg-[#ff6b35] text-white text-3xl md:text-5xl font-black py-4 px-8 rounded-2xl shadow-xl transform ${isEven ? 'rotate-[-6deg]' : 'rotate-[6deg]'} z-20`}>
           {memory.year}
         </div>
      </div>

      {/* Text Side */}
      <div className={`w-full md:w-1/2 space-y-6 ${isEven ? 'text-left md:pl-12' : 'text-left md:text-right md:pr-12'}`}>
        <h3 className="text-4xl md:text-5xl font-black">{memory.title}</h3>
        <p className="text-xl md:text-2xl opacity-80 leading-relaxed font-medium">
          {memory.description}
        </p>
      </div>
    </motion.div>
  );
}

function FooterSection() {
  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const email = result.user.email;
      if (!email.endsWith("@stu.srmuniversity.ac.in")) {
        await auth.signOut();
        alert("Only SRM students can access this!");
        return;
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <section className="relative h-screen w-full flex items-center justify-center z-10 px-6">
      <motion.div 
        initial={{ opacity: 0, y: 100 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-20%" }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="text-center w-full max-w-4xl"
      >
        <h2 className="text-5xl md:text-8xl font-black mb-8 leading-tight">The Future is <br/><span className="text-[#ff6b35]">Now</span></h2>
        <p className="text-xl md:text-3xl opacity-80 mb-16 font-medium leading-relaxed">
          You have traversed the forgotten memories.<br className="hidden md:block"/> The time capsule mechanism is ready.
        </p>
        
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleLogin}
          className="group relative inline-flex items-center justify-center bg-[#edf1ed] text-[#0d2d25] font-black text-xl md:text-2xl py-6 px-16 rounded-full overflow-hidden shadow-[0_0_40px_rgba(237,241,237,0.2)] hover:shadow-[0_0_60px_rgba(237,241,237,0.4)] transition-all duration-300"
        >
          <span className="relative z-10 transition-colors duration-300 group-hover:text-[#ff6b35]">Unlock The Map (SRM ID)</span>
          <div className="absolute inset-0 h-full w-full scale-0 rounded-full bg-gradient-to-r from-[#0d2d25] to-[#1b4332] transition-transform duration-300 ease-out group-hover:scale-110"></div>
        </motion.button>
      </motion.div>
    </section>
  );
}
