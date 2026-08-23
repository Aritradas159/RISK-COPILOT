import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, NavLink, Outlet, Route, Routes, useNavigate } from 'react-router-dom';
import { api } from './lib/api';
import { AlertTriangle, BarChart3, BookOpen, ChevronRight, CircleUserRound, History, LogOut, ShieldCheck, Sparkles, TrendingDown, TrendingUp, WalletCards, X, Zap } from 'lucide-react';
import { Area, AreaChart, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import './styles.css';

const AuthContext = createContext(null);
function useAuth(){ return useContext(AuthContext); }

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api('/auth/me').then(d => setUser(d.user)).catch(() => {}).finally(() => setLoading(false)); }, []);
  const value = useMemo(() => ({ user, setUser, loading }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="screen-center"><div className="spinner"/></div>;
  return user ? children : <Navigate to="/login" replace />;
}

function AppShell({ children }) {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const logout = async () => { try { await api('/auth/logout', { method: 'POST' }); } finally { setUser(null); navigate('/'); } };
  return <div className="app-shell">
    <header className="topbar">
      <NavLink to="/dashboard" className="brand"><span className="brand-mark">R</span><span>Risk <b>Copilot</b></span></NavLink>
      {user && <nav className="nav-links">
        <NavLink to="/dashboard">Dashboard</NavLink>
        <NavLink to="/simulator">Simulator</NavLink>
        <NavLink to="/learn">Learn</NavLink>
        <NavLink to="/history">History</NavLink>
      </nav>}
      {user && <div className="user-actions"><span className="user-chip"><CircleUserRound size={17}/>{user.name}</span><button className="icon-btn" onClick={logout} title="Logout"><LogOut size={17}/></button></div>}
    </header>
    <main><Outlet /></main>
  </div>;
}

function Landing(){
  const navigate = useNavigate();
  return <div className="landing">
    <div className="hero-glow"/>
    <div className="landing-nav"><NavLink to="/" className="brand"><span className="brand-mark">R</span><span>Risk <b>Copilot</b></span></NavLink><div><button className="btn ghost" onClick={()=>navigate('/login')}>Log in</button><button className="btn primary" onClick={()=>navigate('/signup')}>Create account</button></div></div>
    <section className="hero container">
      <div className="hero-copy"><div className="eyebrow"><Sparkles size={15}/> FINANCIAL LITERACY + RISK SIMULATION</div><h1>Understand your risk <span>before</span> you commit real money.</h1><p>A vernacular-first investment copilot that uses scenario-based Monte Carlo simulations to make probability of loss, drawdown and outcome ranges visible.</p><div className="hero-actions"><button className="btn primary large" onClick={()=>navigate('/signup')}>Try the simulator <ChevronRight size={19}/></button><button className="btn ghost large" onClick={()=>navigate('/learn')}>Explore learning</button></div><p className="mini-disclaimer"><ShieldCheck size={15}/> Illustrative what-if scenarios — not personalized financial advice.</p></div>
      <div className="hero-card"><div className="card-top"><span>RISK SNAPSHOT</span><span className="live-dot">● Demo</span></div><div className="risk-number">23.4%<small>probability of loss</small></div><div className="mini-chart"><div className="bars">{[30,46,38,63,56,78,69,92,74,57,43].map((h,i)=><i key={i} style={{height:`${h}%`}}/>)}</div></div><div className="metric-row"><div><small>5th percentile</small><b>₹72K</b></div><div><small>Median</small><b>₹1.12L</b></div><div><small>95th percentile</small><b>₹1.48L</b></div></div></div>
    </section>
    <section className="container feature-grid"><Feature icon={<BarChart3/>} title="Monte Carlo" text="Thousands of possible market scenarios instead of a single return prediction."/><Feature icon={<TrendingDown/>} title="Probability of loss" text="See downside, drawdown and outcome ranges before acting."/><Feature icon={<ShieldCheck/>} title="F&O friction gate" text="Pause, understand leverage risk, then continue."/><Feature icon={<BookOpen/>} title="English + Tamil" text="Short lessons appear exactly when they are useful."/></section>
  </div>
}
function Feature({icon,title,text}){ return <div className="feature-card"><div className="feature-icon">{icon}</div><h3>{title}</h3><p>{text}</p></div> }

function AuthPage({ mode }){
  const { setUser } = useAuth(); const navigate = useNavigate(); const [form,setForm]=useState({name:'',email:'',password:''}); const [error,setError]=useState(''); const [busy,setBusy]=useState(false);
  const submit=async(e)=>{e.preventDefault();setError('');setBusy(true);try{const data=await api(`/auth/${mode==='signup'?'signup':'login'}`,{method:'POST',body:JSON.stringify(form)});setUser(data.user);navigate('/dashboard')}catch(err){setError(err.message)}finally{setBusy(false)}};
  return <div className="auth-page"><div className="auth-card"><NavLink to="/" className="brand"><span className="brand-mark">R</span><span>Risk <b>Copilot</b></span></NavLink><div className="auth-heading"><div className="eyebrow">YOUR PRIVATE RISK WORKSPACE</div><h1>{mode==='signup'?'Create your account':'Welcome back'}</h1><p>{mode==='signup'?'Save simulations, track learning and keep your risk reports in one place.':'Continue exploring scenarios without losing your simulation history.'}</p></div><form onSubmit={submit}>{mode==='signup'&&<label>Full name<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Your name"/></label>}<label>Email<input required type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="you@example.com"/></label><label>Password<input required type="password" minLength={8} value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="At least 8 characters"/></label>{error&&<div className="error-box">{error}</div>}<button className="btn primary full" disabled={busy}>{busy?'Please wait…':mode==='signup'?'Create account':'Log in'}</button></form><p className="auth-switch">{mode==='signup'?'Already have an account? ':'New here? '}<button onClick={()=>navigate(mode==='signup'?'/login':'/signup')}>{mode==='signup'?'Log in':'Create an account'}</button></p></div></div>
}

function Dashboard(){
  const {user}=useAuth();
  const navigate=useNavigate();
  const [history,setHistory]=useState([]);
  const [lessonCount,setLessonCount]=useState(5);
  const fmt=n=>`₹${Number(n).toLocaleString('en-IN')}`;

  useEffect(()=>{
    api('/simulations/history').then(d=>{if(Array.isArray(d.simulations))setHistory(d.simulations)}).catch(()=>{});
    api('/learning').then(d=>{if(Array.isArray(d.lessons)&&d.lessons.length)setLessonCount(d.lessons.length)}).catch(()=>{});
  },[]);

  const latest=history[0]||null;

  return <div className="page container dash-page">
    {/* ── Hero ──────────────────────────────────────────────────────── */}
    <div className="dash-hero">
      <div className="dash-hero-copy">
        <div className="eyebrow">WELCOME BACK</div>
        <h1>{user.name}, understand<br/>the downside.</h1>
        <p>Run a scenario, learn what the numbers mean, and make the risk visible.</p>
      </div>
      <NavLink to="/simulator" className="btn primary large">Run simulation <ChevronRight size={19}/></NavLink>
    </div>

    {/* ── Main card grid ────────────────────────────────────────────── */}
    <div className="dash-grid">
      <div className="big-card gradient-card dash-copilot">
        <div className="eyebrow">YOUR COPILOT</div>
        <h2>Don't predict the market.<br/><span>Understand your risk.</span></h2>
        <p>Compare SIP, F&O and mixed scenarios using a probability-based model.</p>
        <NavLink to="/simulator" className="btn light">Start a scenario <ChevronRight size={16}/></NavLink>
      </div>

      <div className="dash-side-cards">
        <div className="stat-card dash-stat">
          <div className="stat-icon"><BarChart3 size={20}/></div>
          <small>SIMULATIONS</small>
          {latest?<>
            <strong>{latest.strategy.toUpperCase()} · {fmt(latest.initialInvestment)}</strong>
            <p>Loss probability: <b style={{color:latest.probabilityOfLoss>30?'var(--red)':'var(--green)'}}>{latest.probabilityOfLoss}%</b></p>
            <p style={{fontSize:10,color:'#5e7682'}}>{new Date(latest.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</p>
            <NavLink to="/history" className="text-link">View history →</NavLink>
          </>:<>
            <strong>Run your first one</strong>
            <p>Your recent risk reports will appear here.</p>
            <NavLink to="/simulator" className="text-link">Run simulation →</NavLink>
          </>}
        </div>

        <div className="stat-card dash-stat">
          <div className="stat-icon"><BookOpen size={20}/></div>
          <small>LEARNING</small>
          <strong>{lessonCount} micro-lessons</strong>
          <p>English and Tamil explanations for key concepts.</p>
          <NavLink to="/learn" className="text-link">Start learning →</NavLink>
        </div>
      </div>
    </div>

    {/* ── Recent risk insight ───────────────────────────────────────── */}
    {latest?<div className="dash-section">
      <div className="section-head"><div><div className="eyebrow">YOUR RECENT RISK</div><h2>Latest simulation snapshot</h2></div><NavLink to="/history" className="btn ghost">View full analysis <ChevronRight size={16}/></NavLink></div>
      <div className="dash-risk-row">
        <div className="dash-risk-metric"><small>Strategy</small><strong>{latest.strategy.toUpperCase()}</strong></div>
        <div className="dash-risk-metric"><small>Loss probability</small><strong style={{color:latest.probabilityOfLoss>30?'var(--red)':latest.probabilityOfLoss>15?'#ffcb70':'var(--green)'}}>{latest.probabilityOfLoss}%</strong></div>
        <div className="dash-risk-metric"><small>Profit probability</small><strong style={{color:'var(--green)'}}>{latest.probabilityOfProfit}%</strong></div>
        <div className="dash-risk-metric"><small>Median outcome</small><strong>{fmt(latest.medianOutcome)}</strong></div>
        <div className="dash-risk-metric"><small>Max drawdown</small><strong style={{color:parseFloat(latest.maxDrawdown)>40?'var(--red)':'#ffcb70'}}>{latest.maxDrawdown}%</strong></div>
      </div>
    </div>:<div className="dash-section">
      <div className="section-head"><div><div className="eyebrow">YOUR RECENT RISK</div><h2>No simulations yet</h2><p style={{marginTop:6}}>Run your first scenario and your risk snapshot will appear here.</p></div></div>
    </div>}

    {/* ── Explore your risk ─────────────────────────────────────────── */}
    <div className="dash-section">
      <div className="section-head"><div><div className="eyebrow">EXPLORE YOUR RISK</div><h2>Go deeper</h2></div></div>
      <div className="dash-explore-grid">
        <div className="dash-explore-card">
          <div className="dash-explore-icon"><Zap size={20}/></div>
          <h3>Scenario Lab</h3>
          <p>See how your portfolio behaves under different market conditions — crashes, volatility spikes, inflation shocks.</p>
          <button className="btn ghost" onClick={()=>navigate('/simulator')}>Explore <ChevronRight size={15}/></button>
        </div>
        <div className="dash-explore-card">
          <div className="dash-explore-icon"><BarChart3 size={20}/></div>
          <h3>Compare Strategies</h3>
          <p>Compare SIP, F&O and Mixed strategies side by side using real simulation results.</p>
          <button className="btn ghost" onClick={()=>navigate('/simulator')}>Compare <ChevronRight size={15}/></button>
        </div>
      </div>
    </div>

    {/* ── How it works ──────────────────────────────────────────────── */}
    <div className="dash-section">
      <div className="section-head"><div><h2>How it works</h2><p>Learn → Simulate → Understand → Apply</p></div></div>
      <div className="steps"><Step n="01" title="Choose a strategy" text="SIP, F&O or a mixed portfolio."/><Step n="02" title="Run 10,000 scenarios" text="Historical return behavior is resampled to create possible outcomes."/><Step n="03" title="See your downside" text="Probability of loss, drawdown and outcome ranges are shown together."/></div>
    </div>
  </div>;
}
function Step({n,title,text}){return <div className="step"><span>{n}</span><div><h3>{title}</h3><p>{text}</p></div></div>}

function Simulator(){
  const [strategy,setStrategy]=useState('sip'); const [form,setForm]=useState({initialInvestment:50000,monthlyInvestment:5000,durationYears:5,leverage:3}); const [result,setResult]=useState(null); const [busy,setBusy]=useState(false); const [error,setError]=useState(''); const [gate,setGate]=useState(false);
  const errors = {
    initialInvestment: (form.initialInvestment === '' || isNaN(Number(form.initialInvestment)) || Number(form.initialInvestment) <= 0) ? 'Must be greater than 0' : '',
    monthlyInvestment: (strategy !== 'fno' && (form.monthlyInvestment === '' || isNaN(Number(form.monthlyInvestment)) || Number(form.monthlyInvestment) < 0)) ? 'Must be 0 or greater' : '',
    durationYears: (form.durationYears === '' || isNaN(Number(form.durationYears)) || Number(form.durationYears) <= 0) ? 'Must be greater than 0' : '',
  };
  const isValid = !errors.initialInvestment && !errors.monthlyInvestment && !errors.durationYears;
  const run=async()=>{if(!isValid)return;setError('');setBusy(true);try{const data=await api('/simulations',{method:'POST',body:JSON.stringify({...form,initialInvestment:Number(form.initialInvestment),monthlyInvestment:Number(form.monthlyInvestment),durationYears:Number(form.durationYears),leverage:Number(form.leverage),strategy})});setResult(data)}catch(e){setError(e.message)}finally{setBusy(false)}};
  return <div className="page container"><div className="page-head"><div><div className="eyebrow">RISK SIMULATOR</div><h1>See the range, not just the return.</h1><p>Scenario-based analysis using thousands of possible outcomes.</p></div><div className="source-note"><span className="live-dot">●</span> {result?.source || 'Historical data path ready'}</div></div>
    <div className="sim-grid"><section className="panel"><div className="panel-title"><h2>1. Choose a strategy</h2><span>What are you exploring?</span></div><div className="strategy-grid">{[['sip','SIP','Systematic investing'],['fno','F&O','Leveraged exposure'],['mixed','Mixed','Core + higher-risk allocation']].map(([id,t,s])=><button key={id} className={`strategy ${strategy===id?'selected':''}`} onClick={()=>{setStrategy(id);setResult(null)}}><div className="strategy-radio">{strategy===id?'✓':''}</div><strong>{t}</strong><small>{s}</small></button>)}</div>{strategy==='fno'&&<div className="warning"><ShieldCheck size={20}/><div><b>High-risk scenario</b><p>Leverage can amplify both gains and losses. You'll get a risk checkpoint before the simulation runs.</p></div></div>}<div className="panel-title second"><h2>2. Set your scenario</h2><span>Use round numbers for a quick demo.</span></div><div className="form-grid"><label><span>Initial investment {errors.initialInvestment && <span style={{color:'var(--red)',fontSize:11,fontWeight:400,marginLeft:6}}>({errors.initialInvestment})</span>}</span><input type="number" min="1" value={form.initialInvestment} onChange={e=>setForm({...form,initialInvestment:e.target.value})}/></label>{strategy!=='fno'&&<label><span>Monthly SIP {errors.monthlyInvestment && <span style={{color:'var(--red)',fontSize:11,fontWeight:400,marginLeft:6}}>({errors.monthlyInvestment})</span>}</span><input type="number" min="0" value={form.monthlyInvestment} onChange={e=>setForm({...form,monthlyInvestment:e.target.value})}/></label>}<label><span>Duration (years) {errors.durationYears && <span style={{color:'var(--red)',fontSize:11,fontWeight:400,marginLeft:6}}>({errors.durationYears})</span>}</span><input type="number" min="1" max="30" value={form.durationYears} onChange={e=>setForm({...form,durationYears:e.target.value})}/></label>{strategy==='fno'&&<label><span>Leverage (×)</span><input type="number" min="1" max="5" step="0.5" value={form.leverage} onChange={e=>setForm({...form,leverage:e.target.value})}/></label>}</div>{error&&<div className="error-box">{error}</div>}<button className="btn primary full large" onClick={()=>isValid&&(strategy==='fno'?setGate(true):run())} disabled={busy||!isValid}>{busy?'Running 10,000 scenarios…':'Run simulation'} <BarChart3 size={19}/></button><p className="legal">Illustrative what-if scenario. Not personalized financial advice.</p></section>
    <section className="panel results-panel">{!result?<EmptyResult/>:<Results result={result} strategy={strategy} form={form}/>}</section></div>
    {gate&&<FrictionGate onClose={()=>setGate(false)} onContinue={()=>{setGate(false);run()}}/>}
  </div>
}
function EmptyResult(){return <div className="empty-result"><div className="empty-icon"><BarChart3/></div><h2>Your risk report will appear here</h2><p>Choose a strategy, set your scenario and run the simulation. We'll show probability of loss, outcome range and drawdown.</p></div>}
function Results({result,strategy,form}){
  const [tab,setTab]=useState('sim');
  const fmt=n=>`₹${Number(n).toLocaleString('en-IN')}`;
  const isFallback=String(result.source||'').toLowerCase().includes('fallback');
  return <div>
    <div className="result-head"><div><div className="eyebrow">SIMULATION COMPLETE</div><h2>Risk snapshot</h2></div><span className="pill">10,000 scenarios</span></div>
    {isFallback&&<div className="fallback-banner"><span>⚠</span> Live Nifty 50 data was unavailable for this run — results use a synthetic sample dataset, not real market history.</div>}
    <div className="lang-toggle" style={{margin:'16px 0'}}>
      <button className={tab==='sim'?'active':''} onClick={()=>setTab('sim')}>Simulation</button>
      <button className={tab==='scenario'?'active':''} onClick={()=>setTab('scenario')}>Scenario Lab</button>
      <button className={tab==='compare'?'active':''} onClick={()=>setTab('compare')}>Compare</button>
      <button className={tab==='timing'?'active':''} onClick={()=>setTab('timing')}>Bad timing</button>
    </div>
    {tab==='sim'?<div>
      <div className="risk-main"><div><span>Probability of loss</span><strong>{result.probabilityOfLoss}%</strong></div><div className="risk-meter"><i style={{width:`${Math.min(100,result.probabilityOfLoss)}%`}}/></div><small className="invested-note">Measured against total invested: {fmt(result.totalInvested)}</small></div>
      <div className="metrics"><Metric title="Probability of profit" value={`${result.probabilityOfProfit}%`} icon={<TrendingUp/>}/><Metric title="Median outcome" value={fmt(result.medianOutcome)} icon={<WalletCards/>}/><Metric title="Max drawdown" value={`${result.maxDrawdown}%`} icon={<TrendingDown/>}/></div>
      {result.yearlyBands&&<YearlyFanChart bands={result.yearlyBands} fdPath={result.fdPath} fmt={fmt}/>}
      <div className="chart-card"><div className="chart-head"><div><b>Outcome distribution</b><small>Illustrative scenario range</small></div><div className="range"><span>5th</span>{fmt(result.percentile5)} <span>95th</span>{fmt(result.percentile95)}</div></div><div className="chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={result.distribution}><XAxis dataKey="outcome" tickFormatter={v=>`₹${Math.round(v/1000)}k`} hide/><YAxis hide/><Tooltip formatter={(v)=>[v,'scenarios']} labelFormatter={v=>fmt(v)}/><Area type="monotone" dataKey="count" stroke="#37d98b" fill="#37d98b" fillOpacity={0.15}/></AreaChart></ResponsiveContainer></div></div>
      <RiskBreakdown result={result} strategy={strategy} fmt={fmt}/>
      <div className="insight"><Sparkles size={19}/><div><b>What does this mean?</b><p>{result.probabilityOfLoss < 20 ? 'The simulated downside probability is relatively lower, but outcomes can still vary. Look at the 5th percentile before drawing conclusions.' : 'The simulated downside probability is meaningful. Review drawdown and the lower outcome range before considering the scenario.'}</p></div></div>
      <ExplainMyRisk result={result} strategy={strategy} fmt={fmt}/>
      <p className="legal">Source: {result.source}. Simulations are illustrative and do not constitute personalized investment advice.</p>
    </div>:tab==='scenario'?<ScenarioLabPanel form={form} strategy={strategy} fmt={fmt}/>:tab==='compare'?<ComparePanel form={form} fmt={fmt}/>:<BadTimingPanel form={form} fmt={fmt}/>}
  </div>
}

function YearlyFanChart({bands,fdPath,fmt}){
  const data=bands.map((b,i)=>({year:b.year,p10:b.p10,median:b.median,p90:b.p90,fd:fdPath?.[i]?.balance,band:b.p90-b.p10}));
  return <div className="chart-card" style={{marginBottom:16}}>
    <div className="chart-head"><div><b>Outcome over time</b><small>P10–P90 range vs. median vs. a fixed deposit</small></div></div>
    <div className="chart" style={{height:220}}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1c3542"/>
          <XAxis dataKey="year" stroke="#6f8690" fontSize={11}/>
          <YAxis stroke="#6f8690" fontSize={11} tickFormatter={v=>`₹${Math.round(v/1000)}k`}/>
          <Tooltip formatter={(v,name)=>[fmt(v),name]} labelFormatter={y=>`Year ${y}`} contentStyle={{background:'#0d1d2a',border:'1px solid #243d49'}}/>
          <Area dataKey="p10" stackId="band" stroke="none" fill="transparent"/>
          <Area dataKey="band" stackId="band" stroke="none" fill="#37d98b" fillOpacity={0.12} name="P10–P90 range"/>
          <Line type="monotone" dataKey="median" stroke="#37d98b" strokeWidth={2.5} dot={false} name="Median outcome"/>
          <Line type="monotone" dataKey="fd" stroke="#73b9ff" strokeWidth={1.5} strokeDasharray="4 3" dot={false} name="Fixed deposit"/>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  </div>
}

function BadTimingPanel({form,fmt}){
  const [startYear,setStartYear]=useState(2008);
  const [data,setData]=useState(null);
  const [busy,setBusy]=useState(false);
  const [err,setErr]=useState('');
  const years=[2000,2003,2007,2008,2011,2015,2020,2022];
  const run=async()=>{
    setBusy(true);setErr('');
    try{
      const res=await api('/simulations/bad-timing',{method:'POST',body:JSON.stringify({initialInvestment:Number(form.initialInvestment),monthlyInvestment:form.monthlyInvestment?Number(form.monthlyInvestment):0,durationYears:Number(form.durationYears),startYear})});
      setData(res);
    }catch(e){setErr(e.message)}finally{setBusy(false)}
  };
  return <div>
    <h3 style={{margin:'0 0 6px'}}>What if you started right before a crash?</h3>
    <p style={{color:'#8ea4af',fontSize:13,margin:'0 0 16px'}}>Replays the <i>actual</i> historical sequence of returns starting from a chosen year — no randomness, just what really happened.</p>
    <div style={{display:'flex',gap:10,alignItems:'center',marginBottom:18}}>
      <label style={{fontSize:12,color:'#c4d2d8',fontWeight:700}}>Start year
        <select value={startYear} onChange={e=>setStartYear(Number(e.target.value))} style={{display:'block',marginTop:6,background:'#081822',color:'#fff',border:'1px solid #29414e',borderRadius:10,padding:'8px 10px'}}>
          {years.map(y=><option key={y} value={y}>{y}</option>)}
        </select>
      </label>
      <button className="btn primary" onClick={run} disabled={busy} style={{marginTop:20}}>{busy?'Replaying…':'Replay history'}</button>
    </div>
    {err&&<div className="error-box">{err}</div>}
    {data&&<div>
      <div className="chart" style={{height:220}}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data.path}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1c3542"/>
            <XAxis dataKey="actualYear" stroke="#6f8690" fontSize={11}/>
            <YAxis stroke="#6f8690" fontSize={11} tickFormatter={v=>`₹${Math.round(v/1000)}k`}/>
            <Tooltip formatter={v=>fmt(v)} labelFormatter={y=>`Year ${y}`} contentStyle={{background:'#0d1d2a',border:'1px solid #243d49'}}/>
            <Line type="monotone" dataKey="balance" stroke="#ff6b6b" strokeWidth={2.5} dot={{r:3}}/>
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p style={{color:'#8ea4af',fontSize:13,marginTop:14}}>Starting a SIP in <b>{startYear}</b> and staying invested through {data.path.length} years would have ended at <b style={{color:'#eaf2f7'}}>{fmt(data.path[data.path.length-1].balance)}</b> on {fmt(data.totalInvested)} invested — including whatever crash happened to fall in that window.</p>
      {data.truncated&&<p style={{color:'#ffcb70',fontSize:12,marginTop:8}}>⚠ Only {data.yearsAvailable} year(s) of real historical data are available from {startYear} onward — shown above as-is, not padded with unrelated years.</p>}
      <p className="legal" style={{marginTop:14}}>Source: {data.source}. This replays real historical returns for illustration only and does not constitute personalized investment advice.</p>
    </div>}
  </div>
}
function Metric({title,value,icon}){return <div className="metric"><div className="metric-icon">{icon}</div><small>{title}</small><strong>{value}</strong></div>}
function FrictionGate({onClose,onContinue}){return <div className="modal-backdrop"><div className="friction-modal"><button className="close" onClick={onClose}><X/></button><div className="friction-icon"><ShieldCheck/></div><div className="eyebrow">PAUSE → UNDERSTAND → CONTINUE</div><h2>Are you sure you understand leverage risk?</h2><p>F&O can magnify both gains and losses. This simulator shows possible outcomes — it does not predict the market.</p><div className="leverage-box"><span>₹10,000 capital</span><b>× 3 leverage</b><span>₹30,000 exposure</span></div><NavLink to="/learn" className="text-link">Learn about leverage first →</NavLink><button className="btn primary full" onClick={onContinue}>I understand — run scenario</button><button className="btn ghost full" onClick={onClose}>Go back</button></div></div>}

// ── Feature 1: Scenario Lab ─────────────────────────────────────────
function ScenarioLabPanel({form,strategy,fmt}){
  const presets=[
    {id:'crash',label:'Market Crash',desc:'Severe downturn — returns scaled to ~35% of historical with a negative shift.'},
    {id:'decline',label:'Moderate Decline',desc:'Returns reduced to ~60% of historical with a mild negative shift.'},
    {id:'highVolatility',label:'High Volatility',desc:'Return spreads amplified 2.2× — same average, much wider range.'},
    {id:'inflationShock',label:'Inflation Shock',desc:'All real returns reduced by 6 percentage points.'},
    {id:'custom',label:'Custom Scenario',desc:'You choose the return adjustment and volatility multiplier.'},
  ];
  const [selected,setSelected]=useState('crash');
  const [customAdj,setCustomAdj]=useState(-10);
  const [customVol,setCustomVol]=useState(1.5);
  const [data,setData]=useState(null);
  const [busy,setBusy]=useState(false);
  const [err,setErr]=useState('');

  const run=async()=>{
    setBusy(true);setErr('');
    try{
      const body={
        strategy,
        initialInvestment:Number(form.initialInvestment),
        monthlyInvestment:Number(form.monthlyInvestment)||0,
        durationYears:Number(form.durationYears),
        leverage:Number(form.leverage)||1,
        scenarioType:selected,
      };
      if(selected==='custom') body.custom={returnAdjustment:customAdj/100,volatilityMultiplier:customVol};
      const res=await api('/simulations/scenario',{method:'POST',body:JSON.stringify(body)});
      setData(res);
    }catch(e){setErr(e.message)}finally{setBusy(false)}
  };

  const MetricCell=({label,base,stress,pct})=>{
    const worse=pct?(stress>base):(stress<base);
    const better=pct?(stress<base):(stress>base);
    return <div className="scenario-metric-row">
      <span>{label}</span>
      <span>{pct?`${base}%`:fmt(base)}</span>
      <span style={{color:worse?'var(--red)':better?'var(--green)':'inherit'}}>{pct?`${stress}%`:fmt(stress)}</span>
    </div>;
  };

  return <div>
    <h3 style={{margin:'0 0 6px'}}>What happens if market conditions change?</h3>
    <p style={{color:'#8ea4af',fontSize:13,margin:'0 0 16px'}}>Select a stress scenario and compare against your base case using the same simulation engine.</p>
    <div className="scenario-presets">
      {presets.map(p=><button key={p.id} className={`scenario-preset ${selected===p.id?'selected':''}`} onClick={()=>setSelected(p.id)}>
        <strong>{p.label}</strong><small>{p.desc}</small>
      </button>)}
    </div>
    {selected==='custom'&&<div className="custom-scenario-inputs">
      <label>Return adjustment <small style={{color:'#8ea4af',fontWeight:400}}>({customAdj>0?'+':''}{customAdj} pp)</small>
        <input type="range" min="-30" max="10" value={customAdj} onChange={e=>setCustomAdj(Number(e.target.value))}/>
      </label>
      <label>Volatility multiplier <small style={{color:'#8ea4af',fontWeight:400}}>({customVol}×)</small>
        <input type="range" min="0.5" max="4" step="0.1" value={customVol} onChange={e=>setCustomVol(Number(e.target.value))}/>
      </label>
    </div>}
    {err&&<div className="error-box">{err}</div>}
    <button className="btn primary full" onClick={run} disabled={busy} style={{marginTop:14}}>{busy?'Running stress test…':'Run stress test'} <Zap size={17}/></button>
    {data&&<div style={{marginTop:20}}>
      <div className="scenario-vs-header"><div><span className="pill">BASE CASE</span></div><div className="vs-label">vs.</div><div><span className="pill stress">{data.scenarioLabel}</span></div></div>
      <div className="scenario-table">
        <div className="scenario-metric-row header"><span>Metric</span><span>Base case</span><span>Stress scenario</span></div>
        <MetricCell label="Probability of loss" base={data.base.probabilityOfLoss} stress={data.stress.probabilityOfLoss} pct/>
        <MetricCell label="Median outcome" base={data.base.medianOutcome} stress={data.stress.medianOutcome}/>
        <MetricCell label="5th percentile" base={data.base.percentile5} stress={data.stress.percentile5}/>
        <MetricCell label="95th percentile" base={data.base.percentile95} stress={data.stress.percentile95}/>
        <MetricCell label="Max drawdown" base={data.base.maxDrawdown} stress={data.stress.maxDrawdown} pct/>
        <MetricCell label="Probability of profit" base={data.base.probabilityOfProfit} stress={data.stress.probabilityOfProfit} pct/>
      </div>
      <p className="legal" style={{marginTop:14}}>Source: {data.source}. {data.disclaimer}</p>
    </div>}
  </div>;
}

// ── Feature 2: Portfolio Comparison ─────────────────────────────────
function ComparePanel({form,fmt}){
  const [data,setData]=useState(null);
  const [busy,setBusy]=useState(false);
  const [err,setErr]=useState('');

  const run=async()=>{
    setBusy(true);setErr('');
    try{
      const res=await api('/simulations/compare',{method:'POST',body:JSON.stringify({
        initialInvestment:Number(form.initialInvestment),
        monthlyInvestment:Number(form.monthlyInvestment)||0,
        durationYears:Number(form.durationYears),
        leverage:Number(form.leverage)||2,
      })});
      setData(res);
    }catch(e){setErr(e.message)}finally{setBusy(false)}
  };

  const strategies=[
    {key:'sip',label:'SIP',color:'var(--green)'},
    {key:'fno',label:'F&O',color:'var(--red)'},
    {key:'mixed',label:'Mixed',color:'var(--blue)'},
  ];

  const bestWorst=(vals,higherIsBetter)=>{
    const sorted=[...vals].sort((a,b)=>a-b);
    return {best:higherIsBetter?sorted[sorted.length-1]:sorted[0], worst:higherIsBetter?sorted[0]:sorted[sorted.length-1]};
  };

  const CompRow=({label,field,pct,higherIsBetter=false})=>{
    if(!data) return null;
    const vals=strategies.map(s=>data[s.key][field]);
    const bw=bestWorst(vals,higherIsBetter);
    return <div className="compare-row">
      <span className="compare-label">{label}</span>
      {strategies.map((s,i)=>{
        const v=vals[i];
        const isBest=v===bw.best;
        const isWorst=v===bw.worst;
        return <span key={s.key} style={{color:isBest?'var(--green)':isWorst?'var(--red)':'inherit',fontWeight:isBest||isWorst?700:400}}>
          {pct?`${v}%`:fmt(v)}
        </span>;
      })}
    </div>;
  };

  return <div>
    <h3 style={{margin:'0 0 6px'}}>Which strategy exposes you to more downside?</h3>
    <p style={{color:'#8ea4af',fontSize:13,margin:'0 0 16px'}}>Run all three strategies with your current inputs and compare the risk profiles side by side.</p>
    {err&&<div className="error-box">{err}</div>}
    <button className="btn primary full" onClick={run} disabled={busy}>{busy?'Comparing strategies…':'Compare all strategies'} <BarChart3 size={17}/></button>
    {data&&<div style={{marginTop:20}}>
      {data.leverage&&<p style={{color:'#8ea4af',fontSize:11,marginBottom:12}}>F&O simulated at {data.leverage}× leverage. SIP and Mixed include monthly contributions.</p>}
      <div className="compare-table">
        <div className="compare-row header">
          <span className="compare-label">Metric</span>
          {strategies.map(s=><span key={s.key} style={{color:s.color,fontWeight:800}}>{s.label}</span>)}
        </div>
        <CompRow label="Loss probability" field="probabilityOfLoss" pct/>
        <CompRow label="Median outcome" field="medianOutcome" higherIsBetter/>
        <CompRow label="5th percentile" field="percentile5" higherIsBetter/>
        <CompRow label="95th percentile" field="percentile95" higherIsBetter/>
        <CompRow label="Max drawdown" field="maxDrawdown" pct/>
        <CompRow label="Profit probability" field="probabilityOfProfit" pct higherIsBetter/>
      </div>
      <div className="insight" style={{marginTop:14}}><AlertTriangle size={17}/><div><b>How to read this</b><p>Green highlights the best value for each metric; red highlights the worst. Lower loss probability and drawdown are better. Higher median outcome and profit probability are better.</p></div></div>
      <p className="legal" style={{marginTop:14}}>Source: {data.source}. {data.disclaimer}</p>
    </div>}
  </div>;
}

// ── Feature 3: Risk Breakdown ───────────────────────────────────────
function RiskBreakdown({result,strategy,fmt}){
  const downsideRatio = result.totalInvested > 0 ? Math.max(0, ((result.totalInvested - result.percentile5) / result.totalInvested) * 100) : 0;
  const upsidePotential = result.totalInvested > 0 ? Math.max(0, ((result.percentile95 - result.totalInvested) / result.totalInvested) * 100) : 0;

  const factors=[
    {label:'Loss probability',value:result.probabilityOfLoss,max:100,unit:'%',color:result.probabilityOfLoss>40?'var(--red)':result.probabilityOfLoss>20?'#ffcb70':'var(--green)'},
    {label:'Max drawdown',value:parseFloat(result.maxDrawdown),max:100,unit:'%',color:parseFloat(result.maxDrawdown)>50?'var(--red)':parseFloat(result.maxDrawdown)>30?'#ffcb70':'var(--green)'},
    {label:'Downside risk (5th pctile vs invested)',value:Math.min(downsideRatio,100),max:100,unit:'%',color:downsideRatio>40?'var(--red)':downsideRatio>20?'#ffcb70':'var(--green)'},
    {label:'Upside potential (95th pctile vs invested)',value:Math.min(upsidePotential,200),max:200,unit:'%',color:'var(--green)'},
  ];

  return <div className="risk-breakdown">
    <div className="chart-head" style={{marginBottom:12}}><div><b>Risk breakdown</b><small>Visual decomposition of your simulated risk factors</small></div></div>
    {factors.map(f=><div key={f.label} className="rb-row">
      <span className="rb-label">{f.label}</span>
      <div className="rb-bar-track"><div className="rb-bar-fill" style={{width:`${Math.min(100,(f.value/f.max)*100)}%`,background:f.color}}/></div>
      <span className="rb-value" style={{color:f.color}}>{f.value.toFixed(1)}{f.unit}</span>
    </div>)}
  </div>;
}

// ── Feature 3b: Explain My Risk ─────────────────────────────────────
function ExplainMyRisk({result,strategy,fmt}){
  const [open,setOpen]=useState(false);

  const buildExplanation=()=>{
    const lines=[];
    // Loss probability
    if(result.probabilityOfLoss>40) lines.push(`Your simulated probability of loss is ${result.probabilityOfLoss}%, which is elevated. In more than 4 out of 10 simulated scenarios, your portfolio ended below your total invested amount of ${fmt(result.totalInvested)}.`);
    else if(result.probabilityOfLoss>20) lines.push(`Your simulated probability of loss is ${result.probabilityOfLoss}%. While not extreme, roughly 1 in ${Math.round(100/result.probabilityOfLoss)} scenarios ended below your invested amount of ${fmt(result.totalInvested)}.`);
    else lines.push(`Your simulated probability of loss is ${result.probabilityOfLoss}%, which is relatively contained. Most simulated paths ended above your invested amount of ${fmt(result.totalInvested)}.`);

    // Drawdown
    const dd=parseFloat(result.maxDrawdown);
    if(dd>50) lines.push(`Maximum drawdown reached ${dd}% — meaning in the worst simulated path, your portfolio fell by more than half from its peak before recovering. This level of drawdown can be psychologically and financially difficult to endure.`);
    else if(dd>30) lines.push(`Maximum drawdown of ${dd}% indicates meaningful peak-to-trough decline in the worst simulated path. Consider whether you could stay invested through a ${dd}% drop.`);
    else lines.push(`Maximum drawdown of ${dd}% suggests relatively contained peak-to-trough swings in the simulated paths.`);

    // Percentile range
    lines.push(`Your simulated outcome range spans from ${fmt(result.percentile5)} (5th percentile) to ${fmt(result.percentile95)} (95th percentile), with a median of ${fmt(result.medianOutcome)}. This spread shows how wide the range of possible outcomes is.`);

    // Strategy-specific
    if(strategy==='fno') lines.push(`Leverage amplifies both gains and losses. The F&O strategy's wider outcome range and potentially higher drawdown reflect the effect of leveraged exposure on your capital.`);
    else if(strategy==='mixed') lines.push(`The mixed strategy blends systematic investing with a higher-risk allocation. This gives it a wider outcome range than a pure SIP but typically narrower than full F&O leverage.`);
    else lines.push(`The SIP strategy spreads your entry points over time, which can moderate timing risk. However, it does not eliminate market risk — the outcome range still reflects the underlying market variability.`);

    return lines;
  };

  return <div className="explain-card">
    <button className={`btn ${open?'primary':'ghost'} full`} onClick={()=>setOpen(!open)} style={{marginTop:14}}>
      {open?'Hide explanation':'Explain my risk'} <Sparkles size={16}/>
    </button>
    {open&&<div className="explain-body">
      <div className="eyebrow" style={{marginBottom:10}}>RISK EXPLANATION — BASED ON YOUR SIMULATION RESULTS</div>
      {buildExplanation().map((line,i)=><p key={i} style={{color:'#c4dce5',fontSize:13,lineHeight:1.75,margin:'0 0 12px'}}>{line}</p>)}
      <p style={{color:'#6f8591',fontSize:10,margin:'12px 0 0'}}>This explanation is generated deterministically from your simulation metrics — it is not AI-generated advice.</p>
    </div>}
  </div>;
}

const FALLBACK_LESSONS=[
  {id:'risk',title:{en:'Risk is not the same as return',ta:'ஆபத்து என்பது வருமானம் மட்டும் அல்ல'},body:{en:'A higher expected return can come with a wider range of outcomes. Look at downside as well as upside.',ta:'அதிக வருமான வாய்ப்புடன் அதிகமான முடிவு மாறுபாடும் இருக்கலாம். மேல்நோக்கி மட்டுமல்ல, கீழ்நோக்கிய ஆபத்தையும் பாருங்கள்.'}},
  {id:'monte',title:{en:'What Monte Carlo means',ta:'Monte Carlo என்றால் என்ன?'},body:{en:'Instead of one forecast, the model generates thousands of possible scenarios so you can see a range of outcomes.',ta:'ஒரே கணிப்புக்கு பதிலாக, ஆயிரக்கணக்கான சாத்தியமான நிலைகளை உருவாக்கி முடிவுகளின் வரம்பைக் காட்டுகிறது.'}},
  {id:'leverage',title:{en:'Leverage magnifies outcomes',ta:'Leverage முடிவுகளை பெரிதாக்கும்'},body:{en:'With leverage, the same market move can create a much larger gain or loss relative to your capital.',ta:'Leverage பயன்படுத்தும்போது, உங்கள் முதலீட்டு மூலதனத்துடன் ஒப்பிடும்போது அதே சந்தை மாற்றம் பெரிய லாபம் அல்லது இழப்பை உருவாக்கலாம்.'}},
  {id:'drawdown',title:{en:'Drawdown matters',ta:'Drawdown முக்கியம்'},body:{en:'Drawdown measures how far a portfolio can fall from a previous high. It helps make downside easier to understand.',ta:'முன்னைய உயரத்திலிருந்து முதலீடு எவ்வளவு குறையலாம் என்பதை Drawdown காட்டுகிறது.'}},
  {id:'sip',title:{en:'SIP vs a one-time investment',ta:'SIP மற்றும் ஒருமுறை முதலீடு'},body:{en:'Regular investing changes the cash-flow pattern and can spread entry points across time. It does not remove market risk.',ta:'தொடர்ச்சியான முதலீடு காலப்போக்கில் முதலீட்டு நுழைவு புள்ளிகளைப் பரப்பலாம்; ஆனால் சந்தை ஆபத்தை நீக்காது.'}}
];
function Learn(){const [lessons,setLessons]=useState(FALLBACK_LESSONS);const [lang,setLang]=useState('en');useEffect(()=>{api('/learning').then(d=>{if(Array.isArray(d.lessons)&&d.lessons.length)setLessons(d.lessons)}).catch(()=>{})},[]);return <div className="page container"><div className="page-head"><div><div className="eyebrow">LEARN WHEN IT MATTERS</div><h1>Money concepts, without the jargon.</h1><p>Short lessons designed to sit beside the simulation instead of replacing it.</p></div><div className="lang-toggle"><button className={lang==='en'?'active':''} onClick={()=>setLang('en')}>English</button><button className={lang==='ta'?'active':''} onClick={()=>setLang('ta')}>தமிழ்</button></div></div><div className="lesson-grid">{lessons.map((l,i)=><article className="lesson-card" key={l.id}><span>{String(i+1).padStart(2,'0')}</span><h2>{l.title[lang]}</h2><p>{l.body[lang]}</p><NavLink to="/simulator" className="text-link">Apply in simulator →</NavLink></article>)}</div></div>}

function HistoryPage(){const [items,setItems]=useState([]);useEffect(()=>{api('/simulations/history').then(d=>setItems(d.simulations)).catch(()=>{})},[]);const fmt=n=>`₹${Number(n).toLocaleString('en-IN')}`;return <div className="page container"><div className="page-head"><div><div className="eyebrow">YOUR SCENARIOS</div><h1>Simulation history</h1><p>Saved risk reports from your account.</p></div><NavLink to="/simulator" className="btn primary">New simulation</NavLink></div><div className="history-list">{items.length===0?<div className="panel empty-history"><History/><h2>No simulations yet</h2><p>Run your first scenario and the report will be saved here.</p></div>:items.map(x=><div className="history-row" key={x._id}><div><span className="pill">{x.strategy.toUpperCase()}</span><b>{fmt(x.initialInvestment)}</b><small>{x.durationYears} years · {new Date(x.createdAt).toLocaleDateString('en-IN')}</small></div><div><small>Loss probability</small><strong>{x.probabilityOfLoss}%</strong></div><div><small>Median</small><strong>{fmt(x.medianOutcome)}</strong></div><div><small>Drawdown</small><strong>{x.maxDrawdown}%</strong></div></div>)}</div></div>}

function App(){return <AuthProvider><Routes><Route path="/" element={<Landing/>}/><Route path="/login" element={<AuthPage mode="login"/>}/><Route path="/signup" element={<AuthPage mode="signup"/>}/><Route element={<AppShell/>}><Route path="/dashboard" element={<Protected><Dashboard/></Protected>}/><Route path="/simulator" element={<Protected><Simulator/></Protected>}/><Route path="/learn" element={<Protected><Learn/></Protected>}/><Route path="/history" element={<Protected><HistoryPage/></Protected>}/></Route><Route path="*" element={<Navigate to="/" replace/>}/></Routes></AuthProvider>}

createRoot(document.getElementById('root')).render(<BrowserRouter><App/></BrowserRouter>);
