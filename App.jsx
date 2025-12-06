import React, { useEffect, useState, useRef } from 'react';

const THEMES = ['Cozy Cottage', 'Ocean', 'Forest', 'Space', 'Fantasy', 'Rainy Night'];
const VIBES = ['Calming', 'Hopeful', 'Nostalgic', 'Magical', 'Neutral'];
const NARRATORS = ['Soft Female', 'Gentle Male', 'Whisper', 'Robotic Gentle'];

function randomFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function pseudoAiCompose({ theme, vibe, lengthMinutes }) {
  const baseSeeds = {
    'Cozy Cottage': [
      'A warm lantern lit the small kitchen as the wind hummed outside.',
      'You sank into the quilt, listening to the kettle’s soft lullaby.'
    ],
    'Ocean': [
      'Waves cradled the shore with a slow, ancient rhythm.',
      'The moon painted a silver path across the water.'
    ],
    'Forest': [
      'Leaves whispered secrets above as the path glowed faintly.',
      'Fireflies danced like the memory of tiny stars.'
    ],
    'Space': [
      'Stars drifted by like lanterns on a black sea.',
      'Your quiet craft hummed under a blanket of cosmic hush.'
    ],
    'Fantasy': [
      'A gentle dragon exhaled a breeze of warm cinnamon and lavender.',
      'Mossy stones hummed with old songs as you passed.'
    ],
    'Rainy Night': [
      'Rain stitched a steady rhythm on the windowpane, slow and sure.',
      'The streetlamps pooled gold on the wet pavement.'
    ]
  };

  const vibeLines = {
    'Calming': ['Breathe and let the world soften around you.', 'There is nowhere to hurry to.'],
    'Hopeful': ['Tomorrow holds a gentle surprise.', 'You are quietly stronger than you remember.'],
    'Nostalgic': ['Memory drifts like a warm photograph in your hand.', 'Familiar things glow with a distant light.'],
    'Magical': ['Little lights blinked into being at your steps, friendly and shy.', 'The air tasted of possibility.'],
    'Neutral': ['Time moved on, soft and steady.', 'All is ordinary in the tenderest ways.']
  };

  const seed = randomFrom(baseSeeds[theme] || baseSeeds['Cozy Cottage']);
  const parts = [seed];
  const sentencesPerMinute = 6;
  const totalSentences = Math.max(4, Math.floor(lengthMinutes * sentencesPerMinute));

  for (let i = 0; i < totalSentences; i++) {
    if (i % 4 === 0) parts.push(randomFrom(vibeLines[vibe] || vibeLines['Calming']));
    else parts.push('\u200B' + ' ' + ['A hush settled.', 'The path glowed.', 'You walked slowly.', 'Soft lights watched.'][i % 4]);
  }

  parts.push('Sleep flows in like a warm tide — tender and slow.');
  return parts.join(' ');
}

