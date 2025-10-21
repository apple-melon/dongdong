import React, { useEffect, useRef, useState } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref as dbRef, onValue, push, remove } from "firebase/database";

  const firebaseConfig = {
    apiKey: "AIzaSyC6x8m0LoJkNeLwKvcvysfQ6NcpXxrB1Q0",
    authDomain: "dongdong-ecb97.firebaseapp.com",
    projectId: "dongdong-ecb97",
    storageBucket: "dongdong-ecb97.firebasestorage.app",
    messagingSenderId: "61691589939",
    appId: "1:61691589939:web:259c26d4212dcd19c37a46",
    measurementId: "G-4JXZ87K2P5"
  };


export default function DongdongHarasser() {
  const [entries, setEntries] = useState([]);
  const [name, setName] = useState("");
  const [determination, setDetermination] = useState("");
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const drawing = useRef(false);
  const lastPoint = useRef({ x: 0, y: 0 });
  const [isFirebaseEnabled, setIsFirebaseEnabled] = useState(false);
  const firebaseRefs = useRef(null);
  const [adText, setAdText] = useState("");
  const STORAGE_KEY = "dongdong_signature_entries_v1";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 3;
    ctxRef.current = ctx;
    clearCanvas();
    ctx.strokeStyle = "#e6e6e6";
  }, []);

  useEffect(() => {
    const ads = [
      '동동이 굴욕 할인 - 지금 서명하면 1+1!',
      '선착순 100명에게 동동이 갈굼 인증서 증정!',
      '한정판: 동동이 모래인형 무료배포(가짜 광고)'
    ];
    setAdText(ads[Math.floor(Math.random() * ads.length)]);
  }, []);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        const normalized = parsed.map((item, idx) => ({
          id: item.id || `${Date.now()}-${idx}`,
          ...item,
        }));
        setEntries(normalized);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  useEffect(() => {
    if (!firebaseConfig) return;
    try {
      const app = initializeApp(firebaseConfig);
      const db = getDatabase(app);
      const listRef = dbRef(db, "signatures");
      firebaseRefs.current = { db, listRef };
      setIsFirebaseEnabled(true);
      const unsubscribe = onValue(listRef, (snapshot) => {
        const val = snapshot.val();
        if (!val) return setEntries([]);
        const arr = Object.entries(val).map(([id, data]) => ({ id, ...data }))
          .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
        setEntries(arr);
      });
      return () => unsubscribe && unsubscribe();
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, [entries]);

  function getPos(e) {
    const rect = canvasRef.current.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : null;
    const x = touch ? touch.clientX : e.clientX;
    const y = touch ? touch.clientY : e.clientY;
    return { x: x - rect.left, y: y - rect.top };
  }

  function start(e) {
    drawing.current = true;
    lastPoint.current = getPos(e);
  }
  function stop() {
    drawing.current = false;
  }
  function draw(e) {
    if (!drawing.current) return;
    e.preventDefault();
    const p = getPos(e);
    const ctx = ctxRef.current;
    ctx.strokeStyle = "#e6e6e6";
    ctx.beginPath();
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    lastPoint.current = p;
  }

  function clearCanvas() {
    const c = canvasRef.current;
    const ctx = ctxRef.current;
    if (!c || !ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.fillStyle = "#0b0b0d";
    ctx.fillRect(0, 0, c.width, c.height);
  }

  async function saveEntry() {
    const trimmed = name.trim();
    if (!trimmed) return alert("이름을 입력하세요.");
    if (entries.some((e) => e.name === trimmed)) return alert("이미 같은 이름이 있습니다.");

    const dataUrl = canvasRef.current.toDataURL("image/png");
    const newEntry = { name: trimmed, signature: dataUrl, createdAt: new Date().toISOString(), determination };

    try {
      if (isFirebaseEnabled && firebaseRefs.current) {
        await push(firebaseRefs.current.listRef, newEntry);
      } else {
        setEntries((p) => [{ id: Date.now().toString(), ...newEntry }, ...p]);
      }
    } catch (e) {
      console.error(e);
    }

    setName("");
    setDetermination("");
    clearCanvas();
  }

  async function removeEntry(target) {
    if (!target) return;

    try {
      if (isFirebaseEnabled && firebaseRefs.current) {
        const { db } = firebaseRefs.current;
        await remove(dbRef(db, `signatures/${target.id}`));
      }
      setEntries((prev) => prev.filter((e) => e.id !== target.id));
    } catch (e) {
      console.error(e);
    }
  }

  function formatTime(iso) {
    return new Date(iso).toLocaleString();
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-b from-[#050406] via-[#060609] to-[#0a0a0b] text-gray-200">
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-[#070708]/60 rounded-2xl p-6 border border-[#1a1a1a] shadow-2xl">
          <div className="mb-3 p-2 rounded bg-[#1b0b1b] text-sm text-[#ffd] border border-[#2a162a]">광고: {adText}</div>
          <h1 className="text-3xl font-bold mb-2">동동이 갈구기</h1>
          <p className="text-sm text-gray-400 mb-4">동동이는 여러 학급 분위기를 흐리고 있습니다. 여기에 서명하고 동동이를 갈구기 시작하세요!</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="이름을 입력하세요" className="md:col-span-2 p-3 rounded-lg bg-[#0b0b0c] border border-[#222]" />
            <div className="flex gap-2">
              <button onClick={saveEntry} className="px-4 py-2 rounded-lg bg-[#2b0f3b]">저장</button>
              <button onClick={clearCanvas} className="px-4 py-2 rounded-lg border border-[#2b2b2b]">지우기</button>
            </div>
          </div>

          <div className="mt-3">
            <input value={determination} onChange={(e) => setDetermination(e.target.value)} placeholder="각오를 적어주세요" className="w-full p-3 rounded-lg bg-[#0b0b0c] border border-[#222]" />
          </div>

          <div className="mt-4">
            <canvas ref={canvasRef} className="w-full h-60 border border-[#141414] rounded" onMouseDown={start} onMouseUp={stop} onMouseMove={draw} onMouseLeave={stop} onTouchStart={start} onTouchEnd={stop} onTouchMove={draw} />
          </div>
        </div>

        <aside className="bg-[#060607]/60 rounded-2xl p-4 border border-[#151516] shadow-inner">
          <h2 className="text-xl font-semibold mb-2">실시간 명단</h2>
          <div className="space-y-3 max-h-[60vh] overflow-auto pr-2">
            {entries.map((e) => (
              <div key={e.id} className="flex items-center gap-3 bg-[#060607]/40 p-2 rounded">
                <div className="flex-1">
                  <div className="font-medium">{e.name}</div>
                  {e.determination && <div className="text-xs text-gray-400 italic">“{e.determination}”</div>}
                  <div className="text-xs text-gray-500">{formatTime(e.createdAt)}</div>
                </div>
                <div className="w-24 h-12 bg-black rounded overflow-hidden border border-[#111]">
                  <img src={e.signature} alt="sig" className="w-full h-full object-cover" />
                </div>
                <button onClick={() => removeEntry(e)} className="px-2 py-1 text-xs bg-[#3a0b0b] rounded">삭제</button>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
