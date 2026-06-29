import { getUserPreferences } from "./firebaseService";

export class LiveSessionManager {
  private socket: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  
  // Audio playback state
  private playbackContext: AudioContext | null = null;
  private nextPlayTime: number = 0;
  private isPlaying: boolean = false;
  public isMuted: boolean = false;
  
  public onStateChange: (state: "idle" | "listening" | "processing" | "speaking") => void = () => {};
  public onMessage: (sender: "user" | "zoya", text: string) => void = () => {};
  public onCommand: (url: string) => void = () => {};
  public onDeviceControl: (setting: string, value?: any) => void = () => {};

  constructor() {}

  async start() {
    try {
      this.onStateChange("processing");
      
      // Fetch dynamic user preferences
      const prefs = await getUserPreferences();

      // Initialize Audio Contexts
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass({ sampleRate: 16000 });
      this.playbackContext = new AudioContextClass({ sampleRate: 24000 });
      this.nextPlayTime = this.playbackContext.currentTime;

      // Connect to WebSocket Server Proxy
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/api/live?creatorName=${encodeURIComponent(prefs.creatorName || "Aaryan")}&role=${encodeURIComponent(prefs.role || "Boss")}&sassyLevel=${prefs.sassyLevel || 4}&customNotes=${encodeURIComponent(prefs.customNotes || "")}&voiceName=${encodeURIComponent(prefs.voiceName || "Kore")}`;
      
      console.log("Connecting to Live Proxy WebSocket at:", wsUrl);
      this.socket = new WebSocket(wsUrl);

      // Get Microphone
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        } 
      });

      this.source = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

      this.processor.onaudioprocess = (e) => {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
        const inputData = e.inputBuffer.getChannelData(0);
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          let s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        
        // Convert to base64
        const buffer = new ArrayBuffer(pcm16.length * 2);
        const view = new DataView(buffer);
        for (let i = 0; i < pcm16.length; i++) {
          view.setInt16(i * 2, pcm16[i], true);
        }
        
        let binary = '';
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64Data = btoa(binary);

        this.socket.send(JSON.stringify({ audio: base64Data }));
      };

      this.source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);

      this.socket.onopen = () => {
        console.log("Live Proxy WebSocket connected successfully");
      };

      this.socket.onmessage = async (event) => {
        try {
          const msg = JSON.parse(event.data);
          
          if (msg.type === "open") {
            console.log("Gemini Live session connected via proxy");
            this.onStateChange("listening");
          } else if (msg.type === "message") {
            const message = msg.data;

            // Handle Audio Output
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              this.onStateChange("speaking");
              this.playAudioChunk(base64Audio);
            }

            // Handle Interruption
            if (message.serverContent?.interrupted) {
              this.stopPlayback();
              this.onStateChange("listening");
            }

            // Handle Transcriptions
            const userText = message.serverContent?.modelTurn?.parts?.[0]?.text;
            if (userText) {
               this.onMessage("zoya", userText);
            }

            // Handle Function Calls
            const functionCalls = message.toolCall?.functionCalls;
            if (functionCalls && functionCalls.length > 0) {
              for (const call of functionCalls) {
                if (call.name === "executeBrowserAction") {
                  const args = call.args as any;
                  
                  const deviceActions = [
                    "wifi_on", "wifi_off", "bluetooth_on", "bluetooth_off",
                    "volume_up", "volume_down", "mute", "unmute",
                    "brightness_up", "brightness_down", "torch_on", "torch_off",
                    "lock", "unlock", "battery_status"
                  ];

                  if (deviceActions.includes(args.actionType)) {
                    this.onDeviceControl(args.actionType, args.query);
                  } else {
                    let url = "";
                    if (args.actionType === "youtube") {
                      url = `https://www.youtube.com/results?search_query=${encodeURIComponent(args.query)}`;
                    } else if (args.actionType === "spotify") {
                      url = `https://open.spotify.com/search/${encodeURIComponent(args.query)}`;
                    } else if (args.actionType === "whatsapp") {
                      const cleanPhone = (args.target || "").replace(/[^\d\+]/g, "");
                      url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(args.query)}`;
                    } else if (args.actionType === "whatsapp_call") {
                      const cleanPhone = (args.target || "").replace(/[^\d\+]/g, "");
                      url = `https://api.whatsapp.com/send?phone=${cleanPhone}`;
                    } else if (args.actionType === "call") {
                      const cleanPhone = (args.target || args.query || "").replace(/[^\d\+]/g, "");
                      url = `tel:${cleanPhone}`;
                    } else {
                      let website = args.query.replace(/\s+/g, "");
                      if (!website.includes(".")) website += ".com";
                      url = `https://www.${website}`;
                    }
                    this.onCommand(url);
                  }
                  
                  // Send tool response
                  if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                    this.socket.send(JSON.stringify({
                      toolResponse: {
                        functionResponses: [{
                          name: call.name,
                          id: call.id,
                          response: { result: "Action executed successfully in the browser." }
                        }]
                      }
                    }));
                  }
                }
              }
            }
          } else if (msg.type === "close") {
            console.log("Gemini Live session closed by proxy");
            this.stop();
          } else if (msg.type === "error") {
            console.error("Gemini Live proxy error:", msg.error);
            this.stop();
          }
        } catch (err) {
          console.error("Error handling WebSocket message:", err);
        }
      };

      this.socket.onclose = () => {
        console.log("Live Proxy WebSocket closed");
        this.stop();
      };

      this.socket.onerror = (err) => {
        console.error("Live Proxy WebSocket error:", err);
        this.stop();
      };

    } catch (error) {
      console.error("Failed to start Live Session:", error);
      this.stop();
    }
  }

  private playAudioChunk(base64Data: string) {
    if (!this.playbackContext || this.isMuted) return;
    
    try {
      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const buffer = new Int16Array(bytes.buffer);
      const audioBuffer = this.playbackContext.createBuffer(1, buffer.length, 24000);
      const channelData = audioBuffer.getChannelData(0);
      for (let i = 0; i < buffer.length; i++) {
        channelData[i] = buffer[i] / 32768.0;
      }
      
      const source = this.playbackContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.playbackContext.destination);
      
      const currentTime = this.playbackContext.currentTime;
      if (this.nextPlayTime < currentTime) {
        this.nextPlayTime = currentTime;
      }
      
      source.start(this.nextPlayTime);
      this.nextPlayTime += audioBuffer.duration;
      this.isPlaying = true;
      
      source.onended = () => {
        if (this.playbackContext && this.playbackContext.currentTime >= this.nextPlayTime - 0.1) {
          this.isPlaying = false;
          this.onStateChange("listening");
        }
      };
    } catch (e) {
      console.error("Error playing chunk", e);
    }
  }

  private stopPlayback() {
    if (this.playbackContext) {
      this.playbackContext.close();
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.playbackContext = new AudioContextClass({ sampleRate: 24000 });
      this.nextPlayTime = this.playbackContext.currentTime;
      this.isPlaying = false;
    }
  }

  stop() {
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(t => t.stop());
      this.mediaStream = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.stopPlayback();
    
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    
    this.onStateChange("idle");
  }

  sendText(text: string) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ text }));
    }
  }
}
