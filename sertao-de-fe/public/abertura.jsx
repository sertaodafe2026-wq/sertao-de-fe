// Sertão de Fé — abertura animada 2D (30 s). Tudo desenhado em SVG a partir de T.
// Usa o motor se estiver carregado; no site (sem o motor) cai nestes equivalentes mínimos.
const clamp = window.clamp || ((v, a, b) => Math.min(b, Math.max(a, v)));
const Easing = window.Easing || {
  linear: t => t,
  easeInOutSine: t => -(Math.cos(Math.PI * t) - 1) / 2,
  easeInCubic: t => t * t * t,
  easeOutCubic: t => 1 - Math.pow(1 - t, 3)
};
const interpolate = window.interpolate || ((inp, out, ease = Easing.linear) => t => {
  if (t <= inp[0]) return out[0];
  for (let i = 1; i < inp.length; i++) if (t <= inp[i]) return out[i - 1] + (out[i] - out[i - 1]) * ease((t - inp[i - 1]) / (inp[i] - inp[i - 1]));
  return out[out.length - 1];
});
const { useComposition, CompositionStage } = window;

const MOTION = { soft: Easing.easeInOutSine, push: Easing.easeInCubic, settle: Easing.easeOutCubic };
const C_ = { ivory: '#FAF7F0', ink: '#2B2620', blue: '#2F5B8A', gold: '#B08D4C', terra: '#B4633E', wood: '#7A4E34' };

