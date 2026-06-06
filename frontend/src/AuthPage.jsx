import { useState } from "react";

const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Barlow:wght@300;400;600;700;900&family=Barlow+Condensed:wght@400;700;900&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg:        #060A0F;
      --bg-panel:  #0B1320;
      --bg-card:   #0F1B2D;
      --bg-input:  #0D1828;
      --border:    #1E3050;
      --border-hi: #2A4570;
      --border-focus: #2979FF;
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

    html, body, #root { height: 100%; background: var(--bg); color: var(--pri); font-family: var(--sans); }

    @keyframes fadeUp   { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
    @keyframes blink    { 0%,100%{opacity:1} 50%{opacity:0.25} }
    @keyframes gridPan  { 0%{background-position:0 0} 100%{background-position:60px 60px} }
    @keyframes spin     { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
    @keyframes counterSpin { from{transform:rotate(0deg)} to{transform:rotate(-360deg)} }
    @keyframes slideRight { from{opacity:0;transform:translateX(-20px)} to{opacity:1;transform:translateX(0)} }

    .auth-input {
      width: 100%;
      background: var(--bg-input);
      border: 1px solid var(--border);
      border-radius: 5px;
      color: var(--pri);
      font-family: var(--mono);
      font-size: 13px;
      padding: 13px 16px;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
      letter-spacing: 0.5px;
    }
    .auth-input::placeholder { color: var(--dim); }
    .auth-input:focus {
      border-color: var(--border-focus);
      box-shadow: 0 0 0 3px rgba(41,121,255,0.12);
    }

    .btn-submit {
      width: 100%;
      background: var(--red);
      color: #fff;
      border: none;
      border-radius: 5px;
      font-family: var(--cond);
      font-weight: 700;
      font-size: 15px;
      letter-spacing: 2px;
      padding: 15px;
      cursor: pointer;
      text-transform: uppercase;
      transition: background 0.2s, transform 0.15s;
      margin-top: 8px;
    }
    .btn-submit:hover { background: #e00030; transform: translateY(-1px); }
    .btn-submit:active { transform: scale(0.99); }
    .btn-submit:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

    .tab-btn {
      flex: 1;
      background: transparent;
      border: none;
      font-family: var(--cond);
      font-weight: 700;
      font-size: 14px;
      letter-spacing: 2px;
      padding: 14px;
      cursor: pointer;
      text-transform: uppercase;
      transition: color 0.2s;
    }

    .role-btn {
      flex: 1;
      background: transparent;
      border: 1px solid var(--border);
      border-radius: 5px;
      color: var(--sec);
      font-family: var(--mono);
      font-size: 11px;
      padding: 10px 8px;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
    }
    .role-btn:hover { border-color: var(--border-hi); color: var(--pri); }
    .role-btn.active { border-color: var(--cyan); color: var(--cyan); background: rgba(0,188,212,0.07); }

    .sso-btn {
      flex: 1;
      background: transparent;
      border: 1px solid var(--border);
      border-radius: 5px;
      color: var(--sec);
      font-family: var(--mono);
      font-size: 11px;
      padding: 11px 8px;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 7px;
    }
    .sso-btn:hover { border-color: var(--border-hi); color: var(--pri); background: var(--bg-hover, rgba(255,255,255,0.02)); }
  `}</style>
);

const PanelGraphic = () => (
  <div style={{ position:"relative", width:"100%", height:"100%", overflow:"hidden" }}>
    {/* Grid */}
    <div style={{
      position:"absolute", inset:0,
      backgroundImage:`
        linear-gradient(rgba(0,188,212,0.05) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0,188,212,0.05) 1px, transparent 1px)
      `,
      backgroundSize:"50px 50px",
      animation:"gridPan 10s linear infinite",
    }}/>
    {/* Gradient */}
    <div style={{
      position:"absolute", inset:0,
      background:"radial-gradient(ellipse 80% 80% at 50% 50%, rgba(255,45,75,0.08) 0%, transparent 70%)",
    }}/>

    {/* Radar */}
    <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:320, height:320 }}>
      {[150,110,70,35].map((r,i)=>(
        <div key={r} style={{
          position:"absolute", top:"50%", left:"50%",
          width:r*2, height:r*2, marginLeft:-r, marginTop:-r,
          borderRadius:"50%",
          border:`1px solid rgba(0,188,212,${0.05+i*0.05})`,
        }}/>
      ))}

      {/* Crosshairs */}
      <div style={{ position:"absolute", top:"50%", left:"10%", right:"10%", height:1, background:"rgba(0,188,212,0.08)", transform:"translateY(-50%)" }}/>
      <div style={{ position:"absolute", left:"50%", top:"10%", bottom:"10%", width:1, background:"rgba(0,188,212,0.08)", transform:"translateX(-50%)" }}/>

      {/* Spinning arcs */}
      <div style={{ position:"absolute", inset:0, animation:"spin 10s linear infinite" }}>
        <svg viewBox="0 0 320 320" style={{ width:"100%", height:"100%" }}>
          <path d="M160,10 A150,150 0 0,1 310,160" fill="none" stroke="var(--cyan)" strokeWidth="1.5" opacity="0.6"/>
          <circle cx="310" cy="160" r="3" fill="var(--cyan)" opacity="0.8"/>
        </svg>
      </div>
      <div style={{ position:"absolute", inset:30, animation:"counterSpin 7s linear infinite" }}>
        <svg viewBox="0 0 260 260" style={{ width:"100%", height:"100%" }}>
          <path d="M130,5 A125,125 0 0,0 5,130" fill="none" stroke="var(--red)" strokeWidth="1.5" opacity="0.5"/>
        </svg>
      </div>

      {/* Center */}
      <div style={{
        position:"absolute", top:"50%", left:"50%",
        transform:"translate(-50%,-50%)",
        width:70, height:70,
        display:"flex", alignItems:"center", justifyContent:"center",
      }}>
        <svg viewBox="0 0 60 68" width="48" height="54">
          <path d="M30 2 L54 12 L54 36 Q54 54 30 66 Q6 54 6 36 L6 12 Z"
            fill="rgba(255,45,75,0.1)" stroke="var(--red)" strokeWidth="1.5"/>
          <circle cx="30" cy="34" r="6" fill="var(--red)" opacity="0.9"/>
          <circle cx="30" cy="34" r="3" fill="#fff" opacity="0.5"/>
        </svg>
      </div>

      {/* Dots */}
      {[
        { top:"18%", left:"60%", color:"var(--red)",   label:"HIGH", blink:true  },
        { top:"68%", left:"24%", color:"var(--amber)", label:"MED",  blink:false },
        { top:"35%", left:"16%", color:"var(--green)", label:"OK",   blink:false },
      ].map(d=>(
        <div key={d.label} style={{ position:"absolute", top:d.top, left:d.left }}>
          <div style={{
            width:8, height:8, borderRadius:"50%", background:d.color,
            animation: d.blink ? "blink 1.3s infinite" : "none",
            boxShadow:`0 0 6px ${d.color}`,
          }}/>
        </div>
      ))}
    </div>
  </div>
);

const AuthForm = ({ onSuccess, defaultTab = "login", onError }) => {
  const [tab, setTab] = useState(defaultTab);
  const [role, setRole] = useState("security");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState({});

  const [loginForm, setLoginForm] = useState({ email:"", password:"" });
  const [signupForm, setSignupForm] = useState({ name:"", email:"", password:"", confirm:"", hospital:"", number:"" });

  const validate = () => {
    const e = {};
    if (tab === "login") {
      if (!loginForm.email)    e.email    = "Email required";
      if (!loginForm.password) e.password = "Password required";
    } else {
      if (!signupForm.name)     e.name     = "Full name required";
      if (!signupForm.email)    e.email    = "Email required";
      if (!signupForm.hospital) e.hospital = "Hospital name required";
      if (!signupForm.number)   e.number   = "Employee/ID number required";
      if (signupForm.password.length < 8) e.password = "Minimum 8 characters";
      if (signupForm.password !== signupForm.confirm) e.confirm = "Passwords do not match";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);

    try {
      if (tab === "login") {
        // Login request
        const response = await fetch("http://localhost:8080/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: loginForm.email,
            password: loginForm.password,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          setErrors({ submit: data.error || "Login failed" });
          setLoading(false);
          onError?.(data.error || "Login failed");
          return;
        }

        // Store auth token
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        onSuccess?.(data.user);
      } else {
        // Signup request
        const response = await fetch("http://localhost:8080/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: signupForm.name,
            email: signupForm.email,
            password: signupForm.password,
            hospital: signupForm.hospital,
            number: signupForm.number,
            role: role,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          setErrors({ submit: data.error || "Signup failed" });
          setLoading(false);
          onError?.(data.error || "Signup failed");
          return;
        }

        // Automatically log in after signup
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        onSuccess?.(data.user);
      }
    } catch (err) {
      setErrors({ submit: err.message });
      onError?.(err.message);
    }

    setLoading(false);
  };

  const EyeIcon = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5">
      {showPass
        ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></>
        : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
      }
    </svg>
  );

  const FieldError = ({ msg }) => msg
    ? <div style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--red)", marginTop:5 }}>↑ {msg}</div>
    : null;

  return (
    <div style={{ width:"100%", maxWidth:420, animation:"fadeUp 0.4s ease" }}>

      {/* Logo */}
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:32 }}>
        <svg width="28" height="28" viewBox="0 0 28 28">
          <polygon points="14,2 26,20 2,20" fill="none" stroke="var(--red)" strokeWidth="1.5"/>
          <polygon points="14,7 22,18 6,18" fill="rgba(255,45,75,0.12)" stroke="var(--red)" strokeWidth="0.5"/>
          <circle cx="14" cy="15" r="2" fill="var(--red)"/>
        </svg>
        <div>
          <div style={{ fontFamily:"var(--cond)", fontWeight:900, fontSize:17, letterSpacing:2 }}>
            HOSPITAL<span style={{ color:"var(--red)" }}>GUARD</span>
          </div>
          <div style={{ fontFamily:"var(--mono)", fontSize:8, color:"var(--dim)", letterSpacing:1 }}>
            AI VIOLENCE DETECTION SYSTEM
          </div>
        </div>
      </div>

      {/* Tab switcher */}
      <div style={{
        display:"flex", background:"var(--bg-panel)",
        border:"1px solid var(--border)", borderRadius:6,
        marginBottom:28, overflow:"hidden",
      }}>
        {[["login","LOGIN"],["signup","CREATE ACCOUNT"]].map(([k,l])=>(
          <button key={k} className="tab-btn" onClick={()=>{ setTab(k); setErrors({}); }}
            style={{
              color: tab===k ? "var(--pri)" : "var(--dim)",
              borderBottom: tab===k ? "2px solid var(--red)" : "2px solid transparent",
              background: tab===k ? "rgba(255,45,75,0.07)" : "transparent",
            }}>
            {l}
          </button>
        ))}
      </div>

      {/* Error message */}
      {errors.submit && (
        <div style={{
          background: "rgba(255,45,75,0.1)",
          border: "1px solid var(--red)",
          borderRadius: 5,
          padding: "10px 12px",
          marginBottom: 16,
          fontFamily: "var(--mono)",
          fontSize: 12,
          color: "var(--red)",
        }}>
          {errors.submit}
        </div>
      )}

      {/* ── Login form ── */}
      {tab === "login" && (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <div>
            <label style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--sec)", letterSpacing:1, display:"block", marginBottom:6 }}>
              EMAIL ADDRESS
            </label>
            <input
              className="auth-input"
              type="email"
              placeholder="admin@hospital.org"
              value={loginForm.email}
              onChange={e=>setLoginForm(p=>({...p,email:e.target.value}))}
            />
            <FieldError msg={errors.email}/>
          </div>

          <div>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
              <label style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--sec)", letterSpacing:1 }}>PASSWORD</label>
              <span style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--cyan)", cursor:"pointer" }}>FORGOT?</span>
            </div>
            <div style={{ position:"relative" }}>
              <input
                className="auth-input"
                type={showPass ? "text" : "password"}
                placeholder="••••••••"
                value={loginForm.password}
                onChange={e=>setLoginForm(p=>({...p,password:e.target.value}))}
                style={{ paddingRight:44 }}
              />
              <button
                onClick={()=>setShowPass(p=>!p)}
                style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:"var(--dim)", cursor:"pointer", padding:0, display:"flex" }}
              >
                <EyeIcon/>
              </button>
            </div>
            <FieldError msg={errors.password}/>
          </div>

          <button className="btn-submit" onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <span style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation:"spin 0.8s linear infinite" }}>
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.2"/>
                  <path d="M12 2 A10 10 0 0 1 22 12"/>
                </svg>
                AUTHENTICATING...
              </span>
            ) : "ACCESS DASHBOARD →"}
          </button>
        </div>
      )}

      {/* ── Signup form ── */}
      {tab === "signup" && (
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {/* Role selector */}
          <div>
            <label style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--sec)", letterSpacing:1, display:"block", marginBottom:8 }}>
              YOUR ROLE
            </label>
            <div style={{ display:"flex", gap:8 }}>
              {[
                { k:"security",  label:"SECURITY",  icon:"🛡" },
                { k:"admin",     label:"ADMIN",      icon:"⚙" },
                { k:"doctor",    label:"DOCTOR",     icon:"⚕" },
                { k:"it",        label:"IT STAFF",   icon:"🖥" },
              ].map(r=>(
                <button key={r.k} className={`role-btn${role===r.k?" active":""}`} onClick={()=>setRole(r.k)}>
                  <span style={{ fontSize:14 }}>{r.icon}</span>
                  <span>{r.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--sec)", letterSpacing:1, display:"block", marginBottom:6 }}>
              FULL NAME
            </label>
            <input
              className="auth-input"
              type="text"
              placeholder="Dr. Ravi Kumar"
              value={signupForm.name}
              onChange={e=>setSignupForm(p=>({...p,name:e.target.value}))}
            />
            <FieldError msg={errors.name}/>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <div>
              <label style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--sec)", letterSpacing:1, display:"block", marginBottom:6 }}>
                EMAIL
              </label>
              <input
                className="auth-input"
                type="email"
                placeholder="you@hospital.org"
                value={signupForm.email}
                onChange={e=>setSignupForm(p=>({...p,email:e.target.value}))}
              />
              <FieldError msg={errors.email}/>
            </div>
            <div>
              <label style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--sec)", letterSpacing:1, display:"block", marginBottom:6 }}>
                EMP. NUMBER
              </label>
              <input
                className="auth-input"
                type="text"
                placeholder="EMP-12345"
                value={signupForm.number}
                onChange={e=>setSignupForm(p=>({...p,number:e.target.value}))}
              />
              <FieldError msg={errors.number}/>
            </div>
          </div>

          <div>
            <label style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--sec)", letterSpacing:1, display:"block", marginBottom:6 }}>
              HOSPITAL
            </label>
            <input
              className="auth-input"
              type="text"
              placeholder="City Hospital"
              value={signupForm.hospital}
              onChange={e=>setSignupForm(p=>({...p,hospital:e.target.value}))}
            />
            <FieldError msg={errors.hospital}/>
          </div>

          <div>
            <label style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--sec)", letterSpacing:1, display:"block", marginBottom:6 }}>
              PASSWORD
            </label>
            <div style={{ position:"relative" }}>
              <input
                className="auth-input"
                type={showPass ? "text" : "password"}
                placeholder="Min. 8 characters"
                value={signupForm.password}
                onChange={e=>setSignupForm(p=>({...p,password:e.target.value}))}
                style={{ paddingRight:44 }}
              />
              <button
                onClick={()=>setShowPass(p=>!p)}
                style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:"var(--dim)", cursor:"pointer", padding:0, display:"flex" }}
              >
                <EyeIcon/>
              </button>
            </div>
            <FieldError msg={errors.password}/>
            {/* Strength bar */}
            {signupForm.password && (
              <div style={{ display:"flex", gap:3, marginTop:6 }}>
                {[1,2,3,4].map(i=>{
                  const len = signupForm.password.length;
                  const fill = len>=(i*3) ? (len>=12?"var(--green)":len>=8?"var(--amber)":"var(--red)") : "var(--border)";
                  return <div key={i} style={{ flex:1, height:3, borderRadius:2, background:fill, transition:"background 0.3s" }}/>;
                })}
              </div>
            )}
          </div>

          <div>
            <label style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--sec)", letterSpacing:1, display:"block", marginBottom:6 }}>
              CONFIRM PASSWORD
            </label>
            <input
              className="auth-input"
              type="password"
              placeholder="Repeat password"
              value={signupForm.confirm}
              onChange={e=>setSignupForm(p=>({...p,confirm:e.target.value}))}
            />
            <FieldError msg={errors.confirm}/>
          </div>

          <button className="btn-submit" onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <span style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation:"spin 0.8s linear infinite" }}>
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.2"/>
                  <path d="M12 2 A10 10 0 0 1 22 12"/>
                </svg>
                CREATING ACCOUNT...
              </span>
            ) : "CREATE ACCOUNT →"}
          </button>
        </div>
      )}
    </div>
  );
};

export default function AuthPage({ onSuccess, defaultTab, onClose }) {
  return (
    <>
      <GlobalStyle/>
      <div style={{
        position:"fixed", inset:0, zIndex:1000,
        background:"rgba(6,10,15,0.9)", backdropFilter:"blur(4px)",
        display:"flex", alignItems:"center", justifyContent:"center",
      }}>
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position:"absolute", top:20, right:20,
            background:"transparent", border:"1px solid var(--border)",
            color:"var(--sec)", padding:"6px 12px",
            fontFamily:"var(--mono)", fontSize:12,
            borderRadius:4, cursor:"pointer",
            transition:"all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.target.style.borderColor = "var(--cyan)";
            e.target.style.color = "var(--cyan)";
          }}
          onMouseLeave={(e) => {
            e.target.style.borderColor = "var(--border)";
            e.target.style.color = "var(--sec)";
          }}
        >
          CLOSE ✕
        </button>

        <div style={{ width:"100%", maxWidth:440 }}>
          <AuthForm onSuccess={onSuccess} defaultTab={defaultTab}/>
        </div>
      </div>
    </>
  );
}
