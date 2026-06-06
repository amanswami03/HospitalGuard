import { useState, useEffect, useRef } from "react";

// ── Notification System ──────────────────────────────────────────────────────
// Create audio element for alert sounds
const createAlertSound = () => {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  
  return {
    playHighAlert: () => {
      const now = audioContext.currentTime;
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.connect(gain);
      gain.connect(audioContext.destination);
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.setValueAtTime(600, now + 0.1);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.setValueAtTime(0, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    },
    playMediumAlert: () => {
      const now = audioContext.currentTime;
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.connect(gain);
      gain.connect(audioContext.destination);
      osc.frequency.setValueAtTime(600, now);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.setValueAtTime(0, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    },
  };
};

const alertSound = createAlertSound();

// ── Toast Notification Component ────────────────────────────────────────────
const Toast = ({ notification, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = notification.severity === "HIGH" ? "rgba(255,45,75,0.95)" : "rgba(255,179,0,0.95)";
  const borderColor = notification.severity === "HIGH" ? "var(--accent-red)" : "var(--accent-amb)";

  return (
    <div style={{
      position: "fixed",
      top: 20,
      right: 20,
      background: bgColor,
      border: `2px solid ${borderColor}`,
      borderRadius: 8,
      padding: 16,
      color: "#fff",
      fontFamily: "var(--mono)",
      fontSize: 12,
      maxWidth: 350,
      zIndex: 10000,
      boxShadow: `0 0 30px ${borderColor}88`,
      animation: "slideIn 0.3s ease-out",
      backdropFilter: "blur(8px)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div>
          <div style={{ fontWeight: 700, marginBottom: 4, fontSize: 13 }}>
            🚨 {notification.severity} ALERT
          </div>
          <div style={{ fontSize: 11, opacity: 0.9, lineHeight: 1.4 }}>
            <strong>{notification.type}</strong> detected on <strong>{notification.cam}</strong>
            <br/>Confidence: <strong>{notification.conf}%</strong>
            <br/>Time: {notification.time}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: "transparent",
            border: "none",
            color: "#fff",
            fontSize: 16,
            cursor: "pointer",
            padding: 0,
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
};

// ── API Configuration ────────────────────────────────────────────────────────
const API_BASE_URL = "http://localhost:8080/api";

// ── Fonts via @import in injected <style> ──────────────────────────────────
const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Barlow:wght@300;400;600;700;900&family=Barlow+Condensed:wght@400;700;900&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg-deep:    #060A0F;
      --bg-panel:   #0B1320;
      --bg-card:    #0F1B2D;
      --bg-hover:   #162236;
      --border:     #1E3050;
      --border-hi:  #2A4570;
      --accent-red: #FF2D4B;
      --accent-amb: #FFB300;
      --accent-grn: #00E676;
      --accent-blu: #2979FF;
      --accent-cyn: #00BCD4;
      --text-pri:   #E8F0FE;
      --text-sec:   #7A9CC0;
      --text-dim:   #3D5A80;
      --mono:       'Share Tech Mono', monospace;
      --sans:       'Barlow', sans-serif;
      --cond:       'Barlow Condensed', sans-serif;
    }

    html, body, #root { height: 100%; background: var(--bg-deep); color: var(--text-pri); font-family: var(--sans); }

    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: var(--bg-deep); }
    ::-webkit-scrollbar-thumb { background: var(--border-hi); border-radius: 2px; }

    @keyframes pulse-red {
      0%,100% { box-shadow: 0 0 0 0 rgba(255,45,75,0.6); }
      50%      { box-shadow: 0 0 0 8px rgba(255,45,75,0); }
    }
    @keyframes pulse-amb {
      0%,100% { box-shadow: 0 0 0 0 rgba(255,179,0,0.5); }
      50%      { box-shadow: 0 0 0 8px rgba(255,179,0,0); }
    }
    @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
    @keyframes scan {
      0%   { transform: translateY(0); opacity: 0.7; }
      100% { transform: translateY(100%); opacity: 0; }
    }
    @keyframes slideIn {
      from { transform: translateX(120%); opacity: 0; }
      to   { transform: translateX(0);   opacity: 1; }
    }
    @keyframes fadeUp {
      from { transform: translateY(12px); opacity: 0; }
      to   { transform: translateY(0);    opacity: 1; }
    }
    @keyframes ticker {
      0%   { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
  `}</style>
);

// ── Utility helpers ─────────────────────────────────────────────────────────
const fmt = (n) => String(n).padStart(2, "0");
const Clock = () => {
  const [t, setT] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setT(new Date()), 1000); return () => clearInterval(id); }, []);
  return (
    <span style={{ fontFamily: "var(--mono)", fontSize: 13, color: "var(--text-sec)" }}>
      {fmt(t.getHours())}:{fmt(t.getMinutes())}:{fmt(t.getSeconds())}
      {"  "}
      {t.toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" })}
    </span>
  );
};

// ── API Service ──────────────────────────────────────────────────────────────
const apiService = {
  async fetchCameras() {
    try {
      const response = await fetch(`${API_BASE_URL}/cameras`);
      if (!response.ok) throw new Error('Failed to fetch cameras');
      const data = await response.json();
      return data.cameras || [];
    } catch (error) {
      console.error('Error fetching cameras:', error);
      return [];
    }
  },

  async fetchAlerts(limit = 20) {
    try {
      const response = await fetch(`${API_BASE_URL}/cameras/alerts?limit=${limit}`);
      if (!response.ok) throw new Error('Failed to fetch alerts');
      const data = await response.json();
      return data.alerts || [];
    } catch (error) {
      console.error('Error fetching alerts:', error);
      return [];
    }
  },

  async clearAlerts() {
    try {
      const response = await fetch(`${API_BASE_URL}/cameras/alerts/clear`, {
        method: 'POST',
      });
      return response.ok;
    } catch (error) {
      console.error('Error clearing alerts:', error);
      return false;
    }
  },
};

// ── Transform camera data from API ────────────────────────────────────────────
function mapApiCameraToDisplay(apiCamera) {
  // Map API camera schema to display schema
  return {
    id: apiCamera.id,
    label: apiCamera.name,
    zone: apiCamera.zone || "Zone Unknown",
    status: "NORMAL",  // Will be updated based on alerts
    threat: "NONE",    // Will be updated based on alerts
    fps: 24,
    conf: 0,           // Will be updated based on latest alert
    streamURL: apiCamera.stream_url,
  };
}

// ── Transform alert data from API ────────────────────────────────────────────
function mapApiAlertToDisplay(apiAlert) {
  return {
    id: apiAlert.id,
    cam: apiAlert.camera_id,
    label: apiAlert.camera_name,
    type: apiAlert.type,
    conf: Math.round(apiAlert.confidence * 100),
    time: new Date(apiAlert.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    severity: apiAlert.severity,
    ack: false,  // Coming from API are new unacknowledged alerts
  };
}

const severityColor = (s) =>
  s === "HIGH" ? "var(--accent-red)" : s === "MEDIUM" ? "var(--accent-amb)" : "var(--accent-grn)";

// ── Live Video Player Component (TEST VIDEOS) ───────────────────────────────
// ╔════════════════════════════════════════════════════════════════════════════╗
// ║ CCTV STREAM CODE - COMMENTED OUT (Can uncomment to switch back to CCTV)    ║
// ╚════════════════════════════════════════════════════════════════════════════╝
const WebcamFeed = ({ cam, selected, onClick }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const isAlert = cam.status === "ALERT";
  const isWarn = cam.status === "WARNING";
  const borderClr = isAlert ? "var(--accent-red)" : isWarn ? "var(--accent-amb)" : "var(--border)";

  // Video files for testing
  const videoFiles = {
    cam_001: "/10644471-uhd_2160_3840_24fps.mp4",
    cam_002: "/221812620-street-fight-halloween-night-d.mp4",
    cam_003: "/126985517-izmir-turkey-1962-crowd-tries-.mp4",
    cam_004: "/117519535-istanbul-turkey-june-1-2013-hu.mp4",
  };

  // Load video
  useEffect(() => {
    const videoFile = videoFiles[cam.id];
    if (!videoFile) {
      setError("No video configured");
      return;
    }

    setError(null);
    if (videoRef.current) {
      videoRef.current.src = videoFile;
      videoRef.current.play().catch(err => {
        console.log("Autoplay blocked:", err);
      });
    }
  }, [cam.id]);

  // Handle video events
  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  // Capture frames from video and send to backend for analysis
  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const analyzeFrame = async () => {
      try {
        const ctx = canvasRef.current.getContext('2d');
        ctx.drawImage(videoRef.current, 0, 0, 1280, 720);

        canvasRef.current.toBlob(async (blob) => {
          if (!blob) return;
          
          const formData = new FormData();
          formData.append('frame', blob, 'frame.jpg');
          formData.append('camera_id', cam.id);

          try {
            const response = await fetch(`${API_BASE_URL}/cameras/detect`, {
              method: 'POST',
              body: formData,
            });
            const result = await response.json();
            
            // DEBUG: Log all detections
            console.log(`📸 [${cam.id}] Detection | Class: ${result.class_name} | Confidence: ${(result.confidence * 100).toFixed(1)}% | Threat: ${result.threat_detected}`);
            
            // Only trigger alert if actual violence is detected AND confidence is high
            if (result.threat_detected && result.class_name === "Violence" && result.confidence > 0.6) {
              console.log('🚨 Threat detected on', cam.id, ':', result);
            }
          } catch (err) {
            console.error("Analysis error:", err);
          }
        }, 'image/jpeg', 0.8);
      } catch (err) {
        console.error("Frame capture error:", err);
      }
    };

    const interval = setInterval(analyzeFrame, 2000); // Analyze every 2 seconds
    return () => clearInterval(interval);
  }, [cam.id]);

  /* ════════════════════════════════════════════════════════════════════════════
     COMMENTED OUT: CCTV STREAM LOADING CODE (Original Implementation)
     ════════════════════════════════════════════════════════════════════════════

  // Load CCTV stream
  useEffect(() => {
    if (!cam.streamURL) {
      setError("No stream URL configured");
      setIsStreaming(false);
      return;
    }

    setError(null);
    setIsStreaming(true);

    // For MJPEG streams, we continuously reload frames with cache bypass
    const streamImg = new Image();
    streamImg.crossOrigin = "anonymous";
    
    let frameTimestamp = 0;
    const loadFrame = () => {
      // Add timestamp to bypass caching
      const url = cam.streamURL + (cam.streamURL.indexOf('?') > -1 ? '&' : '?') + 't=' + Date.now();
      streamImg.src = url;
    };

    streamImg.onload = () => {
      // Update the canvas with the loaded image
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        try {
          ctx.drawImage(streamImg, 0, 0, 1280, 720);
        } catch (err) {
          // Canvas might not be ready yet
        }
      }
      if (imgRef.current) {
        imgRef.current.src = streamImg.src;
      }
      frameTimestamp = Date.now();
    };

    streamImg.onerror = () => {
      setError(`Stream unavailable: ${cam.label}`);
      console.error(`Failed to load stream from ${cam.streamURL}`);
    };

    // Load frames periodically (every 100ms = ~10 FPS)
    const frameInterval = setInterval(loadFrame, 100);
    loadFrame(); // Load first frame immediately

    return () => {
      clearInterval(frameInterval);
    };
  }, [cam.streamURL, cam.label]);

  // Capture frames from CCTV stream and send to backend for analysis
  useEffect(() => {
    if (!isStreaming || !canvasRef.current) return;

    const analyzeFrame = async () => {
      try {
        canvasRef.current.toBlob(async (blob) => {
          if (!blob) return;
          
          const formData = new FormData();
          formData.append('frame', blob, 'frame.jpg');
          formData.append('camera_id', cam.id);

          try {
            const response = await fetch(`${API_BASE_URL}/cameras/detect`, {
              method: 'POST',
              body: formData,
            });
            const result = await response.json();
            if (result.threat_detected) {
              console.log('🚨 Threat detected:', result);
            }
          } catch (err) {
            console.error("Analysis error:", err);
          }
        }, 'image/jpeg', 0.8);
      } catch (err) {
        console.error("Frame capture error:", err);
      }
    };

    const interval = setInterval(analyzeFrame, 2000); // Analyze every 2 seconds
    return () => clearInterval(interval);
  }, [isStreaming, cam.id]);

  ════════════════════════════════════════════════════════════════════════════ */

  return (
    <div
      onClick={onClick}
      style={{
        border: `1px solid ${selected ? "var(--accent-cyn)" : borderClr}`,
        borderRadius: 6,
        overflow: "hidden",
        cursor: "pointer",
        position: "relative",
        background: "#080E18",
        boxShadow: selected
          ? "0 0 0 2px var(--accent-cyn), 0 0 20px rgba(0,188,212,0.2)"
          : isAlert
          ? "0 0 0 1px var(--accent-red), 0 0 14px rgba(255,45,75,0.3)"
          : "none",
        animation: isAlert ? "pulse-red 1.8s infinite" : isWarn ? "pulse-amb 2.5s infinite" : "none",
        transition: "box-shadow 0.2s",
      }}
    >
      {/* Live video player */}
      <div style={{ aspectRatio: "16/9", position: "relative", background: "#000", overflow: "hidden" }}>
        {error ? (
          <div style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#080E18",
            color: "var(--accent-red)",
            fontFamily: "var(--mono)",
            fontSize: 12,
            textAlign: "center",
            padding: 20,
          }}>
            ⚠️ {error}
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              muted
              loop
              preload="metadata"
              onPlay={handlePlay}
              onPause={handlePause}
              onLoadedMetadata={handleLoadedMetadata}
              onTimeUpdate={handleTimeUpdate}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
              controls={false}
            />
            <canvas
              ref={canvasRef}
              width="1280"
              height="720"
              style={{ display: "none" }}
            />
          </>
        )}

        {/* Threat overlay */}
        {(isAlert || isWarn) && cam.conf > 0 && (
          <div style={{
            position: "absolute",
            top: "20%",
            left: "25%",
            width: 60,
            height: 60,
            border: `2px solid ${severityColor(cam.threat)}`,
            borderRadius: 4,
            boxShadow: `0 0 12px ${severityColor(cam.threat)}66`,
          }}>
            <div style={{
              position: "absolute",
              bottom: -18,
              left: "50%",
              transform: "translateX(-50%)",
              fontFamily: "var(--mono)",
              fontSize: 9,
              color: severityColor(cam.threat),
              whiteSpace: "nowrap",
            }}>
              {cam.threat} {cam.conf}%
            </div>
          </div>
        )}

        {/* REC badge */}
        <div style={{
          position: "absolute",
          top: 6,
          right: 8,
          display: "flex",
          alignItems: "center",
          gap: 4,
          fontFamily: "var(--mono)",
          fontSize: 9,
          color: "#fff",
        }}>
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: isPlaying ? "var(--accent-red)" : "#666",
              display: "inline-block",
              animation: isPlaying ? "blink 1.2s infinite" : "none",
            }}
          />
          {isPlaying ? `PLAYING 30fps` : "PAUSED"}
        </div>

        {/* Status badge */}
        {(isAlert || isWarn) && (
          <div style={{
            position: "absolute",
            bottom: 6,
            left: 6,
            background: isAlert ? "var(--accent-red)" : "var(--accent-amb)",
            color: "#fff",
            fontFamily: "var(--mono)",
            fontSize: 9,
            padding: "2px 6px",
            borderRadius: 2,
            animation: "blink 0.9s infinite",
            fontWeight: 700,
          }}>
            ⚠ {cam.status}
          </div>
        )}

        {/* Video progress bar */}
        {duration > 0 && (
          <div style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 2,
            background: "rgba(0,0,0,0.3)",
          }}>
            <div
              style={{
                height: "100%",
                background: "var(--accent-red)",
                width: `${(currentTime / duration) * 100}%`,
                transition: "width 0.1s linear",
              }}
            />
          </div>
        )}
      </div>

      {/* Label bar */}
      <div style={{ padding:"5px 8px", background:"var(--bg-panel)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <div style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--accent-cyn)" }}>{cam.id}</div>
          <div style={{ fontSize:11, color:"var(--text-sec)", fontFamily:"var(--cond)", letterSpacing:0.5 }}>{cam.label}</div>
        </div>
        <div style={{
          fontSize:10, fontFamily:"var(--mono)",
          color: isAlert ? "var(--accent-red)" : isWarn ? "var(--accent-amb)" : "var(--accent-grn)",
          fontWeight:700,
        }}>
          {cam.status}
        </div>
      </div>
    </div>
  );
};

// ── Alert row ───────────────────────────────────────────────────────────────
const AlertRow = ({ alert, onAck }) => (
  <div style={{
    display:"flex", gap:10, alignItems:"flex-start",
    padding:"10px 12px",
    background: alert.ack ? "transparent" : alert.severity==="HIGH" ? "rgba(255,45,75,0.07)" : "rgba(255,179,0,0.05)",
    borderBottom:"1px solid var(--border)",
    borderLeft: `3px solid ${alert.ack ? "var(--border)" : severityColor(alert.severity)}`,
    animation: alert.ack ? "none" : "fadeUp 0.3s ease",
    opacity: alert.ack ? 0.55 : 1,
    transition:"opacity 0.3s",
  }}>
    <div style={{
      width:8, height:8, borderRadius:"50%", marginTop:4, flexShrink:0,
      background: alert.ack ? "var(--text-dim)" : severityColor(alert.severity),
      animation: alert.ack ? "none" : "blink 1.2s infinite",
    }}/>
    <div style={{ flex:1, minWidth:0 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:2 }}>
        <span style={{ fontFamily:"var(--mono)", fontSize:11, color:severityColor(alert.severity), fontWeight:700 }}>
          {alert.severity}
        </span>
        <span style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--text-dim)" }}>{alert.time}</span>
      </div>
      <div style={{ fontSize:12, color:"var(--text-pri)", marginBottom:2, fontWeight:600 }}>{alert.type}</div>
      <div style={{ display:"flex", gap:8, alignItems:"center" }}>
        <span style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--accent-cyn)" }}>{alert.cam}</span>
        <span style={{ fontSize:10, color:"var(--text-dim)" }}>{alert.label}</span>
        <span style={{ marginLeft:"auto", fontFamily:"var(--mono)", fontSize:10, color:"var(--text-sec)" }}>
          {alert.conf}%
        </span>
      </div>
    </div>
    {!alert.ack && (
      <button
        onClick={() => onAck(alert.id)}
        style={{
          flexShrink:0, background:"transparent",
          border:"1px solid var(--border-hi)", borderRadius:3,
          color:"var(--text-sec)", fontFamily:"var(--mono)", fontSize:9,
          padding:"3px 7px", cursor:"pointer",
        }}
      >
        ACK
      </button>
    )}
  </div>
);

// ── Mini bar chart ──────────────────────────────────────────────────────────
const BarChart = ({ data }) => {
  const max = Math.max(...data);
  const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  return (
    <div style={{ display:"flex", alignItems:"flex-end", gap:5, height:60, padding:"0 4px" }}>
      {data.map((v,i) => (
        <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
          <div style={{ fontFamily:"var(--mono)", fontSize:9, color:"var(--text-dim)" }}>{v}</div>
          <div style={{
            width:"100%",
            height: `${(v/max)*44}px`,
            background: i===3 ? "var(--accent-red)" : "rgba(41,121,255,0.6)",
            borderRadius:"2px 2px 0 0",
            transition:"height 0.5s",
          }}/>
          <div style={{ fontFamily:"var(--mono)", fontSize:8, color:"var(--text-dim)" }}>{days[i]}</div>
        </div>
      ))}
    </div>
  );
};

// ── Stat card ───────────────────────────────────────────────────────────────
const StatCard = ({ label, value, unit, color, blink }) => (
  <div style={{
    background:"var(--bg-card)", border:"1px solid var(--border)",
    borderRadius:8, padding:"14px 16px",
    borderTop: `2px solid ${color}`,
  }}>
    <div style={{ fontSize:11, color:"var(--text-sec)", fontFamily:"var(--cond)", letterSpacing:1, marginBottom:6, textTransform:"uppercase" }}>{label}</div>
    <div style={{
      fontFamily:"var(--mono)", fontSize:28, fontWeight:700, color,
      animation: blink ? "blink 1.5s infinite" : "none",
    }}>
      {value}<span style={{ fontSize:13, marginLeft:4, color:"var(--text-dim)" }}>{unit}</span>
    </div>
  </div>
);

// ── Detection type pills ────────────────────────────────────────────────────
const DetectionTypes = () => {
  const types = [
    { label:"Physical Aggression",  color:"var(--accent-red)", pct:38 },
    { label:"Crowd Escalation",     color:"var(--accent-amb)", pct:22 },
    { label:"Suspicious Movement",  color:"var(--accent-blu)", pct:18 },
    { label:"Weapon Detection",     color:"#FF6B35",           pct:10 },
    { label:"Shouting/Altercation", color:"var(--accent-cyn)", pct:8  },
    { label:"Unauthorized Access",  color:"#AB47BC",           pct:4  },
  ];
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
      {types.map(t => (
        <div key={t.label}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
            <span style={{ fontSize:11, color:"var(--text-sec)" }}>{t.label}</span>
            <span style={{ fontFamily:"var(--mono)", fontSize:11, color:t.color }}>{t.pct}%</span>
          </div>
          <div style={{ height:4, background:"var(--bg-deep)", borderRadius:2 }}>
            <div style={{ height:"100%", width:`${t.pct}%`, background:t.color, borderRadius:2, transition:"width 0.8s" }}/>
          </div>
        </div>
      ))}
    </div>
  );
};

// ── Top ticker ──────────────────────────────────────────────────────────────
const Ticker = ({ alerts }) => {
  const active = alerts.filter(a=>!a.ack);
  if (!active.length) return null;
  const msg = active.map(a=>`⚠ ${a.severity} · ${a.cam} · ${a.type} · ${a.time}`).join("     ◆     ");
  const full = msg + "     ◆     " + msg;
  return (
    <div style={{
      background:"var(--accent-red)", overflow:"hidden", height:26,
      display:"flex", alignItems:"center",
    }}>
      <div style={{
        display:"inline-block", whiteSpace:"nowrap",
        animation:"ticker 18s linear infinite",
        fontFamily:"var(--mono)", fontSize:11, color:"#fff", fontWeight:700,
      }}>
        {full}
      </div>
    </div>
  );
};

// ── Main app ────────────────────────────────────────────────────────────────
export default function Dashboard({ onLogout }) {
  const [cameras, setCameras] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [selectedCam, setSelectedCam] = useState(null);
  const [activeTab, setActiveTab] = useState("live"); // live | analytics
  const [systemArmed, setSystemArmed] = useState(true);
  const [newAlertFlash, setNewAlertFlash] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [previousAlertCount, setPreviousAlertCount] = useState(0);
  const [dashboardStats, setDashboardStats] = useState({
    incidents_today: 0,
    active_alerts: 0,
    cameras_total: 0,
    cameras_online: 0,
    avg_response_time_min: 0,
    incidents_this_week: [0, 0, 0, 0, 0, 0, 0],
    detection_breakdown: {},
  });
  const alertEndRef = useRef(null);
  
  // Cooldown tracking for notifications (1 per camera per 7 seconds)
  const lastNotificationTimeRef = useRef({});
  const NOTIFICATION_COOLDOWN = 7000; // 7 seconds in milliseconds

  // Request browser notification permission
  useEffect(() => {
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Fetch cameras on mount and periodically
  useEffect(() => {
    // ═══════════════════════════════════════════════════════════════════════════
    // REGULAR CAMERA LOADING (FROM API) - COMMENTED OUT FOR VIDEO TESTING
    // ═══════════════════════════════════════════════════════════════════════════
    /*
    async function loadCameras() {
      setLoading(true);
      const camerasData = await apiService.fetchCameras();
      const displayCameras = camerasData.map(mapApiCameraToDisplay);
      setCameras(displayCameras);
      setLoading(false);
    }

    loadCameras();
    const cameraInterval = setInterval(loadCameras, 30000); // Refresh every 30s
    return () => clearInterval(cameraInterval);
    */

    // ═══════════════════════════════════════════════════════════════════════════
    // TEST VIDEO CAMERAS - UNCOMMENT ABOVE TO SWITCH BACK TO API CAMERAS
    // ═══════════════════════════════════════════════════════════════════════════
    const testCameras = [
      {
        id: "cam_001",
        label: "Test Video 1: Istanbul",
        zone: "Zone A",
        fps: 25,
      },
      {
        id: "cam_002",
        label: "Test Video 2: Izmir Crowd",
        zone: "Zone B",
        fps: 30,
      },
      {
        id: "cam_003",
        label: "Test Video 1: Istanbul (Copy)",
        zone: "Zone C",
        fps: 25,
      },
      {
        id: "cam_004",
        label: "Test Video 2: Izmir Crowd (Copy)",
        zone: "Zone D",
        fps: 30,
      },
    ];

    const displayCameras = testCameras.map(cam => ({
      ...cam,
      status: "NORMAL",
      threat: "NONE",
      conf: 0,
      streamURL: undefined, // Not needed for videos
    }));

    setCameras(displayCameras);
    setLoading(false);
  }, []);

  // Fetch alerts periodically
  useEffect(() => {
    async function loadAlerts() {
      const alertsData = await apiService.fetchAlerts(50);
      const displayAlerts = alertsData.map(mapApiAlertToDisplay);
      
      // Check for new alerts
      const newAlerts = displayAlerts.filter(alert => !alerts.some(a => a.id === alert.id));
      
      if (newAlerts.length > 0) {
        // Trigger notifications for new alerts with cooldown per camera
        newAlerts.forEach(alert => {
          const now = Date.now();
          const lastTime = lastNotificationTimeRef.current[alert.cam] || 0;
          const timeSinceLastNotification = now - lastTime;
          
          // Only show notification if cooldown period has passed for this camera
          if (timeSinceLastNotification >= NOTIFICATION_COOLDOWN) {
            console.log(`🔔 NEW ALERT: ${alert.severity} - ${alert.type} on ${alert.cam}`);
            lastNotificationTimeRef.current[alert.cam] = now;
            
            // Play sound based on severity
            if (alert.severity === "HIGH") {
              alertSound.playHighAlert();
              alertSound.playHighAlert(); // Double beep for high
            } else if (alert.severity === "MEDIUM") {
              alertSound.playMediumAlert();
            }
            
            // Show toast notification
            setNotifications(prev => [...prev, { ...alert, id: Math.random() }]);
            
            // Send WhatsApp notification to backend
            sendWhatsAppNotification(alert);
            
            // Send browser notification if permission granted
            if (Notification.permission === "granted") {
              new Notification(`🚨 ${alert.severity} ALERT - ${alert.type}`, {
                body: `Camera: ${alert.cam}\nConfidence: ${alert.conf}%\nTime: ${alert.time}`,
                icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='50' fill='%23FF2D4B'/><text x='50' y='60' font-size='60' text-anchor='middle' fill='white'>!</text></svg>",
                tag: `alert-${alert.id}`,
                requireInteraction: alert.severity === "HIGH",
              });
            }
            
            // Flash the UI
            setNewAlertFlash(true);
            setTimeout(() => setNewAlertFlash(false), 500);
          } else {
            console.log(`⏱️ Cooldown active for ${alert.cam}: ${Math.ceil((NOTIFICATION_COOLDOWN - timeSinceLastNotification) / 1000)}s remaining`);
          }
        });
      }
      
      setAlerts(displayAlerts);
    }

    loadAlerts();
    const alertInterval = setInterval(loadAlerts, 5000); // Refresh every 5s
    return () => clearInterval(alertInterval);
  }, [alerts]);

  // Fetch dashboard statistics periodically
  useEffect(() => {
    async function loadDashboardStats() {
      try {
        const response = await fetch(`${API_BASE_URL}/dashboard/stats`);
        if (!response.ok) throw new Error('Failed to fetch dashboard stats');
        const data = await response.json();
        setDashboardStats(data);
        console.log('📊 Dashboard stats updated:', data);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      }
    }

    loadDashboardStats();
    const statsInterval = setInterval(loadDashboardStats, 10000); // Refresh every 10s
    return () => clearInterval(statsInterval);
  }, []);

  // Send WhatsApp notification
  const sendWhatsAppNotification = async (alert) => {
    try {
      console.log('📱 Sending WhatsApp notification:', {
        type: alert.type,
        camera: alert.cam,
        severity: alert.severity,
        confidence: alert.conf,
      });
      
      const payload = {
        type: alert.type,
        camera_id: alert.cam,
        severity: alert.severity,
        confidence: alert.conf / 100, // Convert percentage to decimal (e.g., 95% -> 0.95)
      };
      
      console.log('📤 API Request:', {
        url: `${API_BASE_URL}/alerts/send-whatsapp`,
        method: 'POST',
        payload: payload,
      });
      
      const response = await fetch(`${API_BASE_URL}/alerts/send-whatsapp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      const responseData = await response.json();
      
      if (response.ok) {
        console.log('✅ WhatsApp notification sent successfully:', responseData);
      } else if (response.status === 429) {
        console.error('⚠️ Twilio Rate Limit:', {
          status: response.status,
          message: "Free Twilio account limit reached (50 messages/day)",
          data: responseData,
        });
        // Still show toast but with rate limit message
        setNotifications(prev => [...prev, { 
          id: Math.random(), 
          type: "⚠️ RATE LIMIT",
          message: "WhatsApp limit reached (50/day)",
          severity: "HIGH"
        }]);
      } else {
        console.error('❌ WhatsApp API error:', {
          status: response.status,
          data: responseData,
        });
      }
    } catch (err) {
      console.error('❌ Error sending WhatsApp notification:', err);
    }
  };

  // Scroll to latest alert
  useEffect(() => {
    alertEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [alerts]);

  const activeAlerts = alerts.filter(a=>!a.ack);

  // Update camera status and confidence based on latest alert
  const camerasWithAlert = cameras.map(cam => {
    const camAlerts = alerts.filter(a => a.cam === cam.id);
    if (camAlerts.length === 0) {
      return { ...cam, status: "NORMAL", threat: "NONE", conf: 0 };
    }
    
    const latestAlert = camAlerts[0];
    let status = "NORMAL";
    let threat = "LOW";

    if (latestAlert.severity === "HIGH") {
      status = "ALERT";
      threat = "HIGH";
    } else if (latestAlert.severity === "MEDIUM") {
      status = "WARNING";
      threat = "MEDIUM";
    } else {
      status = "WARNING";
      threat = "LOW";
    }

    return {
      ...cam,
      status,
      threat,
      conf: latestAlert.conf,
    };
  });

  const ackAlert = (id) => setAlerts(prev => prev.map(a=>a.id===id?{...a,ack:true}:a));
  const ackAll   = () => setAlerts(prev => prev.map(a=>({...a,ack:true})));
  
  const handleClearAlerts = async () => {
    const success = await apiService.clearAlerts();
    if (success) {
      setAlerts([]);
    }
  };

  const selectedCamera = camerasWithAlert.find(c=>c.id===selectedCam);

  
  // Simulate incoming alerts every 25s (for demo - in production use WebSocket)
  useEffect(() => {
    if (!systemArmed) return;
    
    // This is for demo purposes - in production, use WebSocket for real-time updates
    const id = setInterval(() => {
      // Alerts are fetched via polling, no need to simulate
    }, 25000);
    
    return ()=>clearInterval(id);
  }, [systemArmed]);

  return (
    <>
      <GlobalStyle/>
      
      {/* Notification Toasts */}
      <div style={{ position: "fixed", top: 0, right: 0, zIndex: 9999, pointerEvents: "none" }}>
        {notifications.map(notification => (
          <div key={notification.id} style={{ pointerEvents: "auto", marginBottom: 12 }}>
            <Toast 
              notification={notification} 
              onClose={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
            />
          </div>
        ))}
      </div>
      
      <div style={{ display:"flex", flexDirection:"column", height:"100vh", overflow:"hidden", background: newAlertFlash ? "rgba(255,45,75,0.05)" : "transparent", transition: "background 0.2s" }}>

        {/* ── Header ── */}
        <header style={{
          background:"var(--bg-panel)", borderBottom:"1px solid var(--border)",
          padding:"0 20px", display:"flex", alignItems:"center", gap:16, height:52,
          flexShrink:0,
        }}>
          {/* Logo */}
          <div style={{ display:"flex", alignItems:"center", gap:10, marginRight:8 }}>
            <svg width="28" height="28" viewBox="0 0 28 28">
              <polygon points="14,2 26,20 2,20" fill="none" stroke="var(--accent-red)" strokeWidth="1.5"/>
              <polygon points="14,7 22,18 6,18" fill="rgba(255,45,75,0.12)" stroke="var(--accent-red)" strokeWidth="0.5"/>
              <circle cx="14" cy="15" r="2" fill="var(--accent-red)"/>
            </svg>
            <div>
              <div style={{ fontFamily:"var(--cond)", fontWeight:900, fontSize:16, letterSpacing:2, color:"var(--text-pri)" }}>
                HOSPITAL<span style={{color:"var(--accent-red)"}}>GUARD</span>
              </div>
              <div style={{ fontFamily:"var(--mono)", fontSize:8, color:"var(--text-dim)", letterSpacing:1 }}>
                AI VIOLENCE DETECTION SYSTEM
              </div>
            </div>
          </div>

          {/* Nav tabs */}
          <div style={{ display:"flex", gap:2, marginLeft:12 }}>
            {[["live","⬛ LIVE MONITOR"],["analytics","◎ ANALYTICS"]].map(([k,l])=>(
              <button key={k} onClick={()=>setActiveTab(k)} style={{
                background: activeTab===k ? "rgba(41,121,255,0.15)" : "transparent",
                border: activeTab===k ? "1px solid var(--accent-blu)" : "1px solid transparent",
                color: activeTab===k ? "var(--accent-blu)" : "var(--text-dim)",
                fontFamily:"var(--mono)", fontSize:11, padding:"6px 14px", borderRadius:4, cursor:"pointer",
              }}>{l}</button>
            ))}
          </div>

          <div style={{ flex:1 }}/>

          {/* System status */}
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--text-dim)" }}>SYSTEM</span>
            <button onClick={()=>setSystemArmed(p=>!p)} style={{
              background: systemArmed ? "rgba(0,230,118,0.15)" : "rgba(255,45,75,0.12)",
              border: `1px solid ${systemArmed ? "var(--accent-grn)" : "var(--accent-red)"}`,
              color: systemArmed ? "var(--accent-grn)" : "var(--accent-red)",
              fontFamily:"var(--mono)", fontSize:11, padding:"4px 12px", borderRadius:3, cursor:"pointer",
              fontWeight:700,
            }}>
              {systemArmed ? "● ARMED" : "○ DISARMED"}
            </button>
          </div>

          {/* Active alerts badge */}
          <div style={{
            display:"flex", alignItems:"center", gap:6,
            background: activeAlerts.length>0 ? "rgba(255,45,75,0.12)" : "transparent",
            border: `1px solid ${activeAlerts.length>0 ? "var(--accent-red)" : "var(--border)"}`,
            borderRadius:4, padding:"4px 12px",
            animation: newAlertFlash ? "pulse-red 0.5s" : "none",
          }}>
            <span style={{
              width:7, height:7, borderRadius:"50%",
              background: activeAlerts.length>0 ? "var(--accent-red)" : "var(--text-dim)",
              animation: activeAlerts.length>0 ? "blink 1s infinite" : "none",
              display:"inline-block",
            }}/>
            <span style={{ fontFamily:"var(--mono)", fontSize:12, color: activeAlerts.length>0 ? "var(--accent-red)" : "var(--text-dim)" }}>
              {activeAlerts.length} ACTIVE
            </span>
          </div>

          <Clock/>

          {/* Logout button */}
          <button onClick={onLogout} style={{
            background:"transparent", border:"1px solid var(--border)", borderRadius:3,
            color:"var(--text-dim)", fontFamily:"var(--mono)", fontSize:10, padding:"4px 12px", cursor:"pointer",
            transition: "all 0.2s",
          }} onMouseEnter={(e) => { e.target.style.borderColor = "var(--accent-red)"; e.target.style.color = "var(--accent-red)"; }} onMouseLeave={(e) => { e.target.style.borderColor = "var(--border)"; e.target.style.color = "var(--text-dim)"; }}>
            LOGOUT
          </button>
        </header>

        {/* Ticker */}
        {activeAlerts.length > 0 && <Ticker alerts={alerts}/>}

        {/* ── Body ── */}
        {activeTab === "live" ? (
          <div style={{ flex:1, display:"flex", overflow:"hidden" }}>

            {/* Camera grid */}
            <div style={{ flex:1, overflow:"auto", padding:16 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                <div style={{ fontFamily:"var(--cond)", fontWeight:700, fontSize:13, letterSpacing:2, color:"var(--text-sec)", textTransform:"uppercase" }}>
                  Live Feeds — {cameras.length} Cameras {loading ? "Loading..." : "Online"}
                </div>
                <div style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--text-dim)" }}>
                  {camerasWithAlert.filter(c=>c.status==="ALERT").length} ALERT · {camerasWithAlert.filter(c=>c.status==="WARNING").length} WARNING · {camerasWithAlert.filter(c=>c.status==="NORMAL").length} NORMAL
                </div>
              </div>

              <div style={{
                display:"grid",
                gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",
                gap:10,
              }}>
                {camerasWithAlert.map(cam=>(
                  <WebcamFeed
                    key={cam.id}
                    cam={cam}
                    selected={selectedCam===cam.id}
                    onClick={()=>setSelectedCam(selectedCam===cam.id?null:cam.id)}
                  />
                ))}
              </div>

              {/* Selected camera detail */}
              {selectedCamera && (
                <div style={{
                  marginTop:14, background:"var(--bg-card)", border:"1px solid var(--border-hi)",
                  borderRadius:8, padding:16,
                  animation:"fadeUp 0.25s ease",
                }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                    <div>
                      <span style={{ fontFamily:"var(--mono)", fontSize:13, color:"var(--accent-cyn)" }}>{selectedCamera.id}</span>
                      <span style={{ fontFamily:"var(--cond)", fontSize:16, fontWeight:700, marginLeft:10, color:"var(--text-pri)" }}>{selectedCamera.label}</span>
                      <span style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--text-dim)", marginLeft:10 }}>{selectedCamera.zone}</span>
                    </div>
                    <button onClick={()=>setSelectedCam(null)} style={{
                      background:"transparent", border:"1px solid var(--border)", borderRadius:3,
                      color:"var(--text-dim)", fontFamily:"var(--mono)", fontSize:10, padding:"4px 10px", cursor:"pointer",
                    }}>CLOSE</button>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
                    {[
                      ["Status",     selectedCamera.status, selectedCamera.status==="ALERT"?"var(--accent-red)":selectedCamera.status==="WARNING"?"var(--accent-amb)":"var(--accent-grn)"],
                      ["Threat Level",selectedCamera.threat==="NONE"?"—":selectedCamera.threat, severityColor(selectedCamera.threat==="NONE"?"LOW":selectedCamera.threat)],
                      ["Confidence",  selectedCamera.conf>0?`${selectedCamera.conf}%`:"—", "var(--text-pri)"],
                      ["Frame Rate",  `${selectedCamera.fps} fps`, "var(--text-pri)"],
                    ].map(([lbl,val,col])=>(
                      <div key={lbl} style={{ background:"var(--bg-panel)", borderRadius:6, padding:"10px 12px" }}>
                        <div style={{ fontSize:10, color:"var(--text-dim)", fontFamily:"var(--cond)", letterSpacing:1, marginBottom:4, textTransform:"uppercase" }}>{lbl}</div>
                        <div style={{ fontFamily:"var(--mono)", fontSize:18, color:col, fontWeight:700 }}>{val}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right sidebar: alerts */}
            <div style={{
              width:320, flexShrink:0, borderLeft:"1px solid var(--border)",
              display:"flex", flexDirection:"column", overflow:"hidden",
              background:"var(--bg-panel)",
            }}>
              <div style={{
                padding:"10px 14px", borderBottom:"1px solid var(--border)",
                display:"flex", justifyContent:"space-between", alignItems:"center",
              }}>
                <span style={{ fontFamily:"var(--cond)", fontWeight:700, fontSize:13, letterSpacing:1, color:"var(--text-pri)", textTransform:"uppercase" }}>
                  Alert Log
                </span>
                {activeAlerts.length>0 && (
                  <button onClick={() => { ackAll(); handleClearAlerts(); }} style={{
                    background:"transparent", border:"1px solid var(--border)", borderRadius:3,
                    color:"var(--text-dim)", fontFamily:"var(--mono)", fontSize:9, padding:"3px 8px", cursor:"pointer",
                  }}>
                    ACK ALL
                  </button>
                )}
              </div>
              <div style={{ flex:1, overflowY:"auto" }}>
                {alerts.map(a=><AlertRow key={a.id} alert={a} onAck={ackAlert}/>)}
                <div ref={alertEndRef}/>
              </div>
            </div>
          </div>
        ) : (
          /* ── Analytics tab ── */
          <div style={{ flex:1, overflow:"auto", padding:20, display:"flex", flexDirection:"column", gap:16 }}>
            {/* Stats row */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
              <StatCard label="Active Alerts"      value={dashboardStats.active_alerts} unit=""   color="var(--accent-red)"  blink={dashboardStats.active_alerts>0}/>
              <StatCard label="Incidents Today"    value={dashboardStats.incidents_today}  unit="total" color="var(--accent-amb)"/>
              <StatCard label="Cameras Online"     value={`${dashboardStats.cameras_online}/${dashboardStats.cameras_total}`}   unit="" color="var(--accent-grn)"/>
              <StatCard label="Avg Response Time"  value={dashboardStats.avg_response_time_min} unit="min"   color="var(--accent-cyn)"/>
            </div>

            {/* Charts row */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>

              {/* Weekly bar */}
              <div style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:8, padding:16 }}>
                <div style={{ fontFamily:"var(--cond)", fontSize:13, fontWeight:700, letterSpacing:1, color:"var(--text-sec)", textTransform:"uppercase", marginBottom:12 }}>
                  Incidents — This Week
                </div>
                <BarChart data={dashboardStats.incidents_this_week}/>
                <div style={{ marginTop:10, display:"flex", gap:16, justifyContent:"center" }}>
                  {[["Today","var(--accent-red)"],["Previous","rgba(41,121,255,0.6)"]].map(([l,c])=>(
                    <div key={l} style={{ display:"flex", alignItems:"center", gap:5 }}>
                      <div style={{ width:10, height:10, background:c, borderRadius:2 }}/>
                      <span style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--text-dim)" }}>{l}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detection breakdown */}
              <div style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:8, padding:16 }}>
                <div style={{ fontFamily:"var(--cond)", fontSize:13, fontWeight:700, letterSpacing:1, color:"var(--text-sec)", textTransform:"uppercase", marginBottom:14 }}>
                  Detection Breakdown
                </div>
                <DetectionTypes/>
              </div>
            </div>

            {/* Camera health table */}
            <div style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:8, padding:16 }}>
              <div style={{ fontFamily:"var(--cond)", fontSize:13, fontWeight:700, letterSpacing:1, color:"var(--text-sec)", textTransform:"uppercase", marginBottom:12 }}>
                Camera Health & Status
              </div>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead>
                  <tr style={{ borderBottom:"1px solid var(--border)" }}>
                    {["Camera ID","Location","Zone","Status","Threat","Confidence","FPS"].map(h=>(
                      <th key={h} style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--text-dim)", textAlign:"left", padding:"6px 10px", fontWeight:400, letterSpacing:1 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {camerasWithAlert.map((c,i)=>(
                    <tr key={c.id} style={{
                      borderBottom:"1px solid var(--border)",
                      background: i%2===0?"transparent":"rgba(255,255,255,0.01)",
                    }}>
                      <td style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--accent-cyn)", padding:"8px 10px" }}>{c.id}</td>
                      <td style={{ fontSize:12, color:"var(--text-pri)", padding:"8px 10px" }}>{c.label}</td>
                      <td style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--text-dim)", padding:"8px 10px" }}>{c.zone}</td>
                      <td style={{ padding:"8px 10px" }}>
                        <span style={{
                          fontFamily:"var(--mono)", fontSize:10, padding:"2px 8px", borderRadius:3, fontWeight:700,
                          background: c.status==="ALERT"?"rgba(255,45,75,0.15)":c.status==="WARNING"?"rgba(255,179,0,0.12)":"rgba(0,230,118,0.1)",
                          color: c.status==="ALERT"?"var(--accent-red)":c.status==="WARNING"?"var(--accent-amb)":"var(--accent-grn)",
                        }}>{c.status}</span>
                      </td>
                      <td style={{ fontFamily:"var(--mono)", fontSize:11, color: c.threat==="HIGH"?"var(--accent-red)":c.threat==="MEDIUM"?"var(--accent-amb)":c.threat==="LOW"?"var(--accent-grn)":"var(--text-dim)", padding:"8px 10px" }}>
                        {c.threat==="NONE"?"—":c.threat}
                      </td>
                      <td style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--text-sec)", padding:"8px 10px" }}>
                        {c.conf>0?`${c.conf}%`:"—"}
                      </td>
                      <td style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--text-dim)", padding:"8px 10px" }}>{c.fps}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Recent incidents table */}
            <div style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:8, padding:16 }}>
              <div style={{ fontFamily:"var(--cond)", fontSize:13, fontWeight:700, letterSpacing:1, color:"var(--text-sec)", textTransform:"uppercase", marginBottom:12 }}>
                Recent Incident Log
              </div>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead>
                  <tr style={{ borderBottom:"1px solid var(--border)" }}>
                    {["#","Time","Camera","Location","Incident Type","Confidence","Severity","Status"].map(h=>(
                      <th key={h} style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--text-dim)", textAlign:"left", padding:"6px 10px", fontWeight:400, letterSpacing:1 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {alerts.map((a,i)=>(
                    <tr key={a.id} style={{
                      borderBottom:"1px solid var(--border)",
                      background: i%2===0?"transparent":"rgba(255,255,255,0.01)",
                    }}>
                      <td style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--text-dim)", padding:"8px 10px" }}>#{String(i+1).padStart(3,"0")}</td>
                      <td style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--text-sec)", padding:"8px 10px" }}>{a.time}</td>
                      <td style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--accent-cyn)", padding:"8px 10px" }}>{a.cam}</td>
                      <td style={{ fontSize:12, color:"var(--text-pri)", padding:"8px 10px" }}>{a.label}</td>
                      <td style={{ fontSize:11, color:"var(--text-pri)", padding:"8px 10px" }}>{a.type}</td>
                      <td style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--text-sec)", padding:"8px 10px" }}>{a.conf}%</td>
                      <td style={{ padding:"8px 10px" }}>
                        <span style={{
                          fontFamily:"var(--mono)", fontSize:10, padding:"2px 8px", borderRadius:3, fontWeight:700,
                          background: a.severity==="HIGH"?"rgba(255,45,75,0.15)":a.severity==="MEDIUM"?"rgba(255,179,0,0.12)":"rgba(0,230,118,0.1)",
                          color: severityColor(a.severity),
                        }}>{a.severity}</span>
                      </td>
                      <td style={{ fontFamily:"var(--mono)", fontSize:10, color: a.ack?"var(--accent-grn)":"var(--accent-amb)", padding:"8px 10px" }}>
                        {a.ack ? "✓ ACKNOWLEDGED" : "⏳ PENDING"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
