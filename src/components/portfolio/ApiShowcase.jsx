import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Code2, Github, Cloud, Activity, Globe, RefreshCw, Zap, 
  Satellite, UserSearch, MessageSquare, Dog, MapPin, Database
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

// ==============================================
// 1. ISS SATELLITE TRACKER (WhereTheISS.at)
// ==============================================
function IssTracker() {
  const [coords, setCoords] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchIss = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://api.wheretheiss.at/v1/satellites/25544');
      const data = await res.json();
      setCoords(data);
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchIss();
    const interval = setInterval(fetchIss, 5000); // Live poll every 5s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-slate-200 font-semibold flex items-center gap-2">
          <Satellite className="w-5 h-5 text-cyan-400" /> Orbital Telemetry
        </h4>
        <div className="flex gap-2">
           <Badge variant="outline" className="text-xs border-cyan-500/30 text-cyan-400 animate-pulse">LIVE</Badge>
        </div>
      </div>
      
      <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700 flex-1 flex flex-col justify-center relative overflow-hidden group">
        {/* Decorative Grid Background */}
        <div className="absolute inset-0 opacity-10" 
             style={{backgroundImage: 'linear-gradient(#0ea5e9 1px, transparent 1px), linear-gradient(90deg, #0ea5e9 1px, transparent 1px)', backgroundSize: '20px 20px'}}>
        </div>

        {coords ? (
          <div className="relative z-10 space-y-3 font-mono text-sm">
            <div className="flex justify-between border-b border-slate-700 pb-2">
              <span className="text-slate-500">Target</span>
              <span className="text-cyan-400 font-bold">ISS (ZARYA)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Latitude</span>
              <span className="text-slate-200">{coords.latitude.toFixed(4)}°</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Longitude</span>
              <span className="text-slate-200">{coords.longitude.toFixed(4)}°</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Velocity</span>
              <span className="text-orange-400">{(coords.velocity).toFixed(0)} km/h</span>
            </div>
          </div>
        ) : <div className="text-slate-500 text-center">Acquiring Signal...</div>}
      </div>
    </div>
  );
}