const h2r = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => { const A = h2r(a), B = h2r(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
const colorAt = (T, stops) => {
  if (T <= stops[0][0]) return stops[0][1];
  for (let i = 1; i < stops.length; i++) if (T <= stops[i][0]) { const [t0, c0] = stops[i - 1], [t1, c1] = stops[i]; return mix(c0, c1, MOTION.soft((T - t0) / (t1 - t0))); }
  return stops[stops.length - 1][1];
};
const rnd = (s => () => (s = (s * 16807) % 2147483647) / 2147483647)(7);
const ridgeY = (x, base, w) => base - w.reduce((a, [amp, f, ph]) => a + amp * Math.sin(x * f + ph), 0);
const ridge = (x0, x1, base, w, bottom = 1100) => { let d = `M${x0} ${bottom} L${x0} ${ridgeY(x0, base, w).toFixed(1)}`; for (let x = x0 + 24; x <= x1; x += 24) d += ` L${x} ${ridgeY(x, base, w).toFixed(1)}`; return d + ` L${x1} ${bottom} Z`; };

const FAR_W = [[55, 0.0021, 1], [28, 0.0062, 2], [10, 0.017, 0.5]];
const MID_W = [[60, 0.0017, 3], [22, 0.0052, 1]];
const NEAR_W = [[40, 0.0024, 5], [14, 0.008, 2]];
const FAR = ridge(-300, 3600, 650, FAR_W);
const MID = ridge(-300, 3600, 770, MID_W);
const NEAR = ridge(-300, 3800, 870, NEAR_W);
const GROUND = ridge(-300, 4400, 950, [[10, 0.004, 1]]);
const STARS = Array.from({ length: 70 }, () => ({ x: rnd() * 1920, y: rnd() * 560, r: 1 + rnd() * 2.2, off: 0.8 + rnd() * 2.8, tw: 1 + rnd() * 3, ph: rnd() * 6 }));
const HILL_CHAPELS = [520, 900, 1410, 1750, 2080].map((x, i) => ({ x, y: ridgeY(x, 770, MID_W), on: 5.5 + i * 0.8 }));
const CACTI = [[260, 1.1], [1180, 0.8], [1900, 1.25], [2650, 0.95], [3300, 1.15]];
const DUST = Array.from({ length: 46 }, () => ({ x: rnd(), y: rnd(), s: 1.5 + rnd() * 2.5, sp: 0.2 + rnd() * 0.5, ph: rnd() * 6 }));

const Svg = ({ children, style }) => (
  <svg viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', ...style }}>{children}</svg>
);
const camera = (fx, fy, z) => `translate(${fx} ${fy}) scale(${z}) translate(${-fx} ${-fy})`;

function Cactus({ x, y, s, color }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill={color}>
      <rect x="-14" y="-170" width="28" height="175" rx="14" />
      <rect x="-56" y="-110" width="24" height="70" rx="12" />
      <rect x="-56" y="-62" width="56" height="22" rx="11" />
      <rect x="34" y="-140" width="22" height="80" rx="11" />
      <rect x="0" y="-80" width="56" height="20" rx="10" />
    </g>
  );
}
function HillChapel({ x, y, glow, body }) {
  return (
    <g transform={`translate(${x} ${y - 4})`}>
      <circle cx="0" cy="-14" r="46" fill="url(#chGlow)" opacity={glow} />
      <rect x="-14" y="-22" width="28" height="22" fill={body} />
      <path d="M-17 -22 L0 -36 L17 -22 Z" fill={body} />
      <path d="M0 -36 V-48 M-4 -43 H4" stroke={body} strokeWidth="2" />
      <rect x="-4" y="-12" width="8" height="12" fill={mix('#C9A25A', '#F6C66E', glow)} />
    </g>
  );
}

// Cena 1–2 e início da 3: paisagem contínua (estrelas → nascer do sol → parallax → zoom na capela)
function Landscape({ T, C }) {
  const vis = T < C.Cores + 1.2;
  const p = MOTION.soft(clamp((T - C.Serra) / (C.Cores - C.Serra), 0, 1));
  const top = colorAt(T, [[0, '#121D35'], [1.4, '#1A2A4A'], [2.8, '#3B4C7A'], [3.9, '#8C8DB4'], [5, '#A7BFD8'], [9, '#A9C4DC']]);
  const hor = colorAt(T, [[0, '#24365A'], [1.4, '#3A4470'], [2.8, '#C98FA0'], [3.9, '#F1B892'], [5, '#F4D29A'], [9, '#F3E3C3']]);
  const far = colorAt(T, [[0, '#17233B'], [2.8, '#40507A'], [5, '#8B9BBC'], [9, '#9DB0C9']]);
  const mid = colorAt(T, [[0, '#1A283F'], [2.8, '#3B5060'], [5, '#6E9078'], [9, '#7FA27F']]);
  const near = colorAt(T, [[0, '#182432'], [2.8, '#34503F'], [5, '#5E8466'], [9, '#668D6C']]);
  const ground = colorAt(T, [[0, '#24252F'], [2.8, '#6A5550'], [5, '#C9996C'], [9, '#D8A877']]);
  const road = colorAt(T, [[0, '#36363F'], [5, '#E3C08F'], [9, '#ECCD9E']]);
  const cactus = colorAt(T, [[0, '#1B2A27'], [5, '#4E7A5C']]);
  const chBody = colorAt(T, [[0, '#8C97AB'], [5, '#FFFFFF']]);
  const sunY = interpolate([1.2, 5, 10], [820, 560, 470], MOTION.soft)(T);
  const sunGlow = clamp((T - 1.6) / 2, 0, 1);
  // zoom into chapel #3 at start of Cores
  const tgt = HILL_CHAPELS[2], midDx = -450 * p;
  const fx = tgt.x + midDx, fy = tgt.y - 16;
  const z = interpolate([C.Cores, C.Cores + 1.05], [1, 7], MOTION.push)(T);
  return (
    <Svg style={{ visibility: vis ? 'visible' : 'hidden' }}>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={top} /><stop offset="0.75" stopColor={hor} /></linearGradient>
        <radialGradient id="sunG"><stop offset="0" stopColor="#FFE6A8" stopOpacity="0.95" /><stop offset="1" stopColor="#FFE6A8" stopOpacity="0" /></radialGradient>
        <radialGradient id="chGlow"><stop offset="0" stopColor="#FFD98A" stopOpacity="0.9" /><stop offset="1" stopColor="#FFD98A" stopOpacity="0" /></radialGradient>
      </defs>
      <g transform={camera(fx, fy, z)}>
        <rect x="-200" y="-200" width="2320" height="1480" fill="url(#sky)" />
        {STARS.map((s, i) => {
          const o = clamp(1 - (T - s.off) / 0.6, 0, 1) * (0.6 + 0.4 * Math.sin(T * s.tw + s.ph));
          return o > 0 ? <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#FFF6DC" opacity={o} /> : null;
        })}
        <circle cx={1080 - 180 * p} cy={sunY} r={260} fill="url(#sunG)" opacity={sunGlow} />
        <circle cx={1080 - 180 * p} cy={sunY} r={58} fill="#FBD98C" />
        <g transform={`translate(${-180 * p} 0)`}><path d={FAR} fill={far} /></g>
        <g transform={`translate(${midDx} 0)`}>
          <path d={MID} fill={mid} />
          {HILL_CHAPELS.map((c, i) => <HillChapel key={i} x={c.x} y={c.y} body={chBody} glow={MOTION.settle(clamp((T - c.on) / 0.9, 0, 1))} />)}
        </g>
        <g transform={`translate(${-680 * p} 0)`}><path d={NEAR} fill={near} /></g>
        <g transform={`translate(${-950 * p} 0)`}>
          <path d={GROUND} fill={ground} />
          <path d="M120 1100 C 520 1030, 380 990, 900 968 S 1700 948, 2200 940 S 3200 930, 3900 935" fill="none" stroke={road} strokeWidth="54" strokeLinecap="round" />
        </g>
        <g transform={`translate(${-1300 * p} 0)`}>{CACTI.map(([x, s], i) => <Cactus key={i} x={x} y={1040} s={s} color={cactus} />)}</g>
      </g>
    </Svg>
  );
}

// ---------- Fachadas ----------
const FACADES = [
  { body: '#E8B94A', trim: '#FAF7F0', top: 'torre', detail: 'bell' },
  { body: '#6FA77A', trim: '#FAF7F0', top: 'frontao', detail: 'flags' },
  { body: '#4F7FB4', trim: '#FAF7F0', top: 'curvo', detail: 'bird', chalice: true },
  { body: '#FAF7F0', trim: '#B8473A', top: 'frontao', detail: 'pennant', outline: true },
  { body: '#6CC1B8', trim: '#FAF7F0', top: 'degraus', detail: 'bird' },
  { body: '#EFE2C2', trim: '#FFFFFF', top: 'sineira', detail: 'bell', leaves: true }
];
const X0 = 730, W = 460, Y0 = 570, GY = 900;

function Bell({ cx, cy, a }) {
  return (<g transform={`rotate(${a} ${cx} ${cy})`}><path d={`M${cx} ${cy} v8 M${cx - 16} ${cy + 40} Q${cx - 16} ${cy + 8} ${cx} ${cy + 8} Q${cx + 16} ${cy + 8} ${cx + 16} ${cy + 40} Z`} fill={C_.gold} stroke={C_.gold} strokeWidth="3" /><circle cx={cx} cy={cy + 43} r="4" fill="#8C6B30" /></g>);
}
function Cross({ x, y, color, s = 1 }) {
  return <path d={`M${x} ${y} v${-60 * s} M${x - 18 * s} ${y - 42 * s} h${36 * s}`} stroke={color} strokeWidth={7 * s} strokeLinecap="round" />;
}
function Bird({ x, y, flap, color = '#2B2620', s = 1 }) {
  const w = 10 + 12 * flap;
  return (<g transform={`translate(${x} ${y}) scale(${s})`} fill={color}><ellipse cx="0" cy="0" rx="13" ry="7" /><circle cx="11" cy="-5" r="5" /><path d={`M-4 -3 L-14 ${-w} L4 -4 Z`} /></g>);
}

function Facade({ f, t, open = 0, T }) {
  const st = f.outline ? f.trim : 'none', sw = f.outline ? 9 : 0;
  const shade = mix(f.body, '#000000', 0.12);
  const topY = { torre: 300, frontao: 440, curvo: 420, degraus: 450, sineira: 360 }[f.top];
  const swing = 16 * Math.sin(t * Math.PI * 2 * 1.4);
  let top = null;
  if (f.top === 'torre') top = (<g>
    <path d={`M${X0 - 10} ${Y0} L960 ${Y0 - 70} L${X0 + W + 10} ${Y0} Z`} fill={shade} />
    <rect x="895" y="350" width="130" height="225" fill={f.body} />
    <path d="M885 350 L960 300 L1035 350 Z" fill={C_.terra} />
    <path d="M930 452 V400 A30 30 0 0 1 990 400 V452 Z" fill="#3A2A22" />
    <Bell cx={960} cy={395} a={f.detail === 'bell' ? swing : 0} />
    <rect x="885" y="465" width="150" height="12" fill={f.trim} />
  </g>);
  if (f.top === 'frontao') top = <path d={`M${X0 - 14} ${Y0 + 4} L960 ${topY} L${X0 + W + 14} ${Y0 + 4} Z`} fill={f.body} stroke={st} strokeWidth={sw} strokeLinejoin="round" />;
  if (f.top === 'curvo') top = <path d={`M${X0} ${Y0} Q 790 520 860 505 Q 890 440 960 ${topY} Q 1030 440 1060 505 Q 1130 520 ${X0 + W} ${Y0} Z`} fill={f.body} />;
  if (f.top === 'degraus') top = <path d={`M${X0} ${Y0} V540 H790 V510 H850 V480 H905 V${topY} H1015 V480 H1070 V510 H1130 V540 H${X0 + W} V${Y0} Z`} fill={f.body} />;
  if (f.top === 'sineira') top = (<g>
    <path d={`M${X0 - 12} ${Y0 + 4} L960 490 L${X0 + W + 12} ${Y0 + 4} Z`} fill={f.body} stroke={mix(f.body, '#000000', 0.08)} strokeWidth="4" />
    <path d="M900 520 V420 L960 380 L1020 420 V520 Z" fill={f.body} />
    <path d="M930 478 V432 A30 30 0 0 1 990 432 V478 Z" fill="#9FBFDA" />
    <Bell cx={960} cy={424} a={swing * 0.9} />
  </g>);
  const crossY = f.top === 'torre' ? 300 : f.top === 'sineira' ? 380 : topY;
  const crossColor = f.outline ? f.trim : f.top === 'torre' ? '#FAF7F0' : f.trim === '#FFFFFF' ? '#B08D4C' : '#FAF7F0';
  // details
  let det = null;
  if (f.detail === 'flags') {
    const flags = Array.from({ length: 13 }, (_, i) => { const x = 690 + i * 45, y = 488 + 16 * Math.sin((i / 12) * Math.PI); const a = 10 * Math.sin(t * 9 + i); const col = [C_.terra, '#E8B94A', C_.blue, '#FAF7F0'][i % 4]; return <path key={i} transform={`rotate(${a} ${x} ${y})`} d={`M${x - 15} ${y} L${x + 15} ${y} L${x} ${y + 30} Z`} fill={col} />; });
    det = <g><path d="M675 488 Q960 520 1245 488" fill="none" stroke="#5A4A3A" strokeWidth="2" />{flags}</g>;
  }
  if (f.detail === 'pennant') {
    const y = crossY - 60, wv = 10 * Math.sin(t * 10);
    det = <path d={`M963 ${y} Q 1000 ${y + 6 + wv} 1040 ${y + 14} Q 1000 ${y + 24 - wv} 963 ${y + 28} Z`} fill={C_.terra} />;
  }
  if (f.detail === 'bird') {
    const k = MOTION.settle(clamp(t / 0.62, 0, 1));
    const bx = 1500 + (982 - 1500) * k, by = 180 + (crossY - 70 - 180) * k - 60 * Math.sin(k * Math.PI);
    const flap = k < 1 ? (0.5 + 0.5 * Math.sin(t * 40)) : 0;
    det = <Bird x={bx} y={by} flap={flap} s={1.3} color="#3A3028" />;
  }
  const doorD = 'M900 900 V770 A60 60 0 0 1 1020 770 V900 Z';
  return (<g>
    {top}
    <rect x={X0} y={Y0} width={W} height={GY - Y0} fill={f.body} stroke={st} strokeWidth={sw} />
    <rect x={X0 + W - 60} y={Y0} width="60" height={GY - Y0} fill="#000" opacity="0.06" />
    {!f.outline && <><rect x={X0} y={Y0} width="22" height={GY - Y0} fill={f.trim} /><rect x={X0 + W - 22} y={Y0} width="22" height={GY - Y0} fill={f.trim} /><rect x={X0 - 8} y={Y0 - 4} width={W + 16} height="16" fill={f.trim} /></>}
    <Cross x={960} y={crossY} color={crossColor} />
    {[810, 1110].map(x => <path key={x} d={`M${x - 26} 770 V715 A26 26 0 0 1 ${x + 26} 715 V770 Z`} fill="#3A2A22" stroke={f.trim} strokeWidth="8" />)}
    {f.chalice && <g fill="#FFFFFF"><path d="M938 620 Q938 655 960 660 Q982 655 982 620 Z" /><rect x="956" y="660" width="8" height="20" /><rect x="944" y="678" width="32" height="7" rx="3" /><circle cx="960" cy="608" r="8" /></g>}
    {f.leaves ? <DoorLeaves open={open} T={T} /> : <path d={doorD} fill={C_.wood} stroke={f.trim} strokeWidth="10" />}
    <rect x="880" y="898" width="160" height="14" fill={mix(f.body, '#000000', 0.18)} />
    {det}
  </g>);
}
function DoorLeaves({ open, T }) {
  const flick = 0.9 + 0.1 * Math.sin(T * 13);
  const k = 1 - 0.82 * open;
  return (<g>
    <defs>
      <clipPath id="doorClip"><path d="M900 900 V770 A60 60 0 0 1 1020 770 V900 Z" /></clipPath>
      <radialGradient id="doorLight" cx="0.5" cy="0.6" r="0.7"><stop offset="0" stopColor="#FFD889" /><stop offset="0.55" stopColor="#C9853F" /><stop offset="1" stopColor="#3A2618" /></radialGradient>
    </defs>
    <path d="M880 900 L1040 900 L1200 1080 L720 1080 Z" fill="#FFD889" opacity={0.5 * open * flick} />
    <g clipPath="url(#doorClip)">
      <rect x="900" y="700" width="120" height="200" fill="url(#doorLight)" />
      <g transform={`translate(900 0) scale(${k} 1) translate(-900 0)`}><rect x="900" y="700" width="60" height="200" fill={C_.wood} /><rect x="912" y="790" width="36" height="90" fill="none" stroke="#5E3B27" strokeWidth="4" /></g>
      <g transform={`translate(1020 0) scale(${k} 1) translate(-1020 0)`}><rect x="960" y="700" width="60" height="200" fill="#6E4630" /><rect x="972" y="790" width="36" height="90" fill="none" stroke="#5E3B27" strokeWidth="4" /></g>
    </g>
    <path d="M900 900 V770 A60 60 0 0 1 1020 770 V900" fill="none" stroke="#FFFFFF" strokeWidth="10" />
  </g>);
}

function Facades({ T, C }) {
  const start = C.Cores + 1, step = (C.Porta - start) / 6;
  const vis = T >= start - 0.25 && T < C.Interior + 0.3;
  const open = MOTION.soft(clamp((T - C.Porta) / 1.7, 0, 1));
  const zIn = interpolate([C.Porta + 1.5, C.Interior + 0.1], [1, 9], MOTION.push)(T);
  const clouds = [[400, 230, 1], [1500, 170, 0.8], [1150, 300, 0.6]];
  return (
    <div style={{ position: 'absolute', inset: 0, visibility: vis ? 'visible' : 'hidden' }}>
      {FACADES.map((f, i) => {
        const a = start + i * step, last = i === 5;
        const o = MOTION.soft(clamp((T - (a - 0.2)) / 0.2, 0, 1));
        const end = last ? C.Interior + 0.3 : a + step + 0.05;
        if (T < a - 0.25 || T > end) return null;
        const lt = T - a;
        const z = last ? (1 + 0.04 * clamp(lt / step, 0, 1)) * zIn : 0.985 + 0.05 * clamp(lt / step, 0, 1);
        return (
          <Svg key={i} style={{ opacity: o }}>
            <defs><linearGradient id={'fsky' + i} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#9FBFDA" /><stop offset="1" stopColor="#F4E6C8" /></linearGradient></defs>
            <g transform={camera(960, last ? 820 : 640, z)}>
              <rect x="0" y="0" width="1920" height="1080" fill={'url(#fsky' + i + ')'} />
              {clouds.map(([x, y, s], k) => <g key={k} transform={`translate(${x + T * 14 * s} ${y}) scale(${s})`} fill="#FFFFFF" opacity="0.85"><ellipse cx="0" cy="0" rx="90" ry="26" /><ellipse cx="40" cy="-18" rx="50" ry="30" /><ellipse cx="-40" cy="-10" rx="40" ry="22" /></g>)}
              <path d={ridge(-100, 2100, 860, [[30, 0.003, i], [12, 0.01, 2]])} fill="#B9C9A6" />
              <rect x="0" y={GY} width="1920" height="200" fill="#E2C094" />
              <Facade f={f} t={lt} T={T} open={last ? open : 0} />
            </g>
          </Svg>
        );
      })}
    </div>
  );
}

// ---------- Interior ----------
function Interior({ T, C }) {
  const vis = T >= C.Interior - 0.5 && T < C.Fecho + 0.8;
  const lt = T - C.Interior;
  const z = 1 + 0.09 * MOTION.soft(clamp(lt / (C.Fecho - C.Interior + 0.8), 0, 1));
  const fromDark = 1 - MOTION.soft(clamp((T - C.Interior + 0.45) / 1.1, 0, 1));
  const fl = Math.sin(T * 17) * 0.5 + Math.sin(T * 29) * 0.3;
  const shimmer = 0.32 + 0.05 * Math.sin(T * 2.2);
  const beams = [
    { wx: [690, 800], f: [[700, 1080], [1180, 1080]], cols: ['#7FBF86', '#F0A24E', '#6E9BD0'] },
    { wx: [1120, 1230], f: [[1280, 1080], [1760, 1080]], cols: ['#F0A24E', '#6E9BD0', '#7FBF86'] }
  ];
  return (
    <Svg style={{ visibility: vis ? 'visible' : 'hidden' }}>
      <defs>
        <radialGradient id="pen" cx="0.5" cy="0.55" r="0.75"><stop offset="0.35" stopColor="#24170E" stopOpacity="0" /><stop offset="1" stopColor="#24170E" stopOpacity="0.62" /></radialGradient>
        <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFF1CF" stopOpacity="0.55" /><stop offset="1" stopColor="#FFF1CF" stopOpacity="0.08" /></linearGradient>
        <radialGradient id="candle"><stop offset="0" stopColor="#FFD889" stopOpacity="0.8" /><stop offset="1" stopColor="#FFD889" stopOpacity="0" /></radialGradient>
      </defs>
      <g transform={camera(960, 600, z)}>
        <rect x="0" y="0" width="1920" height="1080" fill="#CDBB98" />
        <path d="M0 0 L600 240 L600 760 L0 1080 Z" fill="#D9CBAE" />
        <path d="M1920 0 L1320 240 L1320 760 L1920 1080 Z" fill="#D0C1A3" />
        <rect x="600" y="240" width="720" height="520" fill="#E8DCC2" />
        {[0.15, 0.35, 0.55, 0.75].map((k, i) => <path key={i} d={`M${600 + 720 * k - 1} 240 L${1920 * k * 1.0 + (k - 0.5) * 300} 0`} stroke="#8B6A4A" strokeWidth="10" opacity="0.5" />)}
        <path d="M0 1080 L600 760 L1320 760 L1920 1080 Z" fill="#C2A47C" />
        {[0.1, 0.3, 0.5, 0.7, 0.9].map((k, i) => <path key={i} d={`M${600 + 720 * k} 760 L${-400 + 2720 * k} 1080`} stroke="#A98C66" strokeWidth="2" />)}
        {[820, 880, 960].map((y, i) => <path key={i} d={`M${600 - (y - 760) * 1.9} ${y} H${1320 + (y - 760) * 1.9}`} stroke="#A98C66" strokeWidth="2" />)}
        {beams.map((b, i) => <g key={i}>
          <path d={`M${b.wx[0]} 300 V420 A55 55 0 0 1 ${b.wx[1]} 420 V560`} fill="none" />
          <g>
            <path d={`M${b.wx[0]} 560 V400 A55 55 0 0 1 ${b.wx[1]} 400 V560 Z`} fill="#F3E6C8" stroke="#8B6A4A" strokeWidth="8" />
            <rect x={b.wx[0] + 4} y="400" width="34" height="156" fill={b.cols[0]} /><rect x={b.wx[0] + 38} y="400" width="34" height="156" fill={b.cols[1]} /><rect x={b.wx[0] + 72} y="400" width="34" height="156" fill={b.cols[2]} />
            <path d={`M${b.wx[0] + 4} 400 A51 51 0 0 1 ${b.wx[1] - 4} 400 Z`} fill={b.cols[1]} />
            <path d={`M${(b.wx[0] + b.wx[1]) / 2} 350 V556 M${b.wx[0]} 470 H${b.wx[1]}`} stroke="#8B6A4A" strokeWidth="5" />
          </g>
          <path d={`M${b.wx[0]} 400 L${b.wx[1]} 400 L${b.f[1][0]} ${b.f[1][1]} L${b.f[0][0]} ${b.f[0][1]} Z`} fill="url(#beam)" opacity={0.7 + 0.1 * Math.sin(T * 1.3 + i)} />
          {b.cols.map((c, k) => { const x0 = b.f[0][0] + (b.f[1][0] - b.f[0][0]) * (k / 3); const w = (b.f[1][0] - b.f[0][0]) / 3; return <path key={k} d={`M${x0 - 30} 930 L${x0 + w - 30} 930 L${x0 + w} 1080 L${x0} 1080 Z`} fill={c} opacity={shimmer} />; })}
          {DUST.map((d, k) => { if (k % 2 !== i) return null; const yy = (d.y + lt * d.sp * 0.12) % 1; const xa = b.wx[0] + (b.f[0][0] - b.wx[0]) * yy, xb = b.wx[1] + (b.f[1][0] - b.wx[1]) * yy; const x = xa + (xb - xa) * d.x + 8 * Math.sin(T * 0.8 + d.ph); const y = 420 + 640 * yy; return <circle key={k} cx={x} cy={y} r={d.s} fill="#FFF6DC" opacity={0.35 + 0.35 * Math.sin(T * 1.5 + d.ph)} />; })}
        </g>)}
        <path d="M960 300 V520 M906 352 H1014" stroke={C_.wood} strokeWidth="18" strokeLinecap="round" />
        <circle cx="1040" cy="560" r={110 + 6 * fl} fill="url(#candle)" />
        <rect x="800" y="610" width="320" height="150" fill="#9A7A56" />
        <rect x="790" y="600" width="340" height="80" fill="#FFFFFF" />
        <path d={'M790 680 ' + Array.from({ length: 12 }, (_, i) => `q ${340 / 24} 18 ${340 / 12} 0`).join(' ')} fill="#FFFFFF" />
        {Array.from({ length: 12 }, (_, i) => <circle key={i} cx={790 + 340 / 24 + i * 340 / 12} cy="686" r="3" fill="#E8DCC2" />)}
        {Array.from({ length: 16 }, (_, i) => <circle key={i} cx={805 + i * 20.5} cy="640" r="4" fill="none" stroke="#E6DED0" strokeWidth="2" />)}
        <rect x="1032" y="540" width="16" height="60" fill="#FAF3E2" />
        <path transform={`translate(1040 540) scale(${1 + 0.08 * fl} ${1 + 0.15 * fl}) skewX(${6 * fl})`} d="M0 -34 Q 9 -14 7 -4 Q 4 2 0 2 Q -4 2 -7 -4 Q -9 -14 0 -34 Z" fill="#FFC75A" />
        <path transform={`translate(1040 540) scale(${1 + 0.08 * fl})`} d="M0 -20 Q 4 -9 3 -3 Q 0 0 -3 -3 Q -4 -9 0 -20 Z" fill="#FFF3D0" />
        <rect x="860" y="560" width="22" height="40" fill="#C9853F" /><circle cx="864" cy="552" r="12" fill="#E59A4A" /><circle cx="880" cy="548" r="10" fill="#F2C2A8" /><circle cx="872" cy="540" r="9" fill="#FAF7F0" />
        {[[-1, 0], [1, 0]].map(([s], i) => <g key={i}>
          <path d={`M${960 + s * 110} 860 L${960 + s * 720} 860 L${960 + s * 760} 900 L${960 + s * 110} 900 Z`} fill="#7A4E34" />
          <rect x={s < 0 ? 960 - 760 : 960 + 110} y="900" width="650" height="70" fill="#6A412B" />
          <path d={`M${960 + s * 150} 990 L${960 + s * 980} 990 L${960 + s * 1040} 1040 L${960 + s * 150} 1040 Z`} fill="#5E3A26" />
          <rect x={s < 0 ? 960 - 1040 : 960 + 150} y="1040" width="890" height="60" fill="#4F311F" />
        </g>)}
        <rect x="0" y="0" width="1920" height="1080" fill="url(#pen)" />
      </g>
      <rect x="0" y="0" width="1920" height="1080" fill="#2A1C12" opacity={fromDark} />
    </Svg>
  );
}

// ---------- Entardecer e fecho ----------
const BIRDS = Array.from({ length: 6 }, (_, i) => ({ y: 260 + i * 34 + (i % 2) * 18, d: i * 0.16, s: 0.7 + (i % 3) * 0.15 }));
function Dusk({ T, C, end }) {
  const vis = T >= C.Fecho - 0.3;
  const lt = T - C.Fecho;
  const z = 1.06 - 0.06 * MOTION.soft(clamp(lt / (end - C.Fecho), 0, 1));
  return (
    <Svg style={{ visibility: vis ? 'visible' : 'hidden' }}>
      <defs>
        <linearGradient id="dsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#D98A66" /><stop offset="0.5" stopColor="#F0A856" /><stop offset="0.85" stopColor="#F8D58E" /></linearGradient>
        <radialGradient id="dsun"><stop offset="0" stopColor="#FFF0C2" stopOpacity="0.95" /><stop offset="1" stopColor="#FFE0A0" stopOpacity="0" /></radialGradient>
      </defs>
      <g transform={camera(960, 640, z)}>
        <rect x="-100" y="-100" width="2120" height="1280" fill="url(#dsky)" />
        <circle cx="720" cy="760" r="300" fill="url(#dsun)" />
        <circle cx="720" cy="770" r="70" fill="#FFE7A6" />
        <path d={ridge(-200, 2200, 760, [[45, 0.0026, 2], [18, 0.008, 1]])} fill="#B79AC0" />
        <path d="M-100 1100 L-100 880 Q 500 820 760 760 Q 960 610 1160 760 Q 1500 830 2100 880 L2100 1100 Z" fill="#8A73A6" />
        <g transform="translate(960 668)" fill="#5E4B78">
          <rect x="-58" y="-60" width="116" height="66" /><path d="M-66 -60 L0 -100 L66 -60 Z" /><path d="M0 -100 V-130 M-10 -120 H10" stroke="#5E4B78" strokeWidth="6" strokeLinecap="round" />
          <path d="M-14 6 V-20 A14 14 0 0 1 14 -20 V6 Z" fill="#FFD27A" />
        </g>
        <path d="M-100 1100 L-100 960 Q 700 900 2100 980 L2100 1100 Z" fill="#6E5A8C" />
        {BIRDS.map((b, i) => { const k = clamp((lt - b.d) / 3.4, 0, 1); const x = -120 + 2200 * k; const fl = Math.sin(T * 12 + i); return k > 0 && k < 1 ? <path key={i} transform={`translate(${x} ${b.y - 60 * k}) scale(${b.s})`} d={`M-18 ${-6 * fl} Q -9 ${-10 * fl - 4} 0 0 Q 9 ${-10 * fl - 4} 18 ${-6 * fl}`} fill="none" stroke="#4E3E62" strokeWidth="4" strokeLinecap="round" /> : null; })}
      </g>
    </Svg>
  );
}

function Overlays({ T, C, end, showCross, noIvory }) {
  const flash = interpolate([C.Fecho - 0.5, C.Fecho, C.Fecho + 0.8], [0, 1, 0], MOTION.soft)(T);
  const ivory = noIvory ? 0 : MOTION.soft(clamp((T - (end - 1.6)) / 0.8, 0, 1));
  const draw1 = MOTION.soft(clamp((T - (end - 1.0)) / 0.45, 0, 1));
  const draw2 = MOTION.soft(clamp((T - (end - 0.6)) / 0.4, 0, 1));
  return (<>
    <div style={{ position: 'absolute', inset: 0, background: '#FFF3DA', opacity: flash }} />
    <div style={{ position: 'absolute', inset: 0, background: C_.ivory, opacity: ivory }} />
    {showCross && <Svg>
      <path d="M960 455 V625" stroke={C_.gold} strokeWidth="6" strokeLinecap="round" fill="none" strokeDasharray="170" strokeDashoffset={170 * (1 - draw1)} opacity={draw1 > 0 ? 1 : 0} />
      <path d="M908 508 H1012" stroke={C_.gold} strokeWidth="6" strokeLinecap="round" fill="none" strokeDasharray="104" strokeDashoffset={104 * (1 - draw2)} opacity={draw2 > 0 ? 1 : 0} />
    </Svg>}
  </>);
}

function Paper({ k }) {
  return (
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', mixBlendMode: 'multiply', opacity: k, pointerEvents: 'none' }}>
      <filter id="paper"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" seed="4" /><feColorMatrix values="0 0 0 0 0.45  0 0 0 0 0.38  0 0 0 0 0.3  0 0 0 1.6 -0.55" /></filter>
      <rect width="100%" height="100%" filter="url(#paper)" />
    </svg>
  );
}

function Piece({ t }) {
  const { T, CUES: C, authoredTotal } = useComposition();
  return <Scene T={T} C={C} end={authoredTotal} t={t} />;
}
function Scene({ T, C, end: authoredTotal, t }) {
  return (
    <div data-screen-label={'t=' + Math.floor(T) + 's'} style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#121D35' }}>
      <Landscape T={T} C={C} />
      <Facades T={T} C={C} />
      <Interior T={T} C={C} />
      <Dusk T={T} C={C} end={authoredTotal} />
      <Overlays T={T} C={C} end={authoredTotal} showCross={t.showCross} noIvory={t.noIvory} />
      <Paper k={t.paper} />
    </div>
  );
}

function Abertura() {
  const [t, setTweak] = useTweaks(window.TWEAK_DEFAULTS);
  const v = t.format === '9:16';
  return (<>
    <CompositionStage key={t.format} width={v ? 1080 : 1920} height={v ? 1920 : 1080} scenes={window.OM_SCENES} playback={window.OM_PLAYBACK} bg="#121D35">
      <Piece t={t} />
    </CompositionStage>
    <TweaksPanel>
      <TweakSection label="Abertura" />
      <TweakRadio label="Formato" value={t.format} options={['16:9', '9:16']} onChange={x => setTweak('format', x)} />
      <TweakSlider label="Textura de papel" value={t.paper} min={0} max={0.6} step={0.02} onChange={x => setTweak('paper', x)} />
      <TweakToggle label="Cruz no final" value={t.showCross} onChange={x => setTweak('showCross', x)} />
      <TweakToggle label="Motion editor" value={t.motionEditor} onChange={x => setTweak('motionEditor', x)} />
    </TweaksPanel>
  </>);
}
window.Abertura = Abertura;

// Versão para o topo do site: relógio próprio, sem controles; toca uma vez e avisa no fim.
const HERO_CUES = { Madrugada: 0, Serra: 5, Cores: 10, Porta: 17, Interior: 21, Fecho: 26 }, HERO_END = 30;
function HeroAbertura({ onEnd, playKey, skip }) {
  const [T, setT] = React.useState(0);
  const endRef = React.useRef(onEnd); endRef.current = onEnd;
  React.useEffect(() => {
    const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || skip) { setT(HERO_END - 2.2); return; }
    let raf, t0 = performance.now();
    const tick = now => {
      setT(((now - t0) / 1000) % (HERO_END - 1.6));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playKey, skip]);
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <Scene T={T} C={HERO_CUES} end={HERO_END} t={{ paper: 0.22, showCross: false, noIvory: true }} />
    </div>
  );
}
window.HeroAbertura = HeroAbertura;