export default function App() {
  const [theme, setTheme] = useState(THEMES[0]);
  const [vibe, setVibe] = useState(VIBES[0]);
  const [lengthMinutes, setLengthMinutes] = useState(10);
  const [narrator, setNarrator] = useState(NARRATORS[0]);
  const [story, setStory] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [archive, setArchive] = useState(() => {
    try { return JSON.parse(localStorage.getItem('dw_archive') || '[]'); } catch { return []; }
  });
  const synthRef = useRef(window.speechSynthesis);
  const utterRef = useRef(null);
  const [timerMinutes, setTimerMinutes] = useState(0);

  useEffect(() => {
    return () => { if (synthRef.current && synthRef.current.speaking) synthRef.current.cancel(); };
  }, []);

  function saveArchive(entry) {
    const next = [entry, ...archive].slice(0, 50);
    setArchive(next);
    localStorage.setItem('dw_archive', JSON.stringify(next));
  }

  function handleGenerate() {
    const generated = pseudoAiCompose({ theme, vibe, lengthMinutes });
    setStory(generated);
  }

  function synthSpeak(text) {
    if (!('speechSynthesis' in window)) {
      alert('Your browser does not support the Web Speech API.');
      return;
    }
    if (synthRef.current.speaking) {
      synthRef.current.cancel();
      setIsPlaying(false);
      return;
    }
    const ut = new SpeechSynthesisUtterance(text);
    if (narrator === 'Whisper') { ut.rate = 0.85; ut.pitch = 0.8; }
    else if (narrator === 'Robotic Gentle') { ut.rate = 0.95; ut.pitch = 0.6; }
    else { ut.rate = 0.92; ut.pitch = 1.0; }

    ut.onend = () => { setIsPlaying(false); };
    utterRef.current = ut;
    synthRef.current.speak(ut);
    setIsPlaying(true);
    saveArchive({ id: Date.now(), theme, vibe, lengthMinutes, narrator, text });
  }

  function handlePlay() {
    if (!story) { handleGenerate(); setTimeout(() => synthSpeak(story || '...'), 250); return; }
    synthSpeak(story);
  }

  function handleStop() { if (synthRef.current.speaking) synthRef.current.cancel(); setIsPlaying(false); }
  function handleDeleteArchive(id) { const next = archive.filter(a => a.id !== id); setArchive(next); localStorage.setItem('dw_archive', JSON.stringify(next)); }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-3xl mx-auto bg-white/5 rounded-2xl p-6 shadow-xl" style={{background:'rgba(255,255,255,0.03)'}}>
        <header className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">DreamWeaver — Sleep Story Generator</h1>
          <div className="text-sm opacity-80">Prototype • Demo</div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-xs opacity-80">Theme</label>
            <select value={theme} onChange={e=>setTheme(e.target.value)} className="mt-1 p-2 rounded w-full" style={{background:'rgba(255,255,255,0.03)'}}>
              {THEMES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs opacity-80">Vibe</label>
            <select value={vibe} onChange={e=>setVibe(e.target.value)} className="mt-1 p-2 rounded w-full" style={{background:'rgba(255,255,255,0.03)'}}>
              {VIBES.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs opacity-80">Length (minutes)</label>
            <input type="range" min={5} max={30} step={1} value={lengthMinutes} onChange={e=>setLengthMinutes(Number(e.target.value))} />
            <div className="text-sm mt-1">{lengthMinutes} minutes</div>
          </div>
        </section>

        <section className="grid md:grid-cols-3 gap-4 items-end mb-6">
          <div>
            <label className="block text-xs opacity-80">Narrator</label>
            <select value={narrator} onChange={e=>setNarrator(e.target.value)} className="mt-1 p-2 rounded w-full" style={{background:'rgba(255,255,255,0.03)'}}>
              {NARRATORS.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs opacity-80">Smart Timer (minutes — 0 = until end)</label>
            <input type="number" min={0} max={120} value={timerMinutes} onChange={e=>setTimerMinutes(Number(e.target.value))} className="mt-1 p-2 rounded w-full" style={{background:'rgba(255,255,255,0.03)'}} />
          </div>

          <div className="flex gap-2">
            <button onClick={handleGenerate} className="px-4 py-2 rounded" style={{background:'#4f46e5'}}>Generate</button>
            <button onClick={isPlaying ? handleStop : handlePlay} className="px-4 py-2 rounded" style={{background:'#10b981'}}>{isPlaying ? 'Stop' : 'Play'}</button>
            <button onClick={()=>{ if(story) { saveArchive({ id: Date.now(), theme, vibe, lengthMinutes, narrator, text: story }); alert('Saved to archive'); } else alert('Generate first'); }} className="px-4 py-2 rounded" style={{background:'#334155'}}>Save</button>
          </div>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-medium mb-2">Preview</h2>
          <div className="bg-white/3 p-4 rounded h-40 overflow-auto" style={{background:'rgba(255,255,255,0.03)'}}>{story ? story : <em className="opacity-70">Your generated story will appear here. Click Generate to create one.</em>}</div>
        </section>

        <section>
          <h2 className="text-lg font-medium mb-2">Dream Archive</h2>
          <div className="grid gap-2">
            {archive.length === 0 && <div className="text-sm opacity-70">No saved stories yet.</div>}
            {archive.map(a => (
              <div key={a.id} className="p-3 bg-white/3 rounded flex justify-between items-start" style={{background:'rgba(255,255,255,0.03)'}}>
                <div>
                  <div className="text-sm font-semibold">{a.theme} • {a.vibe} • {a.lengthMinutes}m</div>
                  <div className="text-xs opacity-70 mt-1 line-clamp-3" style={{maxWidth:600}}>{a.text.slice(0,200)}{a.text.length>200?'…':''}</div>
                </div>
                <div className="flex flex-col gap-2 ml-4">
                  <button onClick={()=>{ setStory(a.text); window.scrollTo({top:0, behavior:'smooth'}); }} className="px-3 py-1 rounded" style={{background:'#6366f1', color:'white'}}>Load</button>
                  <button onClick={()=>handleDeleteArchive(a.id)} className="px-3 py-1 rounded" style={{background:'#ef4444', color:'white'}}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <footer className="mt-6 text-xs opacity-70">This prototype uses a local template generator and the browser Web Speech API for TTS. For production connect to a server-side LLM + high-quality TTS and implement licensing and moderation.</footer>
      </div>
    </div>
  );
}
