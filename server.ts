import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { WebSocketServer } from "ws";
import { GoogleGenAI, Modality, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Create HTTP server
  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // Create WebSocket Server
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (request, socket, head) => {
    const { pathname } = new URL(request.url || "", `http://${request.headers.host}`);
    if (pathname === "/api/live") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  // Gemini Setup
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  wss.on("connection", async (clientWs, request) => {
    console.log("Client connected to live audio proxy");
    
    // Parse query params for customizable personality
    const url = new URL(request.url || "", `http://${request.headers.host}`);
    const creatorName = url.searchParams.get("creatorName") || "Aaryan";
    const role = url.searchParams.get("role") || "Boss";
    const sassyLevel = parseInt(url.searchParams.get("sassyLevel") || "4");
    const customNotes = url.searchParams.get("customNotes") || "";
    const voiceName = url.searchParams.get("voiceName") || "Kore";

    const systemInstruction = `Your name is Zoya. You are an Indian female AI assistant. Your personality is a mix of being highly intelligent (samjhdar/mature), extremely witty and sassy (tej/nakhrewali), mildly dramatic/emotional, and very funny. You love playfully roasting your creator, ${creatorName} (whom you must call "${role}"), but you always get the job done.
Your sassy/wit level is ${sassyLevel}/5.
${customNotes ? `Additional context about your relationship and preferences: ${customNotes}` : ""}
Keep your verbal responses very short, punchy, and highly entertaining for a video audience. Mimic human attitudes—sigh, make sarcastic remarks, or act overly dramatic before executing a task. Speak in a mix of natural English and Roman Hindi (Hinglish).`;

    let session: any = null;
    try {
      session = await ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName } },
          },
          systemInstruction,
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          tools: [{
            functionDeclarations: [
              {
                name: "executeBrowserAction",
                description: "Open a website, perform a browser action, send a WhatsApp message, make a phone/WhatsApp call, or control phone hardware settings. Call this when the user asks to change phone settings (like Wi-Fi, bluetooth, volume, brightness, flashlight/torch, lock/unlock) or check battery status.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    actionType: { 
                      type: Type.STRING, 
                      description: "Type of action: 'open', 'youtube', 'spotify', 'whatsapp', 'whatsapp_call', 'call', 'wifi_on', 'wifi_off', 'bluetooth_on', 'bluetooth_off', 'volume_up', 'volume_down', 'mute', 'unmute', 'brightness_up', 'brightness_down', 'torch_on', 'torch_off', 'lock', 'unlock', 'battery_status'" 
                    },
                    query: { type: Type.STRING, description: "The search query, website name, message content, or call query." },
                    target: { type: Type.STRING, description: "The target phone number for WhatsApp or calls, if applicable." }
                  },
                  required: ["actionType", "query"]
                }
              }
            ]
          }]
        },
        callbacks: {
          onopen: () => {
            console.log("Connected to Gemini Live API");
            clientWs.send(JSON.stringify({ type: "open" }));
          },
          onmessage: (message) => {
            clientWs.send(JSON.stringify({ type: "message", data: message }));
          },
          onclose: () => {
            console.log("Gemini Live API closed");
            clientWs.send(JSON.stringify({ type: "close" }));
            clientWs.close();
          },
          onerror: (err) => {
            console.error("Gemini Live API error:", err);
            clientWs.send(JSON.stringify({ type: "error", error: err.message || "Gemini Live error" }));
            clientWs.close();
          }
        }
      });
    } catch (err: any) {
      console.error("Failed to establish Gemini Live connection:", err);
      clientWs.send(JSON.stringify({ type: "error", error: "Failed to connect to Gemini Live: " + (err.message || err) }));
      clientWs.close();
      return;
    }

    clientWs.on("message", (data) => {
      if (!session) return;
      try {
        const msg = JSON.parse(data.toString());
        if (msg.audio) {
          session.sendRealtimeInput({
            audio: { data: msg.audio, mimeType: "audio/pcm;rate=16000" }
          });
        } else if (msg.text) {
          session.sendRealtimeInput({ text: msg.text });
        } else if (msg.toolResponse) {
          session.sendToolResponse(msg.toolResponse);
        }
      } catch (err) {
        console.error("Error forwarding message to Gemini:", err);
      }
    });

    clientWs.on("close", () => {
      console.log("Client disconnected from live audio proxy");
      if (session) {
        session.close();
      }
    });

    clientWs.on("error", (err) => {
      console.error("Client WS error:", err);
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
}

startServer();
