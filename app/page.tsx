"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 selection:bg-blue-500/30 overflow-hidden">
      
      {/* ===================== BLUE HERO SECTION ===================== */}
      <div className="relative bg-[#023b7a] overflow-hidden text-white pt-6 pb-20 lg:rounded-br-[8rem] shadow-xl">
        {/* Background diagonal accents replicating the reference */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute w-[120%] h-[150%] bg-[#074791] -rotate-12 -top-[60%] -left-[10%] opacity-80 mix-blend-screen"></div>
          <div className="absolute w-[80%] h-[120%] bg-[#0f53a1] rotate-12 -bottom-[40%] -right-[10%] opacity-80 mix-blend-screen"></div>
          <div className="absolute w-[50%] h-[200%] bg-blue-400/10 rotate-45 -top-[50%] left-[20%]"></div>
        </div>

        {/* Top Navbar overlapping the blue background */}
        <header className="relative z-50 max-w-7xl mx-auto px-4 sm:px-6 mb-12 sm:mb-16 pt-2 sm:pt-4">
          <div className="flex items-center justify-between w-full h-16">
            
            {/* Logo Section */}
            <Link href="/" className="flex items-center gap-3 group z-50">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl shadow-[0_4px_15px_rgba(255,255,255,0.2)] flex items-center justify-center p-1.5 transition-transform group-hover:scale-105">
                 {/* Replicating the 'scanner eye' icon from screenshot using CSS */}
                 <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg relative flex items-center justify-center overflow-hidden border border-blue-100">
                    <div className="absolute inset-0 flex items-center justify-center">
                       <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center">
                         <div className="w-3 h-3 sm:w-4 sm:h-4 bg-[#023b7a] rounded-full relative">
                           <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white font-bold leading-none text-[8px] sm:text-[10px]">+</span>
                         </div>
                       </div>
                    </div>
                    {/* Reticle corner marks mock */}
                    <div className="absolute top-1.5 left-1.5 w-1 h-1 border-t-2 border-l-2 border-blue-400"></div>
                    <div className="absolute top-1.5 right-1.5 w-1 h-1 border-t-2 border-r-2 border-blue-400"></div>
                    <div className="absolute bottom-1.5 left-1.5 w-1 h-1 border-b-2 border-l-2 border-blue-400"></div>
                    <div className="absolute bottom-1.5 right-1.5 w-1 h-1 border-b-2 border-r-2 border-blue-400"></div>
                 </div>
              </div>
              <div className="flex flex-col">
                <span className="text-lg sm:text-2xl font-bold tracking-tight text-white leading-tight">
                  Onelife<span className="text-blue-300">.ai</span>
                </span>
                <span className="text-[10px] sm:text-xs text-blue-200/80 uppercase tracking-widest font-semibold flex items-center gap-1">Skin Scanner</span>
              </div>
            </Link>
            
            {/* Right Side Navigation elements */}
            <div className="flex items-center gap-4 sm:gap-6">
              
              {/* Desktop Menu */}
              <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-white/90">
                <Link href="#clinical-mode" className="hover:text-white transition-colors">Clinical Tech</Link>
                <Link href="#dermatology-library" className="hover:text-white transition-colors">Skin Library</Link>
                <Link href="#api-access" className="hover:text-white transition-colors">Developer API</Link>
                <Link href="/register" className="hover:text-white transition-colors font-bold px-4 py-2 border border-blue-400/30 rounded-full hover:bg-white/10">Sign Up</Link>
                <Link href="/login" className="hover:text-white transition-colors bg-white/10 px-4 py-2 rounded-full hover:bg-white/20">Sign In</Link>
              </nav>

              {/* Lang Block exactly like mobile screenshot */}
              <div className="flex flex-col md:flex-row md:items-center text-white/90 font-medium text-right text-sm leading-tight gap-0 md:gap-1 z-50">
                 <span className="text-xs sm:text-sm">Lang:</span>
                 <span className="font-bold sm:font-medium">En</span>
              </div>

              {/* Hamburger Toggle */}
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
                className="lg:hidden w-8 h-8 flex flex-col justify-center items-center gap-1.5 z-50 relative focus:outline-none"
              >
                <span className={`w-6 h-0.5 bg-white transition-all duration-300 ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
                <span className={`w-6 h-0.5 bg-white transition-all duration-300 ${mobileMenuOpen ? 'opacity-0' : ''}`}></span>
                <span className={`w-6 h-0.5 bg-white transition-all duration-300 ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
              </button>
            </div>
          </div>
          
          {/* Mobile Overlay Menu */}
          <div className={`fixed inset-0 bg-[#023b7a]/95 backdrop-blur-xl z-40 lg:hidden flex flex-col items-center justify-center transition-all duration-300 ${mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
             <nav className="flex flex-col items-center gap-8 text-xl font-bold text-white">
                <Link onClick={() => setMobileMenuOpen(false)} href="#clinical-mode" className="hover:text-blue-300">Clinical Tech</Link>
                <Link onClick={() => setMobileMenuOpen(false)} href="#dermatology-library" className="hover:text-blue-300">Skin Library</Link>
                <Link onClick={() => setMobileMenuOpen(false)} href="#api-access" className="hover:text-blue-300">Developer API</Link>
                <div className="h-px w-32 bg-white/20 my-2"></div>
                <Link onClick={() => setMobileMenuOpen(false)} href="/register" className="text-blue-200">Create Account</Link>
                <Link onClick={() => setMobileMenuOpen(false)} href="/login" className="bg-[#ff1e38] px-8 py-3 rounded-full text-white mt-2 shadow-lg shadow-red-500/30">Sign In</Link>
             </nav>
          </div>

        </header>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 flex flex-col lg:grid lg:grid-cols-2 lg:gap-8 lg:items-center">
          
          {/* 1. Header Text Container */}
          <div className="w-full lg:pr-8 xl:pr-12 order-1 lg:col-start-1 lg:row-start-1 lg:self-end pt-4 lg:pt-0">
            <h2 className="text-4xl md:text-5xl lg:text-5xl font-extrabold mb-4 lg:mb-8 tracking-tight leading-tight mt-6 lg:mt-0">Analyze your skin health.</h2>
            <p className="text-blue-100 text-base sm:text-lg mb-0 max-w-lg">Get immediate, AI-driven insights on your skin concerns before stepping into a doctor's office.</p>
          </div>
          
          {/* 2. Hero Images Container (Between Text & Cards on Mobile) */}
          <div className="w-full order-2 lg:col-start-2 lg:row-start-1 lg:row-span-2 relative h-[380px] sm:h-[450px] lg:h-[500px] flex justify-center perspective-[1000px] my-10 lg:my-0 lg:ml-6">
             
            <style>{`
              @keyframes float-left {
                0%, 100% { transform: translateY(0px) rotate(-6deg); }
                50% { transform: translateY(-15px) rotate(-4deg); box-shadow: 0 15px 30px -10px rgba(0, 0, 0, 0.5); }
              }
              @keyframes float-right {
                0%, 100% { transform: translateY(0px) rotate(4deg); }
                50% { transform: translateY(15px) rotate(2deg); box-shadow: 0 15px 30px -10px rgba(0, 0, 0, 0.5); }
              }
              .animate-screen-left { animation: float-left 7s ease-in-out infinite; }
              .animate-screen-right { animation: float-right 8s ease-in-out infinite; }
              @media (min-width: 640px) {
                @keyframes float-left {
                  0%, 100% { transform: translateY(0px) rotate(-6deg); }
                  50% { transform: translateY(-25px) rotate(-4deg); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
                }
                @keyframes float-right {
                  0%, 100% { transform: translateY(0px) rotate(4deg); }
                  50% { transform: translateY(20px) rotate(2deg); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
                }
              }
            `}</style>
             
            {/* Background glowing orb behind the screens */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 sm:w-80 sm:h-80 bg-blue-500/30 rounded-full blur-[60px] sm:blur-[80px] z-0"></div>

            {/* LEFT SCREEN (Back) */}
            <div className="absolute top-4 sm:top-10 left-2 sm:left-4 w-[55%] sm:w-64 h-[280px] sm:h-[350px] lg:h-96 rounded-3xl sm:rounded-[2.5rem] overflow-hidden shadow-2xl border-4 sm:border-[6px] border-slate-800/80 animate-screen-left z-10 bg-slate-900">
               {/* Screen Content Mockup */}
               <Image src="/img/ACENSKIN.png" alt="Scan Interface" fill className="object-cover opacity-60" priority />
               <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#023b7a]/90"></div>
               
               {/* UI Elements on Left Screen */}
               <div className="relative z-10 h-full flex flex-col justify-between p-3 sm:p-5">
                 <div className="flex justify-between items-center">
                   <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                      <span className="material-icons text-white text-[12px] sm:text-lg">menu</span>
                   </div>
                   <div className="w-8 h-3 sm:w-10 sm:h-4 bg-white/30 rounded-full backdrop-blur"></div>
                 </div>
                 
                 <div className="bg-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl p-2 sm:p-4 border border-white/20">
                   <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2 text-xs">
                     <span className="material-icons text-teal-400 text-sm sm:text-xl animate-spin">radar</span>
                     <p className="text-white text-[9px] sm:text-xs font-bold tracking-wider">SCANNING</p>
                   </div>
                   <div className="w-full bg-white/20 h-1 sm:h-1.5 rounded-full overflow-hidden">
                     <div className="w-2/3 h-full bg-teal-400 rounded-full"></div>
                   </div>
                 </div>
               </div>
            </div>
             
            {/* RIGHT SCREEN (Front) */}
            <div className="absolute top-16 sm:top-24 right-2 sm:right-4 w-[60%] sm:w-72 h-[290px] sm:h-[360px] lg:h-[420px] rounded-3xl sm:rounded-[2.5rem] overflow-hidden shadow-[0_15px_30px_rgba(0,0,0,0.5)] border-4 sm:border-[6px] border-white animate-screen-right z-20 bg-white">
               {/* Screen Content Mockup */}
               <div className="h-[60%] relative">
                 <Image src="/img/ACENSKIN.png" alt="Analysed Result" fill className="object-cover" priority />
                 {/* Reticle Overlay on Right Screen */}
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 border border-green-400 border-dashed rounded bg-green-400/10 flex items-center justify-center">
                    <span className="material-icons text-green-400 text-3xl sm:text-5xl">center_focus_weak</span>
                 </div>
               </div>
               
               {/* UI Elements on Right Screen */}
               <div className="h-[40%] bg-white p-3 sm:p-5 flex flex-col justify-center relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-50 to-transparent rounded-bl-[100px] z-0"></div>
                 
                 <div className="flex items-center gap-3 mb-3 relative z-10">
                   <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-50 flex items-center justify-center border border-blue-200 shadow-sm shrink-0">
                      <span className="material-icons text-blue-600 text-lg sm:text-xl">healing</span>
                   </div>
                   <div className="flex-1">
                     <h4 className="font-black text-slate-800 text-[11px] sm:text-[14px] leading-tight mb-0.5 flex items-center gap-1">
                        Acne Severity
                        <span className="material-icons text-blue-500 text-[12px] sm:text-[14px]">verified</span>
                     </h4>
                     <p className="text-[9px] sm:text-xs text-blue-600 font-bold tracking-tight">99.8% Neural Match</p>
                   </div>
                 </div>
                 
                 <div className="w-full bg-slate-50/80 rounded-lg p-2 sm:p-3 flex justify-between items-center border border-slate-200 shadow-inner relative z-10">
                    <span className="text-[9px] sm:text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Risk Level:</span>
                    <span className="bg-red-50 border border-red-200 text-red-600 text-[9px] sm:text-[10px] font-black px-2 py-1 rounded-[6px] uppercase tracking-widest shadow-sm flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.8)] animate-pulse"></span> Elevated
                    </span>
                 </div>
               </div>
            </div>

          </div>
          
          {/* 3. Steps and CTA Button (Mobile: Bottom, Desktop: Bottom-Left) */}
          <div className="w-full lg:pr-8 xl:pr-12 order-3 lg:col-start-1 lg:row-start-2 mt-2 lg:mt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 lg:mb-10">
              {/* Card 1 */}
              <div className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-2xl hover:bg-white/10 transition-colors transform hover:-translate-y-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-400/20 flex items-center justify-center text-blue-300">
                    <span className="material-icons text-lg">cloud_upload</span>
                  </div>
                  <span className="text-[10px] font-bold tracking-widest text-blue-300/80 uppercase">Step 01</span>
                </div>
                <h3 className="font-bold text-white text-base mb-1">Secure Upload</h3>
                <p className="text-xs text-blue-100/70 leading-relaxed">Snap or upload a clear, focused photo of your mole or lesion privately.</p>
              </div>

              {/* Card 2 */}
              <div className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-2xl hover:bg-white/10 transition-colors transform hover:-translate-y-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-400/20 flex items-center justify-center text-teal-300">
                    <span className="material-icons text-lg">psychology</span>
                  </div>
                  <span className="text-[10px] font-bold tracking-widest text-teal-300/80 uppercase">Step 02</span>
                </div>
                <h3 className="font-bold text-white text-base mb-1">Neural Scan</h3>
                <p className="text-xs text-blue-100/70 leading-relaxed">Our advanced algorithm assesses topography, pigment, and borders.</p>
              </div>

              {/* Card 3 */}
              <div className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-2xl hover:bg-white/10 transition-colors transform hover:-translate-y-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-400/20 flex items-center justify-center text-indigo-300">
                    <span className="material-icons text-lg">dataset</span>
                  </div>
                  <span className="text-[10px] font-bold tracking-widest text-indigo-300/80 uppercase">Step 03</span>
                </div>
                <h3 className="font-bold text-white text-base mb-1">Clinical Matching</h3>
                <p className="text-xs text-blue-100/70 leading-relaxed">Patterns are instantly cross-referenced against 100k+ clinical datasets.</p>
              </div>

              {/* Card 4 */}
              <div className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-2xl hover:bg-white/10 transition-colors transform hover:-translate-y-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-400/20 flex items-center justify-center text-rose-300">
                    <span className="material-icons text-lg">query_stats</span>
                  </div>
                  <span className="text-[10px] font-bold tracking-widest text-rose-300/80 uppercase">Step 04</span>
                </div>
                <h3 className="font-bold text-white text-base mb-1">Risk Profile</h3>
                <p className="text-xs text-blue-100/70 leading-relaxed">View your comprehensive probability report and recommended actions.</p>
              </div>
            </div>

            <Link href="/predict" className="inline-flex items-center justify-center w-full sm:w-auto bg-[#ff1e38] hover:bg-[#ff0020] text-white font-black text-sm px-10 py-4 sm:py-5 rounded-full shadow-[0_8px_25px_rgba(255,30,56,0.5)] hover:shadow-[0_12px_30px_rgba(255,30,56,0.6)] hover:-translate-y-1 transition-all uppercase tracking-widest text-center">
              GET INSTANT RESULT
            </Link>
            
            <p className="text-[10px] sm:text-xs text-blue-200 mt-6 sm:mt-8 opacity-80 max-w-lg leading-relaxed mb-6 lg:mb-0">
              * The scan result is not a diagnosis. To obtain an accurate diagnosis and a treatment recommendation, consult your doctor.
            </p>
          </div>

        </div>
      </div>
        {/* ===================== LOGO CLOUD / CREDIBILITY (SMALL SIZE) ===================== */}
        <section className="bg-gradient-to-b from-slate-50 to-white py-8 mb-16 sm:mb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 sm:mb-5 text-center px-4">Designed around cutting edge standards</p>
            
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 lg:gap-6">
               
               {/* Small Badge 1 */}
               <div className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-white rounded-full border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-default">
                 <div className="w-5 h-5 sm:w-7 sm:h-7 bg-orange-50 rounded-full flex items-center justify-center border border-orange-100/50">
                   <span className="material-icons text-orange-500 text-[12px] sm:text-[15px]">hub</span>
                 </div>
                 <span className="text-[10px] sm:text-[13px] font-bold text-slate-700 tracking-tight">TensorFlow</span>
               </div>
               
               {/* Small Badge 2 */}
               <div className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-white rounded-full border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-default">
                 <div className="w-5 h-5 sm:w-7 sm:h-7 bg-blue-50 rounded-full flex items-center justify-center border border-blue-100/50">
                   <span className="material-icons text-blue-500 text-[12px] sm:text-[15px]">verified</span>
                 </div>
                 <span className="text-[10px] sm:text-[13px] font-bold text-slate-700 tracking-tight">HIPAA Ready</span>
               </div>

               {/* Small Badge 3 */}
               <div className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-white rounded-full border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-default">
                 <div className="w-5 h-5 sm:w-7 sm:h-7 bg-purple-50 rounded-full flex items-center justify-center border border-purple-100/50">
                   <span className="material-icons text-purple-600 text-[12px] sm:text-[15px]">psychology</span>
                 </div>
                 <span className="text-[10px] sm:text-[13px] font-bold text-slate-700 tracking-tight">Deep Learning</span>
               </div>

               {/* Small Badge 4 */}
               <div className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-white rounded-full border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-default">
                 <div className="w-5 h-5 sm:w-7 sm:h-7 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-100/50">
                   <span className="material-icons text-emerald-500 text-[12px] sm:text-[15px]">security</span>
                 </div>
                 <span className="text-[10px] sm:text-[13px] font-bold text-slate-700 tracking-tight">SSL Encrypted</span>
               </div>

            </div>
          </div>
        </section>

        {/* ===================== PREMIUM BENTO BOX FEATURES ===================== */}
        <section id="features" className="max-w-7xl mx-auto px-6 mb-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-6">Why our technology stands out</h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-lg">We employ state-of-the-art convolutional neural networks trained on vast dermatological datasets to bring precision analytics to your fingertips.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 - Large spanning */}
            <div className="md:col-span-2 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-10 text-white relative overflow-hidden shadow-xl shadow-blue-900/10 group">
              <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
              <span className="material-icons text-5xl mb-6 text-blue-200">model_training</span>
              <h3 className="text-2xl font-bold mb-3">Extensive Clinical Training Data</h3>
              <p className="text-blue-100 max-w-md leading-relaxed text-lg">Our AI engine synthesizes patterns from thousands of verified clinical images, allowing it to recognize the subtle nuances of dermatological conditions with exceptional accuracy.</p>
              
              {/* Abstract decorative element */}
              <div className="absolute right-10 bottom-10 hidden sm:flex items-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                <div className="w-3 h-12 bg-white rounded-t-sm animate-pulse"></div>
                <div className="w-3 h-24 bg-white rounded-t-sm animate-pulse" style={{animationDelay: '100ms'}}></div>
                <div className="w-3 h-16 bg-white rounded-t-sm animate-pulse" style={{animationDelay: '200ms'}}></div>
                <div className="w-3 h-32 bg-white rounded-t-sm animate-pulse" style={{animationDelay: '300ms'}}></div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-3xl p-10 border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-slate-200/60 transition-all">
              <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center mb-6 border border-teal-100">
                <span className="material-icons text-teal-500 text-3xl">speed</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Lightning Fast</h3>
              <p className="text-slate-500 leading-relaxed">Experience a seamless workflow. Get robust probability assessments in milliseconds without waiting in line.</p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-3xl p-10 border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-slate-200/60 transition-all">
              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 border border-slate-100">
                <span className="material-icons text-slate-600 text-3xl">health_and_safety</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Broad Spectrum</h3>
              <p className="text-slate-500 leading-relaxed">Identifies categorizations ranging from benign moles and eczema to complex carcinomas and melanomas.</p>
            </div>

            {/* Feature 4 - Large spanning */}
            <div className="md:col-span-2 bg-white rounded-3xl p-10 border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col sm:flex-row items-center justify-between gap-8 hover:shadow-2xl hover:shadow-slate-200/60 transition-all">
              <div className="flex-1">
                <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center mb-6 border border-rose-100">
                  <span className="material-icons text-rose-500 text-3xl">enhanced_encryption</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Total Privacy Assurance</h3>
                <p className="text-slate-500 leading-relaxed text-lg">Your health data is exclusively yours. Images are processed statelessly ensuring absolutely no personal medical footprints are stored on our servers.</p>
              </div>
              <div className="w-full sm:w-1/3 shrink-0 flex justify-center">
                 <div className="w-32 h-32 rounded-full border-8 border-slate-50 flex items-center justify-center shadow-inner relative">
                    <span className="material-icons text-5xl text-slate-300">lock</span>
                    {/* decorative circling ring */}
                    <svg className="absolute inset-0 w-full h-full animate-[spin_10s_linear_infinite]" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="46" fill="none" stroke="#e2e8f0" strokeWidth="2" strokeDasharray="10 10"></circle>
                    </svg>
                 </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===================== HOW IT WORKS / TIMELINE ===================== */}
        <section id="how-it-works" className="py-24 bg-slate-900 text-white relative overflow-hidden">
          {/* Abstract background */}
          <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
             <Image src="/body_model.png" alt="body background" fill className="object-cover" />
          </div>
          <div className="absolute inset-0 bg-slate-900/90 z-0"></div>

          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="flex flex-col lg:flex-row gap-20">
              
              <div className="lg:w-1/3">
                <h2 className="text-3xl md:text-5xl font-bold mb-6">How Onelife works</h2>
                <p className="text-slate-400 text-lg mb-8">Three incredibly simple steps bridge the gap between uncertainty and actionable awareness.</p>
                <Link href="/predict" className="inline-flex items-center justify-center gap-2 bg-white text-slate-900 font-bold px-8 py-4 rounded-full hover:bg-slate-100 transition-colors">
                  Try it yourself <span className="material-icons text-sm">arrow_forward</span>
                </Link>
              </div>
              
              <div className="lg:w-2/3">
                <div className="space-y-12">
                  
                  {/* Step 1 */}
                  <div className="flex gap-6 group">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-xl font-bold text-white group-hover:border-blue-500 group-hover:bg-blue-600 transition-colors z-10">1</div>
                      <div className="w-0.5 h-full bg-slate-800 my-2"></div>
                    </div>
                    <div className="pb-8">
                      <h3 className="text-2xl font-bold mb-3">Capture or Upload</h3>
                      <p className="text-slate-400 text-lg">Use a well-lit environment to take a clear, focused photo of the concerning skin area. Maximum file sizes up to 10MB are supported instantly.</p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex gap-6 group">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-xl font-bold text-white group-hover:border-blue-500 group-hover:bg-blue-600 transition-colors z-10">2</div>
                      <div className="w-0.5 h-full bg-slate-800 my-2"></div>
                    </div>
                    <div className="pb-8">
                      <h3 className="text-2xl font-bold mb-3">AI Deep Analysis</h3>
                      <p className="text-slate-400 text-lg">Our proprietary model scans the image geometry, analyzing pigmentation distribution, edge irregularity, and other dermatological identifiers.</p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex gap-6 group">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-xl font-bold text-white group-hover:border-blue-500 group-hover:bg-blue-600 transition-colors z-10">3</div>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold mb-3">Actionable Insights</h3>
                      <p className="text-slate-400 text-lg">Receive a comprehensive probability breakdown. Use these fast insights to determine if a professional dermatological consultation is advised.</p>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ===================== CTA & MISSION ===================== */}
        <section id="about" className="max-w-5xl mx-auto px-4 sm:px-6 mt-16 sm:mt-32 text-center">
           <div className="bg-gradient-to-tr from-blue-50 to-teal-50 border border-blue-100 rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-12 md:p-20 shadow-2xl shadow-blue-900/5 relative overflow-hidden">
             
             <div className="absolute top-0 right-0 w-32 h-32 sm:w-64 sm:h-64 bg-white rounded-full blur-2xl sm:blur-3xl opacity-60 pointer-events-none"></div>
             
             <div className="relative z-10">
               <span className="material-icons text-blue-500 text-4xl sm:text-6xl mb-4 sm:mb-6 bg-white p-3 sm:p-4 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100">favorite</span>
               <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 sm:mb-6 leading-tight">Empowering preventive care.</h2>
               <p className="text-slate-600 text-base sm:text-lg md:text-xl leading-relaxed mb-8 sm:mb-10 max-w-3xl mx-auto">
                 We believe that early detection shouldn't be a privilege. By leveraging powerful artificial intelligence, we aim to provide an accessible first layer of skin-health awareness to everyone.
               </p>
               
               <Link href="/predict" className="inline-block w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold text-base sm:text-lg px-8 sm:px-12 py-4 sm:py-5 rounded-full shadow-lg shadow-blue-600/30 transition-all transform hover:-translate-y-1">
                 Launch Analyzer Interface
               </Link>

               <div className="mt-8 sm:mt-12 inline-block bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs sm:text-sm px-4 sm:px-6 py-3 sm:py-4 rounded-xl text-left max-w-2xl w-full">
                 <p className="font-bold mb-1 sm:mb-2 flex items-start sm:items-center gap-2">
                   <span className="material-icons text-base sm:text-lg text-yellow-600 mt-0.5 sm:mt-0 shrink-0">warning</span> 
                   <span>Important Medical Disclaimer</span>
                 </p>
                 <p className="opacity-90 leading-relaxed font-medium">Onelife.ai is a software tool intended strictly for informational and educational purposes. It does not provide medical diagnoses and should never replace consultation with a certified physician or dermatologist.</p>
               </div>
             </div>
           </div>
        </section>

      {/* ===================== FOOTER ===================== */}
      <footer className="w-full border-t border-slate-200 bg-white py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between text-slate-500 text-sm">
          <Link href="/" className="flex items-center gap-2 font-bold text-slate-800 mb-4 md:mb-0">
            <span className="material-icons text-blue-600">biotech</span>
            Onelife.ai
          </Link>
          <p>© {new Date().getFullYear()} Onelife AI Project. All rights reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0 font-medium">
            <Link href="#" className="hover:text-blue-600 transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-blue-600 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>
      
    </div>
  )
}