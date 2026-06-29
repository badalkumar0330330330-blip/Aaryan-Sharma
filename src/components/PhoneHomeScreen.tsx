import React, { useState, useEffect } from "react";
import { 
  Wifi, 
  Bluetooth, 
  Moon, 
  Plane, 
  Battery, 
  BatteryCharging, 
  Volume2, 
  VolumeX, 
  Sun, 
  Search, 
  MessageSquare, 
  Settings, 
  Mic, 
  MicOff, 
  X, 
  Youtube, 
  Music, 
  MessageCircle, 
  MapPin, 
  Zap,
  RotateCcw,
  Smartphone,
  ChevronDown,
  ChevronUp,
  Sliders,
  Sparkles,
  Lock
} from "lucide-react";

interface PhoneHomeScreenProps {
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  onZoyaCommand: (command: string) => void;
  onToggleSession: () => void;
  isSessionActive: boolean;
  appState: string;
  onOpenSettings: () => void;
  onClose: () => void;

  isWifiOn: boolean;
  setIsWifiOn: (val: boolean) => void;
  isBluetoothOn: boolean;
  setIsBluetoothOn: (val: boolean) => void;
  isDndOn: boolean;
  setIsDndOn: (val: boolean) => void;
  isAirplaneMode: boolean;
  setIsAirplaneMode: (val: boolean) => void;
  isFlashlightOn: boolean;
  setIsFlashlightOn: (val: boolean) => void;
  isBatteryCharging: boolean;
  setIsBatteryCharging: (val: boolean) => void;
  isBatterySaver: boolean;
  setIsBatterySaver: (val: boolean) => void;
  batteryLevel: number;
  setBatteryLevel: (val: number | ((prev: number) => number)) => void;
  brightness: number;
  setBrightness: (val: number | ((prev: number) => number)) => void;
  phoneVolume: number;
  setPhoneVolume: (val: number | ((prev: number) => number)) => void;
  isPhoneLocked: boolean;
  setIsPhoneLocked: (val: boolean) => void;
}

const WALLPAPERS = [
  { name: "Cyberpunk Violet", class: "bg-gradient-to-tr from-indigo-950 via-[#0e0024] to-[#3a0050]" },
  { name: "Cosmic Nebula", class: "bg-gradient-to-tr from-slate-950 via-purple-950 to-pink-950" },
  { name: "Midnight Mint", class: "bg-gradient-to-tr from-[#05110d] via-[#091f18] to-emerald-950" },
  { name: "Neon Sunset", class: "bg-gradient-to-tr from-[#2c0b1a] via-[#160a2c] to-[#04040c]" }
];

export default function PhoneHomeScreen({
  isMuted,
  setIsMuted,
  onZoyaCommand,
  onToggleSession,
  isSessionActive,
  appState,
  onOpenSettings,
  onClose,

  isWifiOn,
  setIsWifiOn,
  isBluetoothOn,
  setIsBluetoothOn,
  isDndOn,
  setIsDndOn,
  isAirplaneMode,
  setIsAirplaneMode,
  isFlashlightOn,
  setIsFlashlightOn,
  isBatteryCharging,
  setIsBatteryCharging,
  isBatterySaver,
  setIsBatterySaver,
  batteryLevel,
  setBatteryLevel,
  brightness,
  setBrightness,
  phoneVolume,
  setPhoneVolume,
  isPhoneLocked,
  setIsPhoneLocked
}: PhoneHomeScreenProps) {
  // Time state
  const [time, setTime] = useState("");
  
  // UI Panels inside phone
  const [isControlCenterOpen, setIsControlCenterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [wallpaperIndex, setWallpaperIndex] = useState(0);
  
  // Dialog inside Phone screen
  const [activeAppDialog, setActiveAppDialog] = useState<"youtube" | "spotify" | "whatsapp" | "maps" | null>(null);
  const [dialogInput, setDialogInput] = useState("");
  const [dialogTarget, setDialogTarget] = useState("");

  // Update real-time clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      setTime(`${hours}:${minutes} ${ampm}`);
    };
    
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Sync isMuted from prop to phone volume state
  useEffect(() => {
    setPhoneVolume(isMuted ? 0 : 80);
  }, [isMuted]);

  const handleVolumeChange = (val: number) => {
    setPhoneVolume(val);
    if (val === 0) {
      setIsMuted(true);
    } else {
      setIsMuted(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    onZoyaCommand(searchQuery);
    setSearchQuery("");
  };

  const handleAppLaunch = (app: "youtube" | "spotify" | "whatsapp" | "maps") => {
    setActiveAppDialog(app);
    setDialogInput("");
    setDialogTarget("");
  };

  const executeAppAction = () => {
    if (!dialogInput.trim()) return;
    let cmd = "";
    if (activeAppDialog === "youtube") {
      cmd = `open youtube search ${dialogInput}`;
    } else if (activeAppDialog === "spotify") {
      cmd = `play ${dialogInput} on spotify`;
    } else if (activeAppDialog === "whatsapp") {
      cmd = `send whatsapp to ${dialogTarget || "friend"}: ${dialogInput}`;
    } else if (activeAppDialog === "maps") {
      cmd = `open maps for ${dialogInput}`;
    }
    onZoyaCommand(cmd);
    setActiveAppDialog(null);
  };

  const currentWallpaper = WALLPAPERS[wallpaperIndex];

  return (
    <div 
      id="phone-control-container"
      className="relative flex flex-col items-center justify-center p-1 select-none pointer-events-auto w-full max-w-[340px] aspect-[9/19] bg-[#0c0c10] border-4 border-neutral-800 rounded-[48px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] ring-1 ring-white/10"
    >
      {/* Speaker grill notch & Camera hole */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-40 flex items-center justify-center gap-1.5 px-3">
        <div className="w-10 h-1 bg-neutral-800 rounded-full" />
        <div className="w-2.5 h-2.5 bg-neutral-900 rounded-full border border-neutral-800 flex items-center justify-center">
          <div className="w-1 h-1 bg-[#1a2d54] rounded-full" />
        </div>
      </div>

      {/* Screen Container */}
      <div 
        className={`relative w-full h-full rounded-[42px] overflow-hidden flex flex-col justify-between transition-all duration-300 ${currentWallpaper.class}`}
        style={{ filter: `brightness(${brightness}%)` }}
      >
        {/* Flashlight/Torch glow effect */}
        {isFlashlightOn && (
          <div className="absolute inset-0 bg-amber-100/15 pointer-events-none z-30 animate-pulse mix-blend-screen" />
        )}

        {/* Status Bar */}
        <div 
          onClick={() => setIsControlCenterOpen(!isControlCenterOpen)}
          className="w-full h-11 flex justify-between items-center px-6 pt-2 z-30 cursor-pointer hover:bg-white/5 active:bg-white/10 transition-colors"
        >
          {/* Status Bar Left: Real Time */}
          <span className="text-[11px] font-mono font-medium tracking-wide text-white/90">
            {time}
          </span>
          
          {/* Status Bar Right: Network Icons */}
          <div className="flex items-center gap-1.5 text-white/90">
            {isAirplaneMode ? (
              <Plane size={11} className="text-white/70" />
            ) : (
              <>
                {isWifiOn && <Wifi size={11} className="text-white" />}
                {isBluetoothOn && <Bluetooth size={11} className="text-white/80" />}
                <span className="text-[9px] font-bold font-mono tracking-tighter">5G</span>
              </>
            )}
            
            {/* Battery Indicator */}
            <div 
              className="flex items-center gap-0.5 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                if (batteryLevel <= 20) {
                  setBatteryLevel(100);
                  setIsBatterySaver(false);
                } else {
                  setBatteryLevel(prev => Math.max(10, prev - 25));
                }
              }}
            >
              {isBatteryCharging ? (
                <BatteryCharging size={13} className="text-emerald-400" />
              ) : (
                <Battery size={13} className={batteryLevel <= 20 ? "text-red-400" : isBatterySaver ? "text-yellow-400" : "text-white"} />
              )}
              <span className="text-[9px] font-mono">{batteryLevel}%</span>
            </div>
          </div>
        </div>

        {/* Quick Settings Dropdown (Control Center) */}
        {isControlCenterOpen && (
          <div className="absolute inset-x-2 top-12 max-h-[85%] bg-neutral-950/95 backdrop-blur-2xl border border-white/10 rounded-3xl z-40 p-4 shadow-2xl flex flex-col gap-3 transition-all duration-300 select-none">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <span className="text-[10px] uppercase tracking-wider text-white/40 font-mono flex items-center gap-1">
                <Sliders size={10} className="text-violet-400" />
                All Control System
              </span>
              <button 
                onClick={() => setIsControlCenterOpen(false)}
                className="text-white/50 hover:text-white p-1"
              >
                <ChevronUp size={14} />
              </button>
            </div>

            {/* Quick Toggle Grid */}
            <div className="grid grid-cols-4 gap-2">
              {/* Wi-Fi Toggle */}
              <button 
                onClick={() => setIsWifiOn(!isWifiOn)}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${
                  isWifiOn 
                    ? "bg-violet-600 border-violet-500 text-white" 
                    : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10"
                }`}
              >
                <Wifi size={14} />
                <span className="text-[8px] mt-1 font-mono">Wi-Fi</span>
              </button>

              {/* Bluetooth Toggle */}
              <button 
                onClick={() => setIsBluetoothOn(!isBluetoothOn)}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${
                  isBluetoothOn 
                    ? "bg-cyan-600 border-cyan-500 text-white" 
                    : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10"
                }`}
              >
                <Bluetooth size={14} />
                <span className="text-[8px] mt-1 font-mono">BT</span>
              </button>

              {/* DND Toggle */}
              <button 
                onClick={() => setIsDndOn(!isDndOn)}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${
                  isDndOn 
                    ? "bg-pink-600 border-pink-500 text-white animate-pulse" 
                    : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10"
                }`}
              >
                <Moon size={14} />
                <span className="text-[8px] mt-1 font-mono">DND</span>
              </button>

              {/* Airplane Mode Toggle */}
              <button 
                onClick={() => setIsAirplaneMode(!isAirplaneMode)}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${
                  isAirplaneMode 
                    ? "bg-amber-600 border-amber-500 text-white" 
                    : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10"
                }`}
              >
                <Plane size={14} />
                <span className="text-[8px] mt-1 font-mono">Flight</span>
              </button>

              {/* Flashlight Toggle */}
              <button 
                onClick={() => setIsFlashlightOn(!isFlashlightOn)}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${
                  isFlashlightOn 
                    ? "bg-yellow-500 border-yellow-400 text-neutral-900" 
                    : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10"
                }`}
              >
                <Zap size={14} />
                <span className="text-[8px] mt-1 font-mono">Torch</span>
              </button>

              {/* Battery Saver */}
              <button 
                onClick={() => setIsBatterySaver(!isBatterySaver)}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${
                  isBatterySaver 
                    ? "bg-emerald-600 border-emerald-500 text-white" 
                    : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10"
                }`}
              >
                <Battery size={14} />
                <span className="text-[8px] mt-1 font-mono">Saver</span>
              </button>

              {/* Simulated Charge Toggle */}
              <button 
                onClick={() => setIsBatteryCharging(!isBatteryCharging)}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all col-span-2 ${
                  isBatteryCharging 
                    ? "bg-green-600 border-green-500 text-white" 
                    : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10"
                }`}
              >
                <BatteryCharging size={14} />
                <span className="text-[8px] mt-0.5 font-mono">USB Charging</span>
              </button>
            </div>

            {/* Sliders Area */}
            <div className="space-y-2 mt-1">
              {/* Brightness Slider */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[9px] text-white/50 font-mono">
                  <span className="flex items-center gap-1">
                    <Sun size={10} /> Brightness
                  </span>
                  <span>{brightness}%</span>
                </div>
                <input 
                  type="range"
                  min="30"
                  max="100"
                  value={brightness}
                  onChange={(e) => setBrightness(parseInt(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-violet-400"
                />
              </div>

              {/* Volume Slider */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[9px] text-white/50 font-mono">
                  <span className="flex items-center gap-1">
                    {phoneVolume === 0 ? <VolumeX size={10} /> : <Volume2 size={10} />} System Volume
                  </span>
                  <span>{phoneVolume}%</span>
                </div>
                <input 
                  type="range"
                  min="0"
                  max="100"
                  value={phoneVolume}
                  onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>
            </div>

            {/* Diagnostics info */}
            <div className="bg-white/5 p-2 rounded-xl text-[9px] text-white/50 space-y-1 font-mono border border-white/5">
              <div className="flex justify-between">
                <span>Database Sync:</span>
                <span className="text-cyan-400 font-bold">ONLINE</span>
              </div>
              <div className="flex justify-between">
                <span>Zoya Core State:</span>
                <span className="text-violet-400 uppercase font-bold">{appState}</span>
              </div>
            </div>
          </div>
        )}

        {/* Main Home Screen Grid Area */}
        {isPhoneLocked ? (
          <div className="flex-1 px-5 py-6 flex flex-col justify-between items-center z-20 text-center select-none">
            {/* Top time section */}
            <div className="space-y-1 mt-4">
              <span className="text-4xl font-sans tracking-widest font-extrabold text-white text-glow">
                {time.split(" ")[0]}
              </span>
              <p className="text-[10px] text-white/60 font-mono tracking-widest uppercase">
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
              </p>
            </div>

            {/* Glowing lock icon center */}
            <div className="my-auto flex flex-col items-center justify-center gap-4">
              <div 
                onClick={() => setIsPhoneLocked(false)}
                className="w-16 h-16 rounded-full bg-white/5 border border-white/10 hover:border-violet-500/50 flex items-center justify-center shadow-2xl cursor-pointer hover:scale-105 active:scale-95 transition-transform group relative"
              >
                {/* Glowing Aura */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-violet-600/20 to-pink-600/20 blur-lg opacity-70 group-hover:opacity-100 transition-opacity" />
                <Lock size={24} className="text-violet-400 group-hover:text-pink-400 transition-colors z-10 animate-pulse" />
              </div>
              
              {/* Sassy notification from Zoya */}
              <div className="bg-black/65 border border-white/5 backdrop-blur-md rounded-2xl p-3 max-w-[220px] shadow-lg text-left relative">
                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-black/65 border-t border-l border-white/5 rotate-45" />
                <div className="flex items-start gap-1.5">
                  <Sparkles size={12} className="text-pink-400 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-white/90 leading-normal">
                    <strong className="text-violet-400 font-semibold">Zoya:</strong> "Shh, screen is locked! Tap the lock button or ask me to unlock your phone!"
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Controls / Mic on lockscreen */}
            <div className="w-full space-y-3 mb-2">
              <button 
                onClick={() => setIsPhoneLocked(false)}
                className="w-full py-2.5 bg-white/10 hover:bg-white/15 border border-white/10 rounded-2xl text-[10px] font-bold tracking-widest uppercase transition-all text-white shadow-md active:scale-95"
              >
                Unlock Screen
              </button>

              <div className="flex justify-center">
                <button 
                  onClick={onToggleSession}
                  className={`p-2.5 rounded-full flex items-center justify-center shadow-lg border transition-all ${
                    isSessionActive 
                      ? "bg-red-600/95 border-red-400 animate-pulse" 
                      : "bg-neutral-800 border-neutral-700 hover:border-violet-500/50"
                  }`}
                >
                  {isSessionActive ? <MicOff size={14} className="text-white" /> : <Mic size={14} className="text-white" />}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 px-4 py-4 flex flex-col justify-start gap-4 z-20 overflow-y-auto scrollbar-none">
          {/* Widget: Clock and Weather */}
          <div className="bg-black/35 border border-white/5 backdrop-blur-md rounded-2xl p-3 flex flex-col items-center justify-center text-center mt-2 shadow-lg">
            <span className="text-2xl font-serif tracking-widest text-white/90">
              {time.split(" ")[0]}
            </span>
            <span className="text-[8px] text-violet-300 font-mono tracking-widest uppercase mt-0.5">
              ZOYA CONTROL HUD
            </span>
            <div className="w-full h-[1px] bg-white/10 my-1.5" />
            <div className="flex items-center gap-1 text-[10px] text-white/60">
              <Sparkles size={10} className="text-yellow-400" />
              <span>Sassy Quotient: <strong className="text-pink-400">4/5</strong></span>
            </div>
          </div>

          {/* Interactive Google / Zoya Search Widget */}
          <form onSubmit={handleSearchSubmit} className="w-full">
            <div className="flex items-center gap-1.5 bg-black/50 border border-white/10 hover:border-violet-500/40 focus-within:border-violet-500 rounded-full px-3 py-1.5 shadow-lg backdrop-blur-md">
              <Search size={12} className="text-white/40 shrink-0" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ask Zoya or type URL..."
                className="w-full bg-transparent border-none outline-none text-[11px] text-white placeholder:text-white/30"
              />
              <button 
                type="submit"
                disabled={!searchQuery.trim()}
                className="p-1 rounded-full bg-violet-600 disabled:opacity-30 text-white hover:bg-violet-500 transition-colors"
              >
                <Search size={10} />
              </button>
            </div>
          </form>

          {/* Grid of Apps */}
          <div className="grid grid-cols-4 gap-y-4 gap-x-2 mt-1">
            {/* YouTube App */}
            <button 
              onClick={() => handleAppLaunch("youtube")}
              className="flex flex-col items-center justify-center gap-1 hover:scale-105 active:scale-95 transition-transform"
            >
              <div className="w-11 h-11 rounded-2xl bg-[#ff0000] flex items-center justify-center shadow-md border border-red-400/20">
                <Youtube size={18} className="text-white" />
              </div>
              <span className="text-[9px] text-white/80 font-medium truncate w-full text-center">YouTube</span>
            </button>

            {/* Spotify App */}
            <button 
              onClick={() => handleAppLaunch("spotify")}
              className="flex flex-col items-center justify-center gap-1 hover:scale-105 active:scale-95 transition-transform"
            >
              <div className="w-11 h-11 rounded-2xl bg-[#1db954] flex items-center justify-center shadow-md border border-green-400/20">
                <Music size={18} className="text-white" />
              </div>
              <span className="text-[9px] text-white/80 font-medium truncate w-full text-center">Spotify</span>
            </button>

            {/* WhatsApp App */}
            <button 
              onClick={() => handleAppLaunch("whatsapp")}
              className="flex flex-col items-center justify-center gap-1 hover:scale-105 active:scale-95 transition-transform"
            >
              <div className="w-11 h-11 rounded-2xl bg-[#25d366] flex items-center justify-center shadow-md border border-green-400/20">
                <MessageCircle size={18} className="text-white" />
              </div>
              <span className="text-[9px] text-white/80 font-medium truncate w-full text-center">WhatsApp</span>
            </button>

            {/* Google Maps App */}
            <button 
              onClick={() => handleAppLaunch("maps")}
              className="flex flex-col items-center justify-center gap-1 hover:scale-105 active:scale-95 transition-transform"
            >
              <div className="w-11 h-11 rounded-2xl bg-[#4285f4] flex items-center justify-center shadow-md border border-blue-400/20">
                <MapPin size={18} className="text-white" />
              </div>
              <span className="text-[9px] text-white/80 font-medium truncate w-full text-center">Maps</span>
            </button>

            {/* Zoya Voice Assistant Launch Button */}
            <button 
              onClick={onToggleSession}
              className="flex flex-col items-center justify-center gap-1 hover:scale-105 active:scale-95 transition-transform"
            >
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-md border transition-all ${
                isSessionActive 
                  ? "bg-red-600/95 border-red-400 animate-pulse" 
                  : "bg-gradient-to-tr from-violet-600 to-pink-600 border-violet-400/30"
              }`}>
                {isSessionActive ? <MicOff size={18} className="text-white" /> : <Mic size={18} className="text-white" />}
              </div>
              <span className="text-[9px] text-violet-300 font-semibold truncate w-full text-center">Voice Sync</span>
            </button>

            {/* Preferences/Settings App */}
            <button 
              onClick={onOpenSettings}
              className="flex flex-col items-center justify-center gap-1 hover:scale-105 active:scale-95 transition-transform"
            >
              <div className="w-11 h-11 rounded-2xl bg-neutral-800 flex items-center justify-center shadow-md border border-neutral-700">
                <Settings size={18} className="text-violet-400" />
              </div>
              <span className="text-[9px] text-white/80 font-medium truncate w-full text-center">Settings</span>
            </button>

            {/* Change Wallpaper Button */}
            <button 
              onClick={() => setWallpaperIndex((prev) => (prev + 1) % WALLPAPERS.length)}
              className="flex flex-col items-center justify-center gap-1 hover:scale-105 active:scale-95 transition-transform"
            >
              <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-md">
                <RotateCcw size={16} className="text-pink-400" />
              </div>
              <span className="text-[9px] text-white/70 font-medium truncate w-full text-center">Theme</span>
            </button>

            {/* System Pull Down trigger app */}
            <button 
              onClick={() => setIsControlCenterOpen(!isControlCenterOpen)}
              className="flex flex-col items-center justify-center gap-1 hover:scale-105 active:scale-95 transition-transform"
            >
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-b from-blue-900/60 to-violet-900/60 border border-blue-500/20 flex items-center justify-center shadow-md">
                <Sliders size={16} className="text-cyan-400" />
              </div>
              <span className="text-[9px] text-white/85 font-medium truncate w-full text-center">Controls</span>
            </button>
          </div>

          {/* Dialog for Launched App */}
          {activeAppDialog && (
            <div className="bg-neutral-950/95 border border-white/15 p-3.5 rounded-2xl space-y-3 shadow-2xl relative z-50">
              <div className="flex justify-between items-center">
                <h4 className="text-[11px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  {activeAppDialog === "youtube" && <Youtube size={12} className="text-red-500" />}
                  {activeAppDialog === "spotify" && <Music size={12} className="text-emerald-500" />}
                  {activeAppDialog === "whatsapp" && <MessageCircle size={12} className="text-green-500" />}
                  {activeAppDialog === "maps" && <MapPin size={12} className="text-blue-500" />}
                  Launch {activeAppDialog}
                </h4>
                <button 
                  onClick={() => setActiveAppDialog(null)}
                  className="p-1 rounded-full bg-white/5 hover:bg-white/10"
                >
                  <X size={10} />
                </button>
              </div>

              {activeAppDialog === "whatsapp" && (
                <input 
                  type="text"
                  placeholder="Recipient Name/Phone..."
                  value={dialogTarget}
                  onChange={(e) => setDialogTarget(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-[10px] text-white placeholder:text-white/30 focus:border-green-500 outline-none"
                />
              )}

              <input 
                type="text"
                placeholder={
                  activeAppDialog === "youtube" ? "Search video or channel..." :
                  activeAppDialog === "spotify" ? "Search song or artist..." :
                  activeAppDialog === "whatsapp" ? "Type WhatsApp message..." :
                  "Search location/address..."
                }
                value={dialogInput}
                onChange={(e) => setDialogInput(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-[10px] text-white placeholder:text-white/30 focus:border-violet-500 outline-none"
              />

              <button
                onClick={executeAppAction}
                disabled={!dialogInput.trim()}
                className="w-full py-1.5 px-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold rounded-lg text-[9px] uppercase tracking-wider transition-colors"
              >
                Execute via Zoya
              </button>
            </div>
          )}
        </div>
      )}

        {/* Home gesture bar */}
        <div className="w-full h-8 flex flex-col items-center justify-center pb-2 z-20 shrink-0">
          <div 
            onClick={() => {
              setIsControlCenterOpen(false);
              setActiveAppDialog(null);
            }}
            className="w-24 h-1.5 bg-white/35 rounded-full cursor-pointer hover:bg-white/55 active:scale-95 transition-all" 
            title="Tap to go Home"
          />
        </div>
      </div>
    </div>
  );
}