// ==============================================
// 2. IDENTITY ORACLE (Agify + Genderize)
// ==============================================
function IdentityOracle() {
  const [name, setName] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const predict = async () => {
    if(!name) return;
    setLoading(true);
    try {
      const [ageRes, genRes] = await Promise.all([
        fetch(`https://api.agify.io?name=${name}`),
        fetch(`https://api.genderize.io?name=${name}`)
      ]);
      const age = await ageRes.json();
      const gen = await genRes.json();
      setData({ age: age.age, gender: gen.gender, prob: gen.probability });
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col h-full">
      <h4 className="text-slate-200 font-semibold flex items-center gap-2 mb-4">
        <UserSearch className="w-5 h-5 text-purple-400" /> Identity Oracle
      </h4>
      <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700 flex-1">
        <div className="flex gap-2 mb-4">
          <Input 
            placeholder="Type a name..." 
            value={name} 
            onChange={e => setName(e.target.value)}
            className="bg-slate-950 border-slate-700 h-8 text-xs"
          />
          <Button size="sm" onClick={predict} disabled={loading} className="h-8 bg-purple-600 hover:bg-purple-700">
            {loading ? '...' : 'Scan'}
          </Button>
        </div>
        {data ? (
          <div className="space-y-2 text-center">
            <div className="inline-block p-3 rounded-full bg-slate-800 mb-1">
              <span className="text-2xl">{data.gender === 'male' ? '👨' : data.gender === 'female' ? '👩' : '🤖'}</span>
            </div>
            <div className="text-sm">
              <p className="text-slate-400">Est. Age: <span className="text-white font-bold">{data.age || '?'}</span></p>
              <p className="text-slate-400">Gender: <span className="text-white font-bold capitalize">{data.gender || '?'}</span></p>
              <p className="text-xs text-slate-600 mt-1">Confidence: {(data.prob * 100).toFixed(0)}%</p>
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-500 text-center mt-8">
            AI probabilistic analysis of name data.
          </div>
        )}
      </div>
    </div>
  );
}

// ==============================================
// 3. K-9 UNIT (Dog CEO)
// ==============================================
function K9Unit() {
  const [dog, setDog] = useState(null);
  
  const fetchDog = () => {
    fetch('https://dog.ceo/api/breeds/image/random')
      .then(res => res.json())
      .then(data => setDog(data.message));
  };
  useEffect(() => { fetchDog(); }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-slate-200 font-semibold flex items-center gap-2">
          <Dog className="w-5 h-5 text-yellow-400" /> K-9 Unit
        </h4>
        <Button variant="ghost" size="sm" onClick={fetchDog} className="h-6 w-6 p-0"><RefreshCw className="w-3 h-3 text-slate-400"/></Button>
      </div>
      <div className="bg-slate-900/50 rounded-lg border border-slate-700 flex-1 overflow-hidden relative group">
        {dog ? (
          <img src={dog} alt="Dog" className="w-full h-40 object-cover transition-transform duration-500 group-hover:scale-110" />
        ) : <div className="h-40 flex items-center justify-center text-slate-600">Deploying Unit...</div>}
        <div className="absolute bottom-0 inset-x-0 bg-black/60 p-1 text-center">
           <span className="text-[10px] text-yellow-400 font-mono">MORALE_BOOSTER_ACTIVE</span>
        </div>
      </div>
    </div>
  );
}

// ==============================================
// 4. TECH WISDOM (DummyJSON)
// ==============================================
function TechWisdom() {
  const [quote, setQuote] = useState(null);
  const fetchQuote = () => {
    fetch('https://dummyjson.com/quotes/random')
      .then(res => res.json())
      .then(data => setQuote({ content: data.quote, author: data.author }))
      .catch(() => setQuote({ content: "It works on my machine.", author: "Anonymous" }));
  };
  useEffect(() => { fetchQuote(); }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-slate-200 font-semibold flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-green-400" /> Tech Wisdom
        </h4>
        <Button variant="ghost" size="sm" onClick={fetchQuote} className="h-6 w-6 p-0"><RefreshCw className="w-3 h-3 text-slate-400"/></Button>
      </div>
      <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700 flex-1 flex flex-col justify-center">
        {quote ? (
          <>
            <p className="text-sm text-slate-300 italic mb-2">"{quote.content}"</p>
            <p className="text-xs text-green-400 font-mono">— {quote.author}</p>
          </>
        ) : <div className="text-slate-500 text-xs">Fetching logs...</div>}
      </div>
    </div>
  );
}

// ==============================================
// 5. EXISTING: GITHUB STATS
// ==============================================
function GitHubStats() {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch('https://api.github.com/users/aaks-hath').then(res => res.ok && res.json().then(setData));
  }, []);

  return (
    <div className="flex flex-col h-full">
      <h4 className="text-slate-200 font-semibold flex items-center gap-2 mb-4">
        <Github className="w-5 h-5 text-slate-100" /> GitHub Stats
      </h4>
      <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700 flex-1">
        {data ? (
          <div className="flex items-center gap-4">
            <img src={data.avatar_url} className="w-12 h-12 rounded-full border border-slate-500" />
            <div>
              <div className="text-lg font-bold text-white">{data.public_repos} <span className="text-xs text-slate-400 font-normal">Repos</span></div>
              <div className="text-xs text-slate-400">Followers: <span className="text-white">{data.followers}</span></div>
            </div>
          </div>
        ) : <div className="text-slate-500 text-sm">Loading...</div>}
      </div>
    </div>
  );
}

// ==============================================
// 6. EXISTING: CRYPTO
// ==============================================
function CryptoTicker() {
  const [price, setPrice] = useState(null);
  useEffect(() => {
    fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd')
      .then(r => r.json()).then(setPrice).catch(console.error);
  }, []);
  
  return (
    <div className="flex flex-col h-full">
      <h4 className="text-slate-200 font-semibold flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-orange-400" /> Crypto Market
      </h4>
      <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700 flex-1 space-y-2">
        {price ? (
          <>
            <div className="flex justify-between text-sm"><span className="text-slate-400">BTC</span><span className="text-green-400">${price.bitcoin.usd}</span></div>
            <div className="flex justify-between text-sm"><span className="text-slate-400">ETH</span><span className="text-cyan-400">${price.ethereum.usd}</span></div>
          </>
        ) : <div className="text-slate-500 text-xs">Loading...</div>}
      </div>
    </div>
  );
}

