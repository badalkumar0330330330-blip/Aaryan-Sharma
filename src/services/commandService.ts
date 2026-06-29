export interface CommandResult {
  action: string;
  url?: string;
  isBrowserAction: boolean;
  deviceControl?: {
    setting: "wifi" | "bluetooth" | "dnd" | "airplane" | "torch" | "saver" | "brightness" | "volume" | "lock" | "unlock" | "battery_status";
    value?: any;
  };
}

export function processCommand(command: string): CommandResult {
  const lowerCmd = command.toLowerCase().trim();

  // 1. Lock Phone
  if (
    lowerCmd.includes("lock phone") || 
    lowerCmd.includes("phone lock") || 
    lowerCmd.includes("lock screen") || 
    lowerCmd.includes("screen lock") ||
    lowerCmd.includes("phone band karo")
  ) {
    return {
      action: "Locked the phone screen for you! Tap or swipe to unlock it, or ask me.",
      isBrowserAction: true,
      deviceControl: { setting: "lock", value: true }
    };
  }

  // 2. Unlock Phone
  if (
    lowerCmd.includes("unlock phone") || 
    lowerCmd.includes("phone unlock") || 
    lowerCmd.includes("unlock screen") || 
    lowerCmd.includes("screen unlock") ||
    lowerCmd.includes("phone kholo") ||
    lowerCmd.includes("lock kholo")
  ) {
    return {
      action: "Phone unlocked! Back to action, let's go.",
      isBrowserAction: true,
      deviceControl: { setting: "unlock", value: true }
    };
  }

  // 3. Wi-Fi / Internet Control
  if (
    lowerCmd.includes("wifi on") || 
    lowerCmd.includes("turn on wifi") || 
    lowerCmd.includes("wifi chalu") || 
    lowerCmd.includes("net chalu") || 
    lowerCmd.includes("internet chalu") || 
    lowerCmd.includes("net on") || 
    lowerCmd.includes("data on")
  ) {
    return {
      action: "Wi-Fi and mobile data have been enabled on your device control panel!",
      isBrowserAction: true,
      deviceControl: { setting: "wifi", value: true }
    };
  }
  if (
    lowerCmd.includes("wifi off") || 
    lowerCmd.includes("turn off wifi") || 
    lowerCmd.includes("wifi band") || 
    lowerCmd.includes("net band") || 
    lowerCmd.includes("internet band") || 
    lowerCmd.includes("net off") || 
    lowerCmd.includes("data off")
  ) {
    return {
      action: "Wi-Fi and mobile data have been turned off. Digital detox time!",
      isBrowserAction: true,
      deviceControl: { setting: "wifi", value: false }
    };
  }

  // 4. Bluetooth Control
  if (
    lowerCmd.includes("bluetooth on") || 
    lowerCmd.includes("turn on bluetooth") || 
    lowerCmd.includes("bluetooth chalu")
  ) {
    return {
      action: "Bluetooth has been turned ON. Ready to scan and pair!",
      isBrowserAction: true,
      deviceControl: { setting: "bluetooth", value: true }
    };
  }
  if (
    lowerCmd.includes("bluetooth off") || 
    lowerCmd.includes("turn off bluetooth") || 
    lowerCmd.includes("bluetooth band")
  ) {
    return {
      action: "Bluetooth has been turned OFF to save battery.",
      isBrowserAction: true,
      deviceControl: { setting: "bluetooth", value: false }
    };
  }

  // 5. Torch / Flashlight Control
  if (
    lowerCmd.includes("torch on") || 
    lowerCmd.includes("flashlight on") || 
    lowerCmd.includes("flash on") || 
    lowerCmd.includes("torch chalu") || 
    lowerCmd.includes("flashlight chalu") || 
    lowerCmd.includes("torch jalao") || 
    lowerCmd.includes("light jalao") || 
    lowerCmd.includes("light on")
  ) {
    return {
      action: "Torch has been turned ON! Let there be light.",
      isBrowserAction: true,
      deviceControl: { setting: "torch", value: true }
    };
  }
  if (
    lowerCmd.includes("torch off") || 
    lowerCmd.includes("flashlight off") || 
    lowerCmd.includes("flash off") || 
    lowerCmd.includes("torch band") || 
    lowerCmd.includes("flashlight band") || 
    lowerCmd.includes("torch bujhao") || 
    lowerCmd.includes("light off")
  ) {
    return {
      action: "Torch has been turned OFF. Back into the dark we go.",
      isBrowserAction: true,
      deviceControl: { setting: "torch", value: false }
    };
  }

  // 6. DND / Silent Mode Control
  if (
    lowerCmd.includes("silent on") || 
    lowerCmd.includes("silent mode on") || 
    lowerCmd.includes("dnd on") || 
    lowerCmd.includes("do not disturb on") || 
    lowerCmd.includes("dnd chalu") ||
    lowerCmd.includes("silent karo")
  ) {
    return {
      action: "Do Not Disturb (DND) turned ON. Shhh... quiet hours activated!",
      isBrowserAction: true,
      deviceControl: { setting: "dnd", value: true }
    };
  }
  if (
    lowerCmd.includes("silent off") || 
    lowerCmd.includes("silent mode off") || 
    lowerCmd.includes("dnd off") || 
    lowerCmd.includes("do not disturb off") || 
    lowerCmd.includes("dnd band") ||
    lowerCmd.includes("silent band")
  ) {
    return {
      action: "Do Not Disturb turned OFF. Back to the noisy world!",
      isBrowserAction: true,
      deviceControl: { setting: "dnd", value: false }
    };
  }

  // 7. Airplane / Flight Mode
  if (
    lowerCmd.includes("airplane mode on") || 
    lowerCmd.includes("flight mode on") || 
    lowerCmd.includes("airplane chalu") || 
    lowerCmd.includes("flight mode chalu")
  ) {
    return {
      action: "Airplane Mode activated! Flying offline.",
      isBrowserAction: true,
      deviceControl: { setting: "airplane", value: true }
    };
  }
  if (
    lowerCmd.includes("airplane mode off") || 
    lowerCmd.includes("flight mode off") || 
    lowerCmd.includes("airplane band") || 
    lowerCmd.includes("flight mode band")
  ) {
    return {
      action: "Airplane Mode deactivated. Reconnected to cells!",
      isBrowserAction: true,
      deviceControl: { setting: "airplane", value: false }
    };
  }

  // 8. Battery Saver Control
  if (
    lowerCmd.includes("battery saver on") || 
    lowerCmd.includes("saver on") || 
    lowerCmd.includes("battery saver chalu")
  ) {
    return {
      action: "Battery Saver ON. Restricting background performance to save juice!",
      isBrowserAction: true,
      deviceControl: { setting: "saver", value: true }
    };
  }
  if (
    lowerCmd.includes("battery saver off") || 
    lowerCmd.includes("saver off") || 
    lowerCmd.includes("battery saver band")
  ) {
    return {
      action: "Battery Saver turned OFF. High-performance mode restored!",
      isBrowserAction: true,
      deviceControl: { setting: "saver", value: false }
    };
  }

  // 9. Volume Control
  if (
    lowerCmd.includes("volume up") || 
    lowerCmd.includes("volume badhao") || 
    lowerCmd.includes("sound badhao") || 
    lowerCmd.includes("sound up") || 
    lowerCmd.includes("increase volume") ||
    lowerCmd.includes("volume zyada")
  ) {
    return {
      action: "Increasing device volume level for you!",
      isBrowserAction: true,
      deviceControl: { setting: "volume", value: "up" }
    };
  }
  if (
    lowerCmd.includes("volume down") || 
    lowerCmd.includes("volume kam") || 
    lowerCmd.includes("sound kam") || 
    lowerCmd.includes("sound down") || 
    lowerCmd.includes("decrease volume")
  ) {
    return {
      action: "Lowering volume level. Ah, sweet peace!",
      isBrowserAction: true,
      deviceControl: { setting: "volume", value: "down" }
    };
  }
  if (
    lowerCmd.includes("mute") || 
    lowerCmd.includes("silent phone") || 
    lowerCmd.includes("awaz band")
  ) {
    return {
      action: "Muted device volume completely.",
      isBrowserAction: true,
      deviceControl: { setting: "volume", value: 0 }
    };
  }
  if (
    lowerCmd.includes("unmute") || 
    lowerCmd.includes("awaz chalu")
  ) {
    return {
      action: "Unmuted volume back to 80%. Let's make some noise!",
      isBrowserAction: true,
      deviceControl: { setting: "volume", value: 80 }
    };
  }

  // 10. Brightness Control
  if (
    lowerCmd.includes("brightness up") || 
    lowerCmd.includes("brightness badhao") || 
    lowerCmd.includes("screen brightness up") ||
    lowerCmd.includes("brightness zyada")
  ) {
    return {
      action: "Increasing screen brightness. Watch your eyes, it's glowing!",
      isBrowserAction: true,
      deviceControl: { setting: "brightness", value: "up" }
    };
  }
  if (
    lowerCmd.includes("brightness down") || 
    lowerCmd.includes("brightness kam") || 
    lowerCmd.includes("screen brightness down") ||
    lowerCmd.includes("dim screen")
  ) {
    return {
      action: "Dimming screen brightness for comfortable reading.",
      isBrowserAction: true,
      deviceControl: { setting: "brightness", value: "down" }
    };
  }

  // 11. Battery Status & Charging Info
  if (
    lowerCmd.includes("battery level") || 
    lowerCmd.includes("battery percent") || 
    lowerCmd.includes("charging status") || 
    lowerCmd.includes("battery kitni") || 
    lowerCmd.includes("charging kitna") ||
    lowerCmd.includes("battery save")
  ) {
    return {
      action: "Checking your phone status... Battery level reports are fully synced!",
      isBrowserAction: true,
      deviceControl: { setting: "battery_status" }
    };
  }

  // --- EXISTING ACTIONS (COPIED AND STRENGTHENED) ---

  // Normal Call / Dialer
  const normalCallMatch = lowerCmd.match(/(?:normal\s+)?call\s+([\d\+\s\-]{10,})/);
  if (normalCallMatch && !lowerCmd.includes("whatsapp")) {
    const rawNumber = normalCallMatch[1].trim();
    const cleanNumber = rawNumber.replace(/[^\d\+]/g, "");
    return {
      action: `Opening your phone dialer to call ${rawNumber} immediately!`,
      url: `tel:${cleanNumber}`,
      isBrowserAction: true
    };
  }

  // WhatsApp Audio/Video Call Link
  const waCallMatch = lowerCmd.match(/whatsapp\s+call\s+([\d\+\s\-]{10,})/) || lowerCmd.match(/call\s+([\d\+\s\-]{10,})\s+on\s+whatsapp/);
  if (waCallMatch) {
    const rawNumber = waCallMatch[1].trim();
    const cleanNumber = rawNumber.replace(/[^\d\+]/g, "");
    return {
      action: `Opening WhatsApp chat for ${rawNumber} so you can tap the voice/video call button!`,
      url: `https://api.whatsapp.com/send?phone=${cleanNumber}`,
      isBrowserAction: true
    };
  }

  // WhatsApp Message
  const waMsgMatch = lowerCmd.match(/whatsapp\s+message\s+to\s+([\d\+\s\-]{10,})\s*(?:saying|:)?\s*(.+)$/) ||
                    lowerCmd.match(/send\s+(?:a\s+)?whatsapp\s+(?:message\s+)?to\s+([\d\+\s\-]{10,})\s*(?:saying|:)?\s*(.+)$/) ||
                    lowerCmd.match(/message\s+to\s+([\d\+\s\-]{10,})\s+on\s+whatsapp\s*(?:saying|:)?\s*(.+)$/);
  
  if (waMsgMatch) {
    const rawNumber = waMsgMatch[1].trim();
    const cleanNumber = rawNumber.replace(/[^\d\+]/g, "");
    const message = encodeURIComponent(waMsgMatch[2].trim());
    return {
      action: `Opening WhatsApp to send your message to ${rawNumber}. hope they respond soon!`,
      url: `https://api.whatsapp.com/send?phone=${cleanNumber}&text=${message}`,
      isBrowserAction: true,
    };
  }

  // Media Search: YouTube (flexible)
  const ytMatch = lowerCmd.match(/^play\s+(.+?)\s+on\s+youtube$/) || 
                  lowerCmd.match(/^youtube\s+play\s+(.+)$/) ||
                  lowerCmd.match(/^open\s+youtube\s+search\s+(.+)$/);
  if (ytMatch) {
    const query = encodeURIComponent(ytMatch[1].trim());
    return {
      action: `Opening YouTube search for: "${ytMatch[1].trim()}".`,
      url: `https://www.youtube.com/results?search_query=${query}`,
      isBrowserAction: true,
    };
  }

  // Media Search: Spotify (flexible)
  const spotifyMatch = lowerCmd.match(/^(?:play|search)\s+(.+?)\s+on\s+spotify$/) ||
                       lowerCmd.match(/^spotify\s+(?:play|search)\s+(.+)$/);
  if (spotifyMatch) {
    const query = encodeURIComponent(spotifyMatch[1].trim());
    return {
      action: `Searching for "${spotifyMatch[1].trim()}" on Spotify for you!`,
      url: `https://open.spotify.com/search/${query}`,
      isBrowserAction: true,
    };
  }

  // Google Maps Search
  const mapsMatch = lowerCmd.match(/^(?:open\s+)?maps\s+(?:for|to|search)\s+(.+)$/) ||
                    lowerCmd.match(/^navigate\s+to\s+(.+)$/) ||
                    lowerCmd.match(/^search\s+(.+?)\s+on\s+maps$/);
  if (mapsMatch) {
    const query = encodeURIComponent(mapsMatch[1].trim());
    return {
      action: `Opening Google Maps to show "${mapsMatch[1].trim()}".`,
      url: `https://www.google.com/maps/search/?api=1&query=${query}`,
      isBrowserAction: true,
    };
  }

  // General Website Opening
  const openMatch = lowerCmd.match(/^open\s+(.+)$/);
  if (openMatch && !lowerCmd.includes("youtube") && !lowerCmd.includes("spotify") && !lowerCmd.includes("maps")) {
    let website = openMatch[1].trim().replace(/\s+/g, "");
    if (!website.includes(".")) {
      website += ".com";
    }
    return {
      action: `Opening ${openMatch[1]} web page.`,
      url: `https://www.${website}`,
      isBrowserAction: true,
    };
  }

  return { action: "", isBrowserAction: false };
}
