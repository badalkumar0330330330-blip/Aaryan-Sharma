import React, { useState, useEffect, useRef, useCallback } from "react";
import { Mic, MicOff, Loader2, Volume2, VolumeX, Keyboard, Send, Trash2, History, Sliders, Shield, X, Check, Database, MessageSquare, Smartphone, Download, ExternalLink } from "lucide-react";
import { getZoyaResponse, getZoyaAudio, resetZoyaSession } from "./services/geminiService";
import { processCommand } from "./services/commandService";
import { LiveSessionManager } from "./services/liveService";
import { 
  getUserPreferences, 
  updateUserPreferences, 
  getConversationHistory, 
  saveChatMessage, 
  clearConversationHistory, 
  UserPreferences, 
  ChatMessage,
  auth,
  signUpWithEmail,
  logInWithEmail,
  logInWithGoogle,
  logOutUser,
  onAuthChanged
} from "./services/firebaseService";
import Visualizer from "./components/Visualizer";
import PermissionModal from "./components/PermissionModal";
import PhoneHomeScreen from "./components/PhoneHomeScreen";
import { playPCM } from "./utils/audioUtils";
import { motion, AnimatePresence } from "motion/react";

type AppState = "idle" | "listening" | "processing" | "speaking";

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function App() {
  const [appState, setAppState] = useState<AppState>("idle");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesRef = useRef(messages);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const [preferences, setPreferences] = useState<UserPreferences>({
    creatorName: "Aaryan",
    role: "Boss",
    sassyLevel: 4,
    favoriteTopic: "Roasting & Tech",
    customNotes: "Aaryan is Zoya's creator and boss.",
    voiceName: "Kore"
  });

  const [isMuted, setIsMuted] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);

  // Phone/Device Settings States
  const [isWifiOn, setIsWifiOn] = useState(true);
  const [isBluetoothOn, setIsBluetoothOn] = useState(true);
  const [isDndOn, setIsDndOn] = useState(false);
  const [isAirplaneMode, setIsAirplaneMode] = useState(false);
  const [isFlashlightOn, setIsFlashlightOn] = useState(false);
  const [isBatteryCharging, setIsBatteryCharging] = useState(false);
  const [isBatterySaver, setIsBatterySaver] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState(85);
  const [brightness, setBrightness] = useState(90);
  const [phoneVolume, setPhoneVolume] = useState(80);
  const [isPhoneLocked, setIsPhoneLocked] = useState(false);
  
  // UI Panels
  const [showPreferences, setShowPreferences] = useState(false);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [showPhoneMock, setShowPhoneMock] = useState(true);
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState<{ label: string; url: string } | null>(null);

  // HTML5 Battery Status Listener
  useEffect(() => {
    if ("getBattery" in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        const updateBattery = () => {
          setBatteryLevel(Math.round(battery.level * 100));
          setIsBatteryCharging(battery.charging);
        };
        updateBattery();
        battery.addEventListener("levelchange", updateBattery);
        battery.addEventListener("chargingchange", updateBattery);
        return () => {
          battery.removeEventListener("levelchange", updateBattery);
          battery.removeEventListener("chargingchange", updateBattery);
        };
      }).catch((e: any) => console.log("Battery Status API not supported or permitted", e));
    }
  }, []);

  const executeDeviceControl = useCallback((setting: string, value?: any) => {
    switch (setting) {
      case "lock":
        setIsPhoneLocked(true);
        break;
      case "unlock":
        setIsPhoneLocked(false);
        break;
      case "wifi":
        setIsWifiOn(value !== undefined ? !!value : true);
        break;
      case "wifi_on":
        setIsWifiOn(true);
        break;
      case "wifi_off":
        setIsWifiOn(false);
        break;
      case "bluetooth":
        setIsBluetoothOn(value !== undefined ? !!value : true);
        break;
      case "bluetooth_on":
        setIsBluetoothOn(true);
        break;
      case "bluetooth_off":
        setIsBluetoothOn(false);
        break;
      case "dnd":
        setIsDndOn(value !== undefined ? !!value : true);
        break;
      case "airplane":
        setIsAirplaneMode(value !== undefined ? !!value : true);
        break;
      case "torch":
        setIsFlashlightOn(value !== undefined ? !!value : true);
        break;
      case "torch_on":
        setIsFlashlightOn(true);
        break;
      case "torch_off":
        setIsFlashlightOn(false);
        break;
      case "saver":
        setIsBatterySaver(value !== undefined ? !!value : true);
        break;
      case "brightness":
        if (value === "up") {
          setBrightness(prev => Math.min(100, prev + 15));
        } else if (value === "down") {
          setBrightness(prev => Math.max(20, prev - 15));
        } else if (typeof value === "number") {
          setBrightness(value);
        }
        break;
      case "volume":
        if (value === "up") {
          setPhoneVolume(prev => {
            const newVal = Math.min(100, prev + 15);
            if (newVal > 0) setIsMuted(false);
            return newVal;
          });
        } else if (value === "down") {
          setPhoneVolume(prev => {
            const newVal = Math.max(0, prev - 15);
            if (newVal === 0) setIsMuted(true);
            return newVal;
          });
        } else if (typeof value === "number") {
          setPhoneVolume(value);
          if (value === 0) setIsMuted(true);
          else setIsMuted(false);
        }
        break;
      case "battery_status":
        break;
      default:
        if (setting === "wifi_on") setIsWifiOn(true);
        else if (setting === "wifi_off") setIsWifiOn(false);
        else if (setting === "bluetooth_on") setIsBluetoothOn(true);
        else if (setting === "bluetooth_off") setIsBluetoothOn(false);
        else if (setting === "volume_up") {
          setPhoneVolume(prev => Math.min(100, prev + 15));
          setIsMuted(false);
        }
        else if (setting === "volume_down") {
          setPhoneVolume(prev => {
            const newVal = Math.max(0, prev - 15);
            if (newVal === 0) setIsMuted(true);
            return newVal;
          });
        }
        else if (setting === "mute") {
          setPhoneVolume(0);
          setIsMuted(true);
        }
        else if (setting === "unmute") {
          setPhoneVolume(80);
          setIsMuted(false);
        }
        else if (setting === "brightness_up") setBrightness(prev => Math.min(100, prev + 15));
        else if (setting === "brightness_down") setBrightness(prev => Math.max(20, prev - 15));
        else if (setting === "torch_on") setIsFlashlightOn(true);
        else if (setting === "torch_off") setIsFlashlightOn(false);
        break;
    }
  }, [setIsMuted]);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(true);
  const [authError, setAuthError] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const liveSessionRef = useRef<LiveSessionManager | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, appState]);

  useEffect(() => {
    if (liveSessionRef.current) {
      liveSessionRef.current.isMuted = isMuted;
    }
  }, [isMuted]);

  // Load preferences and past messages from Firestore on mount & auth state change
  useEffect(() => {
    const unsubscribe = onAuthChanged(async (user) => {
      setCurrentUser(user);
      setIsLoading(true);
      try {
        const prefs = await getUserPreferences();
        setPreferences(prefs);
        
        const history = await getConversationHistory(50);
        setMessages(history);
      } catch (e) {
        console.error("Failed to load initial data", e);
      } finally {
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const downloadApkGuide = () => {
    const content = `========================================================================
         ZOYA AI VOICE ASSISTANT - ANDROID APK BUILD GUIDE
========================================================================

This guide contains everything you need to wrap the Zoya React/Vite
application into a fully functional native Android .apk file using Capacitor.

STEP 1: INSTALL DEPS IN THE PROJECT
-----------------------------------
Run these commands in your project's root folder to install Capacitor:
  npm install @capacitor/core @capacitor/cli
  npx cap init Zoya com.zoya.voiceassistant --web-dir=dist

STEP 2: ADD THE ANDROID PLATFORM
--------------------------------
Install the native Android packaging library:
  npm install @capacitor/android
  npx cap add android

STEP 3: CONFIGURATION
---------------------
Create/update your 'capacitor.config.json' file with the following content:
{
  "appId": "com.zoya.voiceassistant",
  "appName": "Zoya Voice Assistant",
  "webDir": "dist",
  "bundledWebRuntime": false
}

STEP 4: BUILD AND SYNC
----------------------
Whenever you make changes to the Web files, build the project and sync to Android:
  npm run build
  npx cap sync

STEP 5: COMPILE THE .APK FILE IN ANDROID STUDIO
-----------------------------------------------
1. Open Android Studio and open the folder: '[your-project-folder]/android'
2. Wait for Gradle sync to complete successfully.
3. To generate the .apk file, in the top menu click:
   Build > Build Bundle(s) / APK(s) > Build APK(s)
4. A notification will appear once finished. Click "locate" to find the compiled
   'app-debug.apk' file! Transfer this APK file to your Android phone to install it.

Need support or have questions? Use the Google AI Studio builder to customize further!
========================================================================`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "zoya-android-apk-guide.txt";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const triggerBrowserAction = useCallback((url: string, label?: string) => {
    let friendlyLabel = label || "App / Link";
    if (url.startsWith("tel:")) {
      friendlyLabel = `Phone Call (${url.replace("tel:", "")})`;
    } else if (url.includes("api.whatsapp.com") || url.includes("web.whatsapp.com")) {
      friendlyLabel = "WhatsApp Messaging";
    } else if (url.includes("youtube.com")) {
      friendlyLabel = "YouTube Video";
    } else if (url.includes("spotify.com")) {
      friendlyLabel = "Spotify Music";
    } else if (url.includes("google.com/maps")) {
      friendlyLabel = "Google Maps";
    }

    setPendingAction({ label: friendlyLabel, url });
    
    try {
      window.open(url, "_blank");
    } catch (e) {
      console.warn("Blocked by browser popup blocker.", e);
    }
  }, []);

  const handleTextCommand = useCallback(async (finalTranscript: string) => {
    if (!finalTranscript.trim()) {
      setAppState("idle");
      return;
    }

    // Save user message to Firestore
    const userMsg = await saveChatMessage("user", finalTranscript);
    setMessages((prev) => [...prev, userMsg]);
    
    // If live session is active, send text through it
    if (isSessionActive && liveSessionRef.current) {
      liveSessionRef.current.sendText(finalTranscript);
      return;
    }

    setAppState("processing");

    // 1. Check for browser or device commands
    const commandResult = processCommand(finalTranscript);

    let responseText = "";

    if (commandResult.deviceControl) {
      executeDeviceControl(commandResult.deviceControl.setting, commandResult.deviceControl.value);
      
      responseText = commandResult.action;
      if (commandResult.deviceControl.setting === "battery_status") {
        responseText = `Current battery charge level is ${batteryLevel}% and it is currently ${isBatteryCharging ? "charging on power connection" : "discharging"}.`;
      }

      const zoyaMsg = await saveChatMessage("zoya", responseText);
      setMessages((prev) => [...prev, zoyaMsg]);
      
      if (!isMuted) {
        setAppState("speaking");
        const audioBase64 = await getZoyaAudio(responseText);
        if (audioBase64) {
          await playPCM(audioBase64);
        }
      }
      setAppState("idle");
      return;
    }

    if (commandResult.isBrowserAction) {
      responseText = commandResult.action;
      const zoyaMsg = await saveChatMessage("zoya", responseText);
      setMessages((prev) => [...prev, zoyaMsg]);
      
      if (!isMuted) {
        setAppState("speaking");
        const audioBase64 = await getZoyaAudio(responseText);
        if (audioBase64) {
          await playPCM(audioBase64);
        }
      }

      setAppState("idle");

      setTimeout(() => {
        if (commandResult.url) {
          triggerBrowserAction(commandResult.url);
        }
      }, 1500);
    } else {
      // 2. General Chit-Chat via Gemini
      responseText = await getZoyaResponse(finalTranscript, messagesRef.current);
      const zoyaMsg = await saveChatMessage("zoya", responseText);
      setMessages((prev) => [...prev, zoyaMsg]);
      
      if (!isMuted) {
        setAppState("speaking");
        const audioBase64 = await getZoyaAudio(responseText);
        if (audioBase64) {
          await playPCM(audioBase64);
        }
      }
      setAppState("idle");
    }
  }, [isMuted, isSessionActive]);

  useEffect(() => {
    return () => {
      if (liveSessionRef.current) {
        liveSessionRef.current.stop();
      }
    };
  }, []);

  const toggleListening = async () => {
    if (isSessionActive) {
      setIsSessionActive(false);
      if (liveSessionRef.current) {
        liveSessionRef.current.stop();
        liveSessionRef.current = null;
      }
      setAppState("idle");
      resetZoyaSession();
    } else {
      try {
        setIsSessionActive(true);
        resetZoyaSession();
        
        const session = new LiveSessionManager();
        session.isMuted = isMuted;
        liveSessionRef.current = session;
        
        session.onStateChange = (state) => {
          setAppState(state);
        };
        
        session.onMessage = async (sender, text) => {
          const savedMsg = await saveChatMessage(sender, text);
          setMessages((prev) => [...prev, savedMsg]);
        };
        
        session.onCommand = (url) => {
          setTimeout(() => {
            triggerBrowserAction(url);
          }, 1000);
        };

        session.onDeviceControl = (setting, value) => {
          executeDeviceControl(setting, value);
        };

        await session.start();
      } catch (e) {
        console.error("Failed to start session", e);
        setShowPermissionModal(true);
        setIsSessionActive(false);
        setAppState("idle");
      }
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    
    handleTextCommand(textInput);
    setTextInput("");
    setShowTextInput(false);
  };

  return (
    <div className="h-[100dvh] w-screen bg-[#050505] text-white flex flex-col items-center justify-between font-sans relative overflow-hidden m-0 p-0 select-none">
      {showPermissionModal && (
        <PermissionModal 
          onClose={() => setShowPermissionModal(false)} 
        />
      )}

      {/* Dynamic Action HUD / Popup Blocker rescue overlay */}
      <AnimatePresence>
        {pendingAction && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.95 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm mx-auto px-4 pointer-events-auto"
          >
            <div className="bg-neutral-950/95 border border-violet-500/30 backdrop-blur-md rounded-2xl p-4 shadow-2xl flex flex-col gap-3 ring-1 ring-violet-500/20">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-[10px] text-violet-400 font-mono tracking-wider uppercase font-semibold">Zoya Action Triggered</h4>
                  <p className="text-sm font-sans font-medium text-white/95 mt-1">
                    Opening: <span className="text-violet-300 font-bold">{pendingAction.label}</span>
                  </p>
                </div>
                <button 
                  onClick={() => setPendingAction(null)}
                  className="p-1 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
              <p className="text-[11px] text-white/50">
                If the application or dialer didn't open automatically, your browser/device might have blocked the pop-up. Click the button below to open it directly!
              </p>
              <div className="flex gap-2">
                <a
                  href={pendingAction.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setPendingAction(null)}
                  className="flex-1 py-2 px-3 text-center bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-violet-500/20 transition-all flex items-center justify-center gap-1.5"
                >
                  Open Now ↗
                </a>
                <button
                  onClick={() => setPendingAction(null)}
                  className="px-3 py-2 bg-neutral-900 hover:bg-neutral-850 text-white/80 hover:text-white rounded-xl text-xs font-semibold border border-white/5 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cinematic Background Gradients */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-violet-900/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-pink-900/20 blur-[120px] rounded-full" />
      </div>

      {/* Header */}
      <header className="absolute top-0 left-0 w-full flex justify-between items-center z-20 shrink-0 px-6 py-4 md:px-12 md:py-6 bg-gradient-to-b from-black/50 to-transparent backdrop-blur-[2px]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-500 to-pink-500 flex items-center justify-center font-bold text-sm shadow-[0_0_15px_rgba(139,92,246,0.5)]">
            Z
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-serif font-medium tracking-wide opacity-90 leading-none">Zoya</h1>
            <span className="text-[10px] text-violet-400 font-mono tracking-widest mt-0.5 uppercase">
              Boss Mode
            </span>
          </div>
        </div>
        
        {/* Controls and Stats */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Firestore Active Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-cyan-400/85">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>CLOUD SYNCED</span>
          </div>

          <button
            onClick={() => {
              setShowChatHistory(true);
              setShowPreferences(false);
              setShowPhoneMock(false);
            }}
            className="p-2 rounded-full bg-white/5 hover:bg-cyan-500/20 hover:text-cyan-400 transition-all border border-white/10 hover:border-cyan-500/30 shadow-lg"
            title="Chat History"
          >
            <History size={18} className="opacity-70" />
          </button>

          <button
            onClick={() => {
              setShowPhoneMock(!showPhoneMock);
              setShowChatHistory(false);
              setShowPreferences(false);
            }}
            className={`p-2 rounded-full transition-all border shadow-lg ${
              showPhoneMock 
                ? "bg-violet-500/20 text-violet-300 border-violet-500/40" 
                : "bg-white/5 hover:bg-violet-500/20 hover:text-violet-400 border-white/10 hover:border-violet-500/30"
            }`}
            title="All Control Phone HUD"
          >
            <Smartphone size={18} className="opacity-70" />
          </button>

          <button
            onClick={() => {
              setShowPreferences(true);
              setShowChatHistory(false);
              setShowPhoneMock(false);
            }}
            className="p-2 rounded-full bg-white/5 hover:bg-violet-500/20 hover:text-violet-400 transition-all border border-white/10 hover:border-violet-500/30 shadow-lg"
            title="Boss Preferences"
          >
            <Sliders size={18} className="opacity-70" />
          </button>

          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/10 shadow-lg"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? (
              <VolumeX size={18} className="opacity-70 text-red-400" />
            ) : (
              <Volume2 size={18} className="opacity-70 text-white" />
            )}
          </button>
        </div>
      </header>

      {/* Main Content - Visualizer & Chat */}
      <main className="absolute inset-0 flex flex-row items-center justify-between w-full h-full z-10 overflow-hidden pt-20 pb-24 px-4 md:px-12 pointer-events-none">
        
        {/* Left Column: Zoya Status */}
        <div className="flex w-[30%] lg:w-[25%] h-full flex-col justify-center gap-4 z-10">
          <div className="h-6">
            <AnimatePresence>
              {appState === "processing" && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-center gap-2 text-cyan-300/80 text-sm md:text-base italic font-serif"
                >
                  <Loader2 size={16} className="animate-spin text-cyan-400" />
                  Zoya is thinking...
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Center Visualizer (Fixed Full Screen Background) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <Visualizer state={appState} />
        </div>

        {/* Right Column: User Status */}
        <div className="flex w-[30%] lg:w-[25%] h-full flex-col justify-center gap-4 z-10">
          <div className="h-6 flex justify-end">
            <AnimatePresence>
              {appState === "listening" && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center gap-2 text-violet-300/80 text-sm md:text-base italic"
                >
                  <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                  Listening...
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Floating Dynamic Prompt / Greeting */}
      {messages.length === 0 && !isLoading && (
        <div className="absolute top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-auto flex flex-col items-center max-w-md text-center p-6 bg-black/40 border border-white/5 backdrop-blur-md rounded-3xl">
          <div className="w-10 h-10 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-3">
            <MessageSquare size={18} className="text-violet-400 animate-pulse" />
          </div>
          <h2 className="text-lg font-serif text-violet-300 font-medium">Hello, {preferences?.creatorName || "Aaryan"}!</h2>
          <p className="text-xs text-white/50 mt-1 leading-relaxed">
            I am Zoya, your sassy and witty AI assistant. Setup your preferences in the top corner or start a voice session to begin!
          </p>
        </div>
      )}

      {/* Sidebars for Chat History, Phone Device, and Preferences */}
      {/* Sidebar - Phone Device & All Control System */}
      <AnimatePresence>
        {showPhoneMock && (
          <motion.div
            initial={{ x: "-100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 h-full w-full max-w-[360px] bg-[#08080a]/95 backdrop-blur-xl border-r border-white/10 z-30 flex flex-col p-5 items-center justify-center shadow-[0_0_50px_rgba(0,0,0,0.85)] pointer-events-auto"
          >
            <div className="w-full flex items-center justify-between border-b border-white/10 pb-3 mb-2 shrink-0">
              <div className="flex items-center gap-2 text-violet-400">
                <Smartphone size={18} />
                <h2 className="text-xs font-sans font-semibold tracking-wider uppercase">Device Control Panel</h2>
              </div>
              <button 
                onClick={() => setShowPhoneMock(false)}
                className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 w-full flex items-center justify-center overflow-y-auto py-1">
              <PhoneHomeScreen 
                isMuted={isMuted}
                setIsMuted={setIsMuted}
                onZoyaCommand={(cmd) => {
                  handleTextCommand(cmd);
                }}
                onToggleSession={toggleListening}
                isSessionActive={isSessionActive}
                appState={appState}
                onOpenSettings={() => {
                  setShowPreferences(true);
                  setShowPhoneMock(false);
                }}
                onClose={() => setShowPhoneMock(false)}
                isWifiOn={isWifiOn}
                setIsWifiOn={setIsWifiOn}
                isBluetoothOn={isBluetoothOn}
                setIsBluetoothOn={setIsBluetoothOn}
                isDndOn={isDndOn}
                setIsDndOn={setIsDndOn}
                isAirplaneMode={isAirplaneMode}
                setIsAirplaneMode={setIsAirplaneMode}
                isFlashlightOn={isFlashlightOn}
                setIsFlashlightOn={setIsFlashlightOn}
                isBatteryCharging={isBatteryCharging}
                setIsBatteryCharging={setIsBatteryCharging}
                isBatterySaver={isBatterySaver}
                setIsBatterySaver={setIsBatterySaver}
                batteryLevel={batteryLevel}
                setBatteryLevel={setBatteryLevel}
                brightness={brightness}
                setBrightness={setBrightness}
                phoneVolume={phoneVolume}
                setPhoneVolume={setPhoneVolume}
                isPhoneLocked={isPhoneLocked}
                setIsPhoneLocked={setIsPhoneLocked}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar - Chat History */}
      <AnimatePresence>
        {showChatHistory && (
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-[#08080a]/95 backdrop-blur-xl border-l border-white/10 z-30 flex flex-col p-6 shadow-[0_0_50px_rgba(0,0,0,0.85)] pointer-events-auto"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <div className="flex items-center gap-2 text-cyan-400">
                <History size={20} />
                <h2 className="text-lg font-sans font-semibold tracking-wider uppercase">Past Conversations</h2>
              </div>
              <button 
                onClick={() => setShowChatHistory(false)}
                className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Chat list */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-4 scrollbar-hide">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-white/40 p-4">
                  <Database size={32} className="mb-2 opacity-50 animate-pulse text-cyan-400" />
                  <p className="text-sm">No past conversations in database yet.</p>
                  <p className="text-xs mt-1 text-white/30">Start a session or type a message to begin!</p>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div 
                    key={msg.id || idx} 
                    className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
                  >
                    <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1 font-mono">
                      {msg.sender === "user" ? (preferences?.role || "Boss") : "Zoya"}
                    </div>
                    <div className={`
                      px-4 py-2.5 rounded-2xl max-w-[85%] text-sm leading-relaxed shadow-md select-text
                      ${msg.sender === "user" 
                        ? "bg-gradient-to-r from-violet-600/80 to-pink-600/80 text-white rounded-tr-none border border-violet-500/30 shadow-[0_0_15px_rgba(139,92,246,0.15)]" 
                        : "bg-white/5 text-white/90 border border-white/10 rounded-tl-none"}
                    `}>
                      {msg.text}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-white/10 pt-4 mt-4 flex gap-2">
              <button
                onClick={async () => {
                  if (confirm("Are you sure you want to delete all past conversation records? This cannot be undone.")) {
                    try {
                      await clearConversationHistory();
                      setMessages([]);
                      resetZoyaSession();
                    } catch (err) {
                      console.error(err);
                    }
                  }
                }}
                className="w-full py-2 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl transition-colors text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-1"
              >
                <Trash2 size={14} />
                Purge Records
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar - Preferences / Boss Settings */}
      <AnimatePresence>
        {showPreferences && (
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-[#08080a]/95 backdrop-blur-xl border-l border-white/10 z-30 flex flex-col p-6 shadow-[0_0_50px_rgba(0,0,0,0.85)] pointer-events-auto"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <div className="flex items-center gap-2 text-violet-400">
                <Sliders size={20} />
                <h2 className="text-lg font-sans font-semibold tracking-wider uppercase">Boss Settings</h2>
              </div>
              <button 
                onClick={() => setShowPreferences(false)}
                className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Config Form */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-5 scrollbar-hide text-left">
              <div className="p-4 bg-violet-950/20 border border-violet-500/20 rounded-2xl flex items-start gap-3">
                <Shield size={20} className="text-violet-400 shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <h3 className="text-sm font-semibold text-violet-300">Creator Recognition Layer</h3>
                  <p className="text-[11px] text-white/50 mt-1 leading-normal">
                    Update Zoya's identity layer. Specify your preferred role name, sassy quotient, and custom memories so she remembers everything.
                  </p>
                </div>
              </div>

              {/* Cloud Sync & Permanent Backup Section */}
              {currentUser ? (
                <div className="p-4 bg-emerald-950/20 border border-emerald-500/20 rounded-2xl flex flex-col gap-2.5">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                      <Database size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">Cloud Synchronization Live</h3>
                      <p className="text-[11px] text-white/50 mt-0.5 truncate font-mono">
                        {currentUser.email || currentUser.displayName || "Authenticated User"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        await logOutUser();
                      } catch (err: any) {
                        console.error(err);
                      }
                    }}
                    className="w-full py-1.5 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/30 rounded-xl transition-all text-[10px] font-semibold uppercase tracking-wider"
                  >
                    Sign Out of Permanent Account
                  </button>
                </div>
              ) : (
                <div className="p-4 bg-violet-950/20 border border-violet-500/20 rounded-2xl space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400 shrink-0 mt-0.5">
                      <Database size={18} />
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-violet-300 uppercase tracking-wider">Cloud Sync & Permanent Backup</h3>
                      <p className="text-[11px] text-white/50 mt-1 leading-relaxed">
                        Permanently preserve your custom Zoya preferences and chat transcripts across any device instantly.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/5 space-y-2">
                    {authError && (
                      <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-xl text-[10px] text-red-400 font-medium leading-relaxed break-words">
                        {authError}
                      </div>
                    )}

                    <button
                      type="button"
                      disabled={isAuthenticating}
                      onClick={async () => {
                        setAuthError("");
                        setIsAuthenticating(true);
                        try {
                          await logInWithGoogle();
                        } catch (err: any) {
                          console.error(err);
                          setAuthError(err.message || "Google Authentication failed. Please try again.");
                        } finally {
                          setIsAuthenticating(false);
                        }
                      }}
                      className="w-full py-2 px-3 bg-white hover:bg-white/95 text-neutral-900 font-semibold rounded-xl text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                    >
                      {isAuthenticating ? (
                        <Loader2 size={12} className="animate-spin text-neutral-900" />
                      ) : (
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                        </svg>
                      )}
                      Continue with Google
                    </button>

                    <div className="flex items-center gap-2 py-1">
                      <div className="h-[1px] bg-white/10 flex-1"></div>
                      <span className="text-[8px] text-white/30 uppercase tracking-widest font-mono">or use custom email</span>
                      <div className="h-[1px] bg-white/10 flex-1"></div>
                    </div>

                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      if (!authEmail || !authPassword) {
                        setAuthError("Email and password are required.");
                        return;
                      }
                      setAuthError("");
                      setIsAuthenticating(true);
                      try {
                        if (isSignUp) {
                          await signUpWithEmail(authEmail, authPassword);
                        } else {
                          await logInWithEmail(authEmail, authPassword);
                        }
                        setAuthEmail("");
                        setAuthPassword("");
                      } catch (err: any) {
                        console.error(err);
                        let errMsg = err.message || "Authentication failed. Try again.";
                        if (errMsg.includes("auth/operation-not-allowed") || errMsg.includes("operation-not-allowed")) {
                          errMsg = "Email/Password sign-in is not enabled in Firebase Console. Please go to your Firebase Console -> Authentication -> Sign-in method, click 'Add new provider', select 'Email/Password', enable it, and save.";
                        }
                        setAuthError(errMsg);
                      } finally {
                        setIsAuthenticating(false);
                      }
                    }} className="space-y-2.5">
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase tracking-wider text-white/40 font-mono">Email Address</label>
                        <input 
                          type="email"
                          value={authEmail}
                          onChange={(e) => setAuthEmail(e.target.value)}
                          placeholder="boss@example.com"
                          className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-violet-500 outline-none rounded-xl px-3 py-1.5 text-xs transition-colors text-white placeholder:text-white/20"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] uppercase tracking-wider text-white/40 font-mono">Password</label>
                        <input 
                          type="password"
                          value={authPassword}
                          onChange={(e) => setAuthPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-violet-500 outline-none rounded-xl px-3 py-1.5 text-xs transition-colors text-white placeholder:text-white/20"
                        />
                      </div>

                      <div className="flex gap-2 pt-1">
                        <button
                          type="submit"
                          disabled={isAuthenticating}
                          className="flex-1 py-2 px-3 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 disabled:opacity-50 text-white font-semibold rounded-xl text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                        >
                          {isAuthenticating ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : isSignUp ? "Sign Up" : "Log In"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsSignUp(!isSignUp);
                            setAuthError("");
                          }}
                          className="py-2 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] uppercase tracking-wider transition-all text-white/70"
                        >
                          {isSignUp ? "Log In" : "Sign Up"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Mobile App & Android APK Card */}
              <div className="p-4 bg-gradient-to-br from-violet-950/40 to-indigo-950/40 border border-violet-500/20 rounded-2xl space-y-3.5">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400">
                    <Smartphone size={18} />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-violet-300 uppercase tracking-wider">Zoya Mobile & Android APK</h3>
                    <p className="text-[11px] text-white/50 mt-0.5 leading-relaxed">
                      Run Zoya as a native Android app directly from your home screen or build a custom APK file.
                    </p>
                  </div>
                </div>

                {/* Option 1: Instant Native App (PWA) */}
                <div className="bg-white/5 border border-white/5 p-3 rounded-xl flex items-center gap-3">
                  <div className="shrink-0 p-1 bg-white rounded-lg border border-white/10">
                    <img 
                      src={`https://chart.googleapis.com/chart?chs=100x100&cht=qr&chl=${encodeURIComponent(window.location.origin)}`}
                      alt="QR Code to Scan"
                      className="w-16 h-16"
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <h4 className="text-[11px] font-semibold text-white/90">Option 1: Scan & Install (PWA)</h4>
                    <p className="text-[10px] text-white/60 leading-tight">
                      Scan the QR Code on your Android phone, click the 3 dots in Chrome, and choose <strong className="text-violet-300">Add to Home Screen</strong> to run Zoya as a standalone app.
                    </p>
                  </div>
                </div>

                {/* Option 2: Compile Custom APK */}
                <div className="bg-white/5 border border-white/5 p-3 rounded-xl space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="space-y-0.5">
                      <h4 className="text-[11px] font-semibold text-white/90">Option 2: Build Native APK File</h4>
                      <p className="text-[10px] text-white/60 leading-snug">
                        Ready to package as an actual Android Studio project and compile your custom offline <strong className="text-pink-400">.apk</strong>?
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={downloadApkGuide}
                    className="w-full py-2 px-3 bg-white/5 hover:bg-white/10 hover:text-white border border-white/10 hover:border-violet-500/40 rounded-lg text-[10px] uppercase tracking-wider transition-all text-white/85 font-semibold flex items-center justify-center gap-1.5"
                  >
                    <Download size={12} className="text-violet-400 animate-bounce" />
                    Download APK Build Package & Guide
                  </button>
                </div>
              </div>

              {/* Input: Creator Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-white/50 font-mono">Creator Name</label>
                <input 
                  type="text"
                  value={preferences.creatorName}
                  onChange={(e) => setPreferences(prev => ({ ...prev, creatorName: e.target.value }))}
                  placeholder="e.g. Aaryan"
                  className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-violet-500 outline-none rounded-xl px-4 py-2 text-sm transition-colors text-white placeholder:text-white/20"
                />
              </div>

              {/* Input: Boss/Role Title */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-white/50 font-mono">How should Zoya address you?</label>
                <input 
                  type="text"
                  value={preferences.role}
                  onChange={(e) => setPreferences(prev => ({ ...prev, role: e.target.value }))}
                  placeholder="e.g. Boss, Master, Sir"
                  className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-violet-500 outline-none rounded-xl px-4 py-2 text-sm transition-colors text-white placeholder:text-white/20"
                />
              </div>

              {/* Slider: Sassy Quotient */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] uppercase tracking-widest text-white/50 font-mono">Sassy Quotient</label>
                  <span className="text-xs text-violet-400 font-mono font-bold">{preferences.sassyLevel}/5</span>
                </div>
                <input 
                  type="range"
                  min="1"
                  max="5"
                  value={preferences.sassyLevel}
                  onChange={(e) => setPreferences(prev => ({ ...prev, sassyLevel: parseInt(e.target.value) }))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-violet-500"
                />
                <div className="flex justify-between text-[9px] text-white/30 font-mono">
                  <span>Sweet</span>
                  <span>Roasty</span>
                  <span>Sarcastic</span>
                  <span>Full Drama</span>
                </div>
              </div>

              {/* Audio Toggle / Voice Persona */}
              <div className="space-y-2 border-t border-white/5 pt-4">
                <label className="text-[10px] uppercase tracking-widest text-violet-400 font-mono font-medium">Zoya's Voice Persona</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "Kore", label: "Kore", desc: "Sassy & High Energy (Female)" },
                    { id: "Aoede", label: "Aoede", desc: "Bright & Cheerful (Female)" },
                    { id: "Charon", label: "Charon", desc: "Smooth & Professional (Neutral)" },
                    { id: "Puck", label: "Puck", desc: "Bold, Sarcastic & Witty (Male)" },
                    { id: "Fenrir", label: "Fenrir", desc: "Deep & Mysterious (Male)" }
                  ].map((voice) => (
                    <button
                      key={voice.id}
                      type="button"
                      onClick={() => setPreferences(prev => ({ ...prev, voiceName: voice.id }))}
                      className={`flex flex-col text-left p-2.5 rounded-xl border text-xs transition-all ${
                        (preferences.voiceName || "Kore") === voice.id
                          ? "bg-violet-600/20 border-violet-500 text-white shadow-[0_0_12px_rgba(139,92,246,0.15)] font-medium"
                          : "bg-white/5 border-white/10 hover:bg-white/10 text-white/70"
                      }`}
                    >
                      <span className="font-semibold">{voice.label}</span>
                      <span className="text-[9px] text-white/40 mt-0.5 leading-snug">{voice.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Input: Favorite Roast Topic */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-white/50 font-mono">Favorite Roast Topic</label>
                <input 
                  type="text"
                  value={preferences.favoriteTopic}
                  onChange={(e) => setPreferences(prev => ({ ...prev, favoriteTopic: e.target.value }))}
                  placeholder="e.g. sleeping habits, bad jokes"
                  className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-violet-500 outline-none rounded-xl px-4 py-2 text-sm transition-colors text-white placeholder:text-white/20"
                />
              </div>

              {/* Custom notes/memories */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-white/50 font-mono">Dynamic Memories & Context</label>
                <textarea 
                  rows={3}
                  value={preferences.customNotes}
                  onChange={(e) => setPreferences(prev => ({ ...prev, customNotes: e.target.value }))}
                  placeholder="Add custom context/memories that Zoya should recall about you..."
                  className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-violet-500 outline-none rounded-xl px-4 py-2 text-sm transition-colors text-white placeholder:text-white/20 resize-none font-sans"
                />
              </div>
            </div>

            <div className="border-t border-white/10 pt-4 mt-4">
              <button
                onClick={async () => {
                  setIsSavingPrefs(true);
                  try {
                    await updateUserPreferences(preferences);
                    resetZoyaSession();
                    setShowPreferences(false);
                  } catch (err) {
                    console.error(err);
                  } finally {
                    setIsSavingPrefs(false);
                  }
                }}
                disabled={isSavingPrefs}
                className="w-full py-3 px-4 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg shadow-violet-500/20 transition-all hover:scale-[1.01] flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
              >
                {isSavingPrefs ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check size={14} />
                    Save Settings
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <footer className="absolute bottom-0 left-0 w-full flex flex-col items-center justify-center pb-6 md:pb-8 z-20 shrink-0 gap-4">
        <AnimatePresence>
          {showTextInput && (
            <motion.form 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              onSubmit={handleTextSubmit}
              className="w-full max-w-md flex items-center gap-2 bg-white/5 border border-white/10 rounded-full p-1 pl-4 backdrop-blur-md shadow-2xl pointer-events-auto"
            >
              <input 
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder={`Type a message, ${preferences.role || 'Boss'}...`}
                className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-white/30 text-sm"
                autoFocus
              />
              <button 
                type="submit"
                disabled={!textInput.trim()}
                className="p-2 rounded-full bg-violet-500 hover:bg-violet-600 disabled:opacity-50 disabled:hover:bg-violet-500 transition-colors"
              >
                <Send size={16} />
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-4 pointer-events-auto">
          <button
            onClick={toggleListening}
            className={`
              group relative flex items-center gap-3 px-8 py-4 rounded-full font-medium tracking-wide transition-all duration-300 shadow-2xl
              ${
                isSessionActive
                  ? "bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30"
                  : "bg-white/10 text-white border border-white/20 hover:bg-white/20 hover:scale-105"
              }
            `}
          >
            {isSessionActive ? (
              <>
                <MicOff size={20} />
                <span>End Session</span>
              </>
            ) : (
              <>
                <Mic size={20} className="group-hover:animate-bounce" />
                <span>Start Session</span>
              </>
            )}
          </button>
          
          {!isSessionActive && (
            <button
              onClick={() => setShowTextInput(!showTextInput)}
              className="p-4 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors shadow-2xl"
              title="Type instead"
            >
              <Keyboard size={20} className="opacity-70" />
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