// ==============================================
// 7. EXISTING: WEATHER
// ==============================================
function WeatherWidget() {
  const [w, setW] = useState(null);
  useEffect(() => {
    fetch('https://api.open-meteo.com/v1/forecast?latitude=40.71&longitude=-74.00&current_weather=true')
      .then(r => r.json()).then(d => setW(d.current_weather));
  }, []);

  return (
    <div className="flex flex-col h-full">
      <h4 className="text-slate-200 font-semibold flex items-center gap-2 mb-4">
        <Cloud className="w-5 h-5 text-blue-400" /> Weather (NY)
      </h4>
      <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700 flex-1 text-center">
        {w ? (
          <>
            <div className="text-3xl font-bold text-white">{w.temperature}°C</div>
            <div className="text-xs text-blue-400 mt-1">Wind: {w.windspeed} km/h</div>
          </>
        ) : <div className="text-slate-500 text-xs">Loading...</div>}
      </div>
    </div>
  );
}

// ==============================================
// MAIN CONTAINER
// ==============================================

export default function ApiShowcase() {
  return (
    <section className="relative z-10 py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-mono font-bold mb-4">
            <span className="text-cyan-500">&lt;</span>
            <span className="text-slate-100">Live Data Feeds</span>
            <span className="text-cyan-500">/&gt;</span>
          </h2>
          <p className="text-slate-400">Real-time data streams powering this dashboard.</p>
        </motion.div>

        <Tabs defaultValue="grid" className="space-y-8">
          <TabsList className="bg-slate-800/50 border border-slate-700 p-1 mx-auto flex w-fit">
            <TabsTrigger value="grid" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
              <Zap className="w-4 h-4 mr-2" /> Live Grid
            </TabsTrigger>
            <TabsTrigger value="docs" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
              <Database className="w-4 h-4 mr-2" /> Sources
            </TabsTrigger>
          </TabsList>

          <TabsContent value="grid">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Row 1 */}
              <motion.div initial={{opacity:0}} whileInView={{opacity:1}} className="bg-slate-800/20 border border-slate-700/50 rounded-xl p-4 lg:col-span-2"><IssTracker /></motion.div>
              <motion.div initial={{opacity:0}} whileInView={{opacity:1}} transition={{delay:0.1}} className="bg-slate-800/20 border border-slate-700/50 rounded-xl p-4"><CryptoTicker /></motion.div>
              <motion.div initial={{opacity:0}} whileInView={{opacity:1}} transition={{delay:0.2}} className="bg-slate-800/20 border border-slate-700/50 rounded-xl p-4"><GitHubStats /></motion.div>
              
              {/* Row 2 */}
              <motion.div initial={{opacity:0}} whileInView={{opacity:1}} transition={{delay:0.3}} className="bg-slate-800/20 border border-slate-700/50 rounded-xl p-4"><WeatherWidget /></motion.div>
              <motion.div initial={{opacity:0}} whileInView={{opacity:1}} transition={{delay:0.4}} className="bg-slate-800/20 border border-slate-700/50 rounded-xl p-4"><IdentityOracle /></motion.div>
              <motion.div initial={{opacity:0}} whileInView={{opacity:1}} transition={{delay:0.5}} className="bg-slate-800/20 border border-slate-700/50 rounded-xl p-4"><K9Unit /></motion.div>
              <motion.div initial={{opacity:0}} whileInView={{opacity:1}} transition={{delay:0.6}} className="bg-slate-800/20 border border-slate-700/50 rounded-xl p-4"><TechWisdom /></motion.div>
            </div>
          </TabsContent>

          <TabsContent value="docs">
             <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-8 text-center text-slate-400">
                <p>All APIs are public and free. Rate limits may apply.</p>
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  <Badge variant="outline">wheretheiss.at</Badge>
                  <Badge variant="outline">coingecko.com</Badge>
                  <Badge variant="outline">open-meteo.com</Badge>
                  <Badge variant="outline">agify.io</Badge>
                  <Badge variant="outline">dog.ceo</Badge>
                  <Badge variant="outline">quotable.io</Badge>
                </div>
             </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}