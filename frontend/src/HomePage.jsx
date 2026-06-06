import { useState, useEffect, useRef } from "react";
import AuthPage from "./AuthPage";

const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Barlow:ital,wght@0,300;0,400;0,600;0,700;0,900;1,300&family=Barlow+Condensed:wght@300;400;700;900&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg:        #060A0F;
      --bg-panel:  #0B1320;
      --bg-card:   #0F1B2D;
      --border:    #1E3050;
      --border-hi: #2A4570;
      --red:       #FF2D4B;
      --amber:     #FFB300;
      --green:     #00E676;
      --blue:      #2979FF;
      --cyan:      #00BCD4;
      --pri:       #E8F0FE;
      --sec:       #7A9CC0;
      --dim:       #3D5A80;
      --mono:      'Share Tech Mono', monospace;
      --sans:      'Barlow', sans-serif;
      --cond:      'Barlow Condensed', sans-serif;
    }

    html { scroll-behavior: smooth; }
    body, #root { background: var(--bg); color: var(--pri); font-family: var(--sans); overflow-x: hidden; }

    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: var(--bg); }
    ::-webkit-scrollbar-thumb { background: var(--border-hi); border-radius: 2px; }

    @keyframes fadeUp   { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
    @keyframes fadeIn   { from { opacity:0; } to { opacity:1; } }
    @keyframes blink    { 0%,100%{opacity:1} 50%{opacity:0.25} }
    @keyframes scanline { 0%{transform:translateY(-100%)} 100%{transform:translateY(100vh)} }
    @keyframes drift    { 0%,100%{transform:translateY(0) translateX(0)} 50%{transform:translateY(-18px) translateX(8px)} }
    @keyframes spin     { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
    @keyframes counterSpin { from{transform:rotate(0deg)} to{transform:rotate(-360deg)} }
    @keyframes pulse-red { 0%,100%{box-shadow:0 0 0 0 rgba(255,45,75,0.5)} 50%{box-shadow:0 0 0 12px rgba(255,45,75,0)} }
    @keyframes gridPan  { 0%{background-position:0 0} 100%{background-position:60px 60px} }
    @keyframes ticker   { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }

    .nav-link {
      font-family: var(--mono); font-size: 12px; color: var(--sec);
      text-decoration: none; letter-spacing: 1px; padding: 6px 0;
      transition: color 0.2s; cursor: pointer;
    }
    .nav-link:hover { color: var(--cyan); }

    .btn-primary {
      background: var(--red); color: #fff; border: none;
      font-family: var(--cond); font-weight: 700; font-size: 15px; letter-spacing: 2px;
      padding: 14px 32px; border-radius: 4px; cursor: pointer;
      transition: background 0.2s, transform 0.15s;
      text-transform: uppercase;
    }
    .btn-primary:hover { background: #e0001f; transform: translateY(-1px); }

    .btn-outline {
      background: transparent; color: var(--cyan);
      border: 1px solid var(--cyan);
      font-family: var(--cond); font-weight: 700; font-size: 15px; letter-spacing: 2px;
      padding: 13px 32px; border-radius: 4px; cursor: pointer;
      transition: background 0.2s, transform 0.15s;
      text-transform: uppercase;
    }
    .btn-outline:hover { background: rgba(0,188,212,0.08); transform: translateY(-1px); }

    .feature-card {
      background: var(--bg-card); border: 1px solid var(--border);
      border-radius: 8px; padding: 28px 24px;
      transition: border-color 0.3s, transform 0.3s;
    }
    .feature-card:hover { border-color: var(--border-hi); transform: translateY(-4px); }

    .stat-num {
      font-family: var(--cond); font-weight: 900; font-size: 52px;
      line-height: 1; letter-spacing: -1px;
    }
  `}</style>
);

/* ── Animated radar / logo graphic ─────────────────────────────── */
const RadarGraphic = () => (
  <div style={{ position:"relative", width:360, height:360, flexShrink:0 }}>
    {/* Outer rings */}
    {[160,120,80,40].map((r,i)=>(
      <div key={r} style={{
        position:"absolute",
        top:"50%", left:"50%",
        width:r*2, height:r*2,
        marginLeft:-r, marginTop:-r,
        borderRadius:"50%",
        border:`1px solid rgba(0,188,212,${0.06+i*0.04})`,
      }}/>
    ))}
    {/* Crosshairs */}
    <div style={{ position:"absolute", top:"50%", left:0, right:0, height:1, background:"rgba(0,188,212,0.1)", transform:"translateY(-50%)" }}/>
    <div style={{ position:"absolute", left:"50%", top:0, bottom:0, width:1, background:"rgba(0,188,212,0.1)", transform:"translateX(-50%)" }}/>

    {/* Spinning outer arc */}
    <div style={{
      position:"absolute", inset:0,
      animation:"spin 8s linear infinite",
    }}>
      <svg viewBox="0 0 360 360" style={{ width:"100%", height:"100%" }}>
        <circle cx="180" cy="180" r="158" fill="none" stroke="rgba(41,121,255,0.25)" strokeWidth="1" strokeDasharray="40 20"/>
        <path d="M180,22 A158,158 0 0,1 338,180" fill="none" stroke="var(--cyan)" strokeWidth="1.5"/>
      </svg>
    </div>

    {/* Counter-spinning inner ring */}
    <div style={{
      position:"absolute", inset:40,
      animation:"counterSpin 6s linear infinite",
    }}>
      <svg viewBox="0 0 280 280" style={{ width:"100%", height:"100%" }}>
        <circle cx="140" cy="140" r="120" fill="none" stroke="rgba(255,45,75,0.2)" strokeWidth="1" strokeDasharray="15 30"/>
        <path d="M140,20 A120,120 0 0,0 20,140" fill="none" stroke="var(--red)" strokeWidth="1.5" opacity="0.7"/>
      </svg>
    </div>

    {/* Center shield */}
    <div style={{
      position:"absolute", top:"50%", left:"50%",
      transform:"translate(-50%,-50%)",
      width:90, height:90,
      display:"flex", alignItems:"center", justifyContent:"center",
    }}>
      <svg viewBox="0 0 60 68" width="60" height="68">
        <path d="M30 2 L54 12 L54 36 Q54 54 30 66 Q6 54 6 36 L6 12 Z"
          fill="rgba(255,45,75,0.12)" stroke="var(--red)" strokeWidth="1.5"/>
        <path d="M30 14 L44 20 L44 36 Q44 46 30 54 Q16 46 16 36 L16 20 Z"
          fill="rgba(255,45,75,0.08)" stroke="rgba(255,45,75,0.4)" strokeWidth="1"/>
        <circle cx="30" cy="34" r="6" fill="var(--red)" opacity="0.9"/>
        <circle cx="30" cy="34" r="3" fill="#fff" opacity="0.5"/>
      </svg>
    </div>

    {/* Floating threat dots */}
    {[
      { top:"22%", left:"62%", color:"var(--red)",   delay:"0s",   label:"HIGH" },
      { top:"65%", left:"28%", color:"var(--amber)", delay:"0.5s", label:"MED"  },
      { top:"38%", left:"18%", color:"var(--green)", delay:"1s",   label:"OK"   },
    ].map((d)=>(
      <div key={d.label} style={{ position:"absolute", top:d.top, left:d.left }}>
        <div style={{
          width:10, height:10, borderRadius:"50%",
          background:d.color,
          animation:`blink 1.6s ${d.delay} infinite`,
          boxShadow:`0 0 8px ${d.color}`,
        }}/>
        <div style={{
          position:"absolute", top:-18, left:"50%", transform:"translateX(-50%)",
          fontFamily:"var(--mono)", fontSize:9, color:d.color, whiteSpace:"nowrap",
        }}>{d.label}</div>
      </div>
    ))}

    {/* Corner brackets */}
    {[
      { top:0, left:0,  borderTop:"2px solid var(--cyan)", borderLeft:"2px solid var(--cyan)" },
      { top:0, right:0, borderTop:"2px solid var(--cyan)", borderRight:"2px solid var(--cyan)" },
      { bottom:0, left:0,  borderBottom:"2px solid var(--cyan)", borderLeft:"2px solid var(--cyan)" },
      { bottom:0, right:0, borderBottom:"2px solid var(--cyan)", borderRight:"2px solid var(--cyan)" },
    ].map((s,i)=>(
      <div key={i} style={{ position:"absolute", width:20, height:20, ...s, opacity:0.6 }}/>
    ))}
  </div>
);

/* ── Ticker banner ──────────────────────────────────────────────── */
const TickerBar = () => {
  const items = [
    "AI-POWERED VIOLENCE DETECTION",
    "REAL-TIME CCTV ANALYSIS",
    "INSTANT SECURITY ALERTS",
    "8-CAMERA LIVE MONITORING",
    "BEHAVIOR PATTERN RECOGNITION",
    "CROWD ESCALATION DETECTION",
    "WEAPON DETECTION MODULE",
    "24/7 AUTOMATED SURVEILLANCE",
  ];
  const text = items.join("   ◆   ");
  const full = text + "   ◆   " + text;
  return (
    <div style={{
      background:"rgba(255,45,75,0.08)", borderTop:"1px solid rgba(255,45,75,0.3)",
      borderBottom:"1px solid rgba(255,45,75,0.3)", height:32,
      display:"flex", alignItems:"center", overflow:"hidden",
    }}>
      <div style={{
        display:"inline-block", whiteSpace:"nowrap",
        animation:"ticker 30s linear infinite",
        fontFamily:"var(--mono)", fontSize:11, color:"var(--red)", letterSpacing:1,
      }}>
        {full}
      </div>
    </div>
  );
};

/* ── Feature Icon ───────────────────────────────────────────────── */
const FeatureIcon = ({ path, color }) => (
  <div style={{
    width:44, height:44, borderRadius:8,
    background:`${color}15`, border:`1px solid ${color}40`,
    display:"flex", alignItems:"center", justifyContent:"center",
    marginBottom:16,
  }}>
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {path}
    </svg>
  </div>
);

/* ── Navbar ─────────────────────────────────────────────────────── */
const Navbar = ({ onLoginClick }) => {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <nav style={{
      position:"fixed", top:0, left:0, right:0, zIndex:100,
      background: scrolled ? "rgba(6,10,15,0.95)" : "transparent",
      backdropFilter: scrolled ? "blur(12px)" : "none",
      borderBottom: scrolled ? "1px solid var(--border)" : "1px solid transparent",
      transition:"all 0.3s",
      padding:"0 40px", height:60,
      display:"flex", alignItems:"center", gap:32,
    }}>
      {/* Logo */}
      <div style={{ display:"flex", alignItems:"center", gap:10, marginRight:"auto" }}>
        <svg width="26" height="26" viewBox="0 0 28 28">
          <polygon points="14,2 26,20 2,20" fill="none" stroke="var(--red)" strokeWidth="1.5"/>
          <polygon points="14,7 22,18 6,18" fill="rgba(255,45,75,0.12)" stroke="var(--red)" strokeWidth="0.5"/>
          <circle cx="14" cy="15" r="2" fill="var(--red)"/>
        </svg>
        <span style={{ fontFamily:"var(--cond)", fontWeight:900, fontSize:16, letterSpacing:2 }}>
          HOSPITAL<span style={{ color:"var(--red)" }}>GUARD</span>
        </span>
      </div>

      <a className="nav-link" href="#features">FEATURES</a>
      <a className="nav-link" href="#how-it-works">HOW IT WORKS</a>
      <a className="nav-link" href="#stats">IMPACT</a>

      <button onClick={onLoginClick} className="btn-outline" style={{ padding:"8px 22px", fontSize:12 }}>
        LOGIN
      </button>
    </nav>
  );
};

/* ── Hero section ───────────────────────────────────────────────── */
const Hero = ({ onGetStarted }) => (
  <section style={{
    minHeight:"100vh", display:"flex", alignItems:"center",
    padding:"80px 40px 60px",
    position:"relative", overflow:"hidden",
  }}>
    {/* Grid BG */}
    <div style={{
      position:"absolute", inset:0, zIndex:0,
      backgroundImage:`
        linear-gradient(rgba(41,121,255,0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(41,121,255,0.04) 1px, transparent 1px)
      `,
      backgroundSize:"60px 60px",
      animation:"gridPan 8s linear infinite",
    }}/>
    {/* Gradient overlay */}
    <div style={{
      position:"absolute", inset:0, zIndex:1,
      background:"radial-gradient(ellipse 60% 70% at 55% 50%, rgba(255,45,75,0.06) 0%, transparent 70%)",
    }}/>
    {/* Scanline */}
    <div style={{
      position:"absolute", left:0, right:0, height:"1px", zIndex:1,
      background:"rgba(0,188,212,0.15)",
      animation:"scanline 6s linear infinite",
    }}/>

    <div style={{
      maxWidth:1200, margin:"0 auto", width:"100%",
      display:"flex", alignItems:"center", gap:60,
      position:"relative", zIndex:2,
    }}>
      {/* Left text */}
      <div style={{ flex:1 }}>
        <div style={{
          display:"inline-flex", alignItems:"center", gap:8, marginBottom:24,
          background:"rgba(255,45,75,0.1)", border:"1px solid rgba(255,45,75,0.3)",
          borderRadius:3, padding:"5px 14px",
        }}>
          <span style={{ width:7, height:7, borderRadius:"50%", background:"var(--red)", display:"inline-block", animation:"blink 1.2s infinite" }}/>
          <span style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--red)", letterSpacing:1 }}>
            AI SURVEILLANCE SYSTEM — ACTIVE
          </span>
        </div>

        <h1 style={{
          fontFamily:"var(--cond)", fontWeight:900,
          fontSize:"clamp(44px,6vw,80px)", lineHeight:0.95,
          letterSpacing:-1, marginBottom:24,
        }}>
          PROTECT YOUR<br/>
          <span style={{ color:"var(--red)" }}>HOSPITAL</span><br/>
          STAFF & PATIENTS
        </h1>

        <p style={{
          fontFamily:"var(--sans)", fontWeight:300, fontSize:18, lineHeight:1.7,
          color:"var(--sec)", maxWidth:480, marginBottom:36,
        }}>
          AI-powered real-time violence detection across all CCTV feeds.
          Instant alerts. Zero blind spots. Faster security response.
        </p>

        <div style={{ display:"flex", gap:14, flexWrap:"wrap", marginBottom:48 }}>
          <button className="btn-primary" onClick={onGetStarted}>
            Get Started →
          </button>
          <button className="btn-outline">
            View Demo
          </button>
        </div>

        {/* Quick stats row */}
        <div style={{ display:"flex", gap:32, flexWrap:"wrap" }}>
          {[
            ["98.2%","Detection Accuracy"],
            ["<2s", "Alert Latency"],
            ["24/7", "Monitoring"],
          ].map(([v,l])=>(
            <div key={l}>
              <div style={{ fontFamily:"var(--cond)", fontWeight:900, fontSize:28, color:"var(--cyan)", letterSpacing:-0.5 }}>{v}</div>
              <div style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--dim)", marginTop:2 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right graphic */}
      <div style={{ flexShrink:0, display:"flex", justifyContent:"center" }}>
        <RadarGraphic/>
      </div>
    </div>
  </section>
);

/* ── Stats band ─────────────────────────────────────────────────── */
const StatsBand = () => (
  <section id="stats" style={{
    background:"var(--bg-panel)", borderTop:"1px solid var(--border)", borderBottom:"1px solid var(--border)",
    padding:"60px 40px",
  }}>
    <div style={{ maxWidth:1200, margin:"0 auto" }}>
      <div style={{ textAlign:"center", marginBottom:48 }}>
        <div style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--dim)", letterSpacing:2, marginBottom:8 }}>SYSTEM IMPACT</div>
        <h2 style={{ fontFamily:"var(--cond)", fontWeight:900, fontSize:36, letterSpacing:-0.5 }}>
          NUMBERS THAT MATTER
        </h2>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:24 }}>
        {[
          { n:"73%",   label:"Reduction in violent incidents",     color:"var(--red)"   },
          { n:"8×",    label:"Faster security response time",      color:"var(--cyan)"  },
          { n:"98.2%", label:"AI detection accuracy",              color:"var(--green)" },
          { n:"500+",  label:"Hospital cameras supported",         color:"var(--amber)" },
        ].map(s=>(
          <div key={s.n} style={{
            textAlign:"center", padding:"32px 16px",
            border:"1px solid var(--border)", borderRadius:8,
            background:"var(--bg-card)",
            borderTop:`2px solid ${s.color}`,
          }}>
            <div className="stat-num" style={{ color:s.color }}>{s.n}</div>
            <div style={{ fontFamily:"var(--sans)", fontSize:13, color:"var(--sec)", marginTop:10, lineHeight:1.5 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* ── Features section ───────────────────────────────────────────── */
const Features = () => (
  <section id="features" style={{ padding:"100px 40px" }}>
    <div style={{ maxWidth:1200, margin:"0 auto" }}>
      <div style={{ textAlign:"center", marginBottom:64 }}>
        <div style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--dim)", letterSpacing:2, marginBottom:8 }}>CAPABILITIES</div>
        <h2 style={{ fontFamily:"var(--cond)", fontWeight:900, fontSize:42, letterSpacing:-0.5 }}>
          INTELLIGENT PROTECTION<br/>
          <span style={{ color:"var(--red)" }}>AT EVERY CAMERA</span>
        </h2>
        <p style={{ fontFamily:"var(--sans)", color:"var(--sec)", marginTop:16, fontSize:16, maxWidth:520, margin:"16px auto 0" }}>
          Every module is designed for the demanding environment of a busy hospital.
        </p>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:20 }}>
        {[
          {
            color:"var(--red)",
            title:"Violence Detection",
            desc:"YOLOv8-powered model identifies physical aggression, fighting, and threatening body postures in real time.",
            icon:<><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></>,
          },
          {
            color:"var(--amber)",
            title:"Crowd Escalation",
            desc:"Tracks crowd density, movement vectors, and vocal patterns to detect escalating group behavior before it erupts.",
            icon:<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
          },
          {
            color:"var(--cyan)",
            title:"Real-Time Alerts",
            desc:"Instant push notifications and dashboard alerts reach security staff within 2 seconds of detection.",
            icon:<><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></>,
          },
          {
            color:"var(--blue)",
            title:"Multi-Camera Grid",
            desc:"Simultaneous analysis of up to 500 live feeds with per-camera threat scoring and status tracking.",
            icon:<><rect x="2" y="2" width="20" height="20" rx="2"/><path d="M2 12h20M12 2v20"/></>,
          },
          {
            color:"var(--green)",
            title:"Incident Analytics",
            desc:"Historical incident data, heatmaps, zone-by-zone risk scores, and weekly trend reports for security teams.",
            icon:<><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></>,
          },
          {
            color:"#AB47BC",
            title:"Weapon Detection",
            desc:"Computer vision model trained to identify knives, blunt objects, and other potential weapons in camera frames.",
            icon:<><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>,
          },
        ].map(f=>(
          <div key={f.title} className="feature-card">
            <FeatureIcon color={f.color} path={f.icon}/>
            <h3 style={{ fontFamily:"var(--cond)", fontWeight:700, fontSize:20, letterSpacing:0.5, marginBottom:10 }}>{f.title}</h3>
            <p style={{ fontFamily:"var(--sans)", fontSize:14, color:"var(--sec)", lineHeight:1.7 }}>{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* ── How it works ───────────────────────────────────────────────── */
const HowItWorks = () => (
  <section id="how-it-works" style={{
    padding:"100px 40px",
    background:"var(--bg-panel)", borderTop:"1px solid var(--border)",
  }}>
    <div style={{ maxWidth:1200, margin:"0 auto" }}>
      <div style={{ textAlign:"center", marginBottom:64 }}>
        <div style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--dim)", letterSpacing:2, marginBottom:8 }}>WORKFLOW</div>
        <h2 style={{ fontFamily:"var(--cond)", fontWeight:900, fontSize:42, letterSpacing:-0.5 }}>
          HOW <span style={{ color:"var(--cyan)" }}>HOSPITALGUARD</span> WORKS
        </h2>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:0, position:"relative" }}>
        {[
          { n:"01", color:"var(--cyan)",  title:"CCTV Input",         desc:"Live video streams ingested from existing hospital camera infrastructure in real time." },
          { n:"02", color:"var(--blue)",  title:"AI Processing",      desc:"YOLOv8 + optical flow models analyze each frame for behavior and motion patterns." },
          { n:"03", color:"var(--amber)", title:"Threat Scoring",      desc:"Confidence-weighted threat level assigned to each detected event per camera zone." },
          { n:"04", color:"var(--red)",   title:"Alert Dispatch",      desc:"Security personnel receive instant alerts with camera ID, severity, and snapshot." },
        ].map((s,i)=>(
          <div key={s.n} style={{
            padding:"36px 28px",
            borderRight: i<3 ? "1px solid var(--border)" : "none",
            position:"relative",
          }}>
            <div style={{
              fontFamily:"var(--mono)", fontSize:48, fontWeight:700,
              color:`${s.color}20`, lineHeight:1, marginBottom:16,
            }}>{s.n}</div>
            <div style={{ width:3, height:36, background:s.color, borderRadius:2, marginBottom:16 }}/>
            <h3 style={{ fontFamily:"var(--cond)", fontWeight:700, fontSize:18, letterSpacing:1, marginBottom:10 }}>{s.title}</h3>
            <p style={{ fontFamily:"var(--sans)", fontSize:14, color:"var(--sec)", lineHeight:1.7 }}>{s.desc}</p>
            {i<3 && (
              <div style={{
                position:"absolute", right:-10, top:"50%", transform:"translateY(-50%)",
                width:20, height:20, borderRadius:"50%",
                background:"var(--bg-panel)", border:"1px solid var(--border-hi)",
                display:"flex", alignItems:"center", justifyContent:"center",
                zIndex:2,
              }}>
                <svg viewBox="0 0 10 10" width="8" height="8">
                  <polyline points="2,2 8,5 2,8" fill="none" stroke="var(--sec)" strokeWidth="1.5"/>
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* ── CTA section ────────────────────────────────────────────────── */
const CTA = ({ onGetStarted }) => (
  <section style={{
    padding:"100px 40px", textAlign:"center",
    position:"relative", overflow:"hidden",
  }}>
    <div style={{
      position:"absolute", inset:0,
      background:"radial-gradient(ellipse 70% 60% at 50% 50%, rgba(255,45,75,0.07) 0%, transparent 70%)",
    }}/>
    <div style={{ position:"relative", zIndex:1, maxWidth:640, margin:"0 auto" }}>
      <div style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--dim)", letterSpacing:2, marginBottom:12 }}>
        READY TO DEPLOY
      </div>
      <h2 style={{ fontFamily:"var(--cond)", fontWeight:900, fontSize:"clamp(36px,5vw,60px)", letterSpacing:-1, lineHeight:1, marginBottom:20 }}>
        MAKE YOUR HOSPITAL<br/>
        <span style={{ color:"var(--red)" }}>SAFER TODAY</span>
      </h2>
      <p style={{ fontFamily:"var(--sans)", color:"var(--sec)", fontSize:17, lineHeight:1.7, marginBottom:40 }}>
        Deploy HospitalGuard on your existing camera infrastructure.
        No new hardware needed. Up and running in under 48 hours.
      </p>
      <div style={{ display:"flex", gap:14, justifyContent:"center", flexWrap:"wrap" }}>
        <button className="btn-primary" onClick={onGetStarted} style={{ fontSize:16, padding:"16px 40px" }}>
          Create Free Account →
        </button>
        <button className="btn-outline" style={{ fontSize:16, padding:"16px 40px" }}>
          Book a Demo
        </button>
      </div>
    </div>
  </section>
);

/* ── Footer ─────────────────────────────────────────────────────── */
const Footer = () => (
  <footer style={{
    background:"var(--bg-panel)", borderTop:"1px solid var(--border)",
    padding:"40px 40px 24px",
  }}>
    <div style={{ maxWidth:1200, margin:"0 auto" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:32, flexWrap:"wrap", gap:20 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <svg width="22" height="22" viewBox="0 0 28 28">
            <polygon points="14,2 26,20 2,20" fill="none" stroke="var(--red)" strokeWidth="1.5"/>
            <circle cx="14" cy="15" r="2" fill="var(--red)"/>
          </svg>
          <span style={{ fontFamily:"var(--cond)", fontWeight:900, fontSize:14, letterSpacing:2 }}>
            HOSPITAL<span style={{ color:"var(--red)" }}>GUARD</span>
          </span>
        </div>
        <div style={{ display:"flex", gap:32 }}>
          {["Privacy Policy","Terms of Use","Security","Contact"].map(l=>(
            <a key={l} style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--dim)", textDecoration:"none", cursor:"pointer" }}>{l}</a>
          ))}
        </div>
      </div>
      <div style={{ borderTop:"1px solid var(--border)", paddingTop:20, display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
        <span style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--dim)" }}>
          © 2025 HospitalGuard AI. All rights reserved.
        </span>
        <span style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--dim)" }}>
          Built for hospital safety · Powered by AI
        </span>
      </div>
    </div>
  </footer>
);

/* ── Root export ────────────────────────────────────────────────── */
export default function LandingPage({ onLogin }) {
  const [showAuthPage, setShowAuthPage] = useState(false);

  const handleAuthSuccess = (user) => {
    setShowAuthPage(false);
    onLogin?.(user);
  };

  const handleCloseAuth = () => {
    setShowAuthPage(false);
  };

  return (
    <>
      <GlobalStyle/>
      <Navbar onLoginClick={() => setShowAuthPage(true)}/>
      <TickerBar/>
      <Hero onGetStarted={() => setShowAuthPage(true)}/>
      <StatsBand/>
      <Features/>
      <HowItWorks/>
      <CTA onGetStarted={() => setShowAuthPage(true)}/>
      <Footer/>
      {showAuthPage && <AuthPage onSuccess={handleAuthSuccess} onClose={handleCloseAuth} defaultTab="login"/>}
    </>
  );
}