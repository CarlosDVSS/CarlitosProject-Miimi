import { useEffect, useMemo, useState } from "react";
import { useSleepStatus } from "./hooks/useSleepStatus";
import { useStickyNotes } from "./hooks/useStickyNotes";
import { supabaseConfigured } from "./lib/supabase";
import "./App.css";

function CloudBadge({ state }) {
  const labels = {
    online: { pt: "☁️ online", en: "☁️ online", ar: "☁️ متصل" },
    syncing: { pt: "☁️ salvando…", en: "☁️ syncing…", ar: "☁️ جاري الحفظ" },
    loading: { pt: "☁️ carregando…", en: "☁️ loading…", ar: "☁️ تحميل" },
    error: { pt: "☁️ erro de sync", en: "☁️ sync error", ar: "☁️ خطأ" },
    offline: { pt: "☁️ offline", en: "☁️ offline", ar: "☁️ غير متصل" },
  };
  const lines = labels[state] ?? labels.offline;
  return (
    <span className={`cloud-badge cloud-badge--${state}`} title={lines.pt}>
      {lines.pt}
    </span>
  );
}

function SetupBanner() {
  if (supabaseConfigured) return null;
  return (
    <div className="setup-banner">
      <p className="setup-banner__lead">☁️ Falta conectar o Supabase (5 min)</p>
      <ol className="setup-banner__steps">
        <li>
          <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer">
            supabase.com/dashboard
          </a>
          {" "}→ projeto → <strong>Settings → API</strong> (copie URL + anon key)
        </li>
        <li>
          <strong>Vercel</strong> → projeto TimeClockAra → Settings → Environment Variables → cole{" "}
          <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code> → Redeploy
        </li>
        <li>
          Git ligado? <strong>Database → Migrations</strong> no Supabase aplica o SQL do repo automaticamente
        </li>
      </ol>
    </div>
  );
}

const TZ_CARLITOS = "America/Fortaleza";
const TZ_MIMI = "Asia/Riyadh";

const PETS = [
  { name: "King", emoji: "🐕", type: "dog" },
  { name: "Luna", emoji: "🐱", type: "cat" },
  { name: "Milk", emoji: "🐱", type: "cat" },
  { name: "Jacutinga", emoji: "🐱", type: "cat" },
  { name: "Francisca", emoji: "🐱", type: "cat" },
];

const GREETINGS = {
  carlitos: {
    morning: { pt: "Bom dia, Carlitos!", en: "Good morning, Carlitos!", ar: "صباح الخير يا كارليتوس!" },
    afternoon: { pt: "Boa tarde, Carlitos!", en: "Good afternoon, Carlitos!", ar: "مساء الخير يا كارليتوس!" },
    evening: { pt: "Boa noite, Carlitos!", en: "Good evening, Carlitos!", ar: "مساء الخير يا كارليتوس!" },
    night: { pt: "Boa noite, Carlitos!", en: "Good night, Carlitos!", ar: "تصبح على خير يا كارليتوس!" },
  },
  mimi: {
    morning: { pt: "Bom dia, Mimi!", en: "Good morning, Mimi!", ar: "صباح الخير يا ميمي!" },
    afternoon: { pt: "Boa tarde, Mimi!", en: "Good afternoon, Mimi!", ar: "مساء الخير يا ميمي!" },
    evening: { pt: "Boa noite, Mimi!", en: "Good evening, Mimi!", ar: "مساء الخير يا ميمي!" },
    night: { pt: "Boa noite, Mimi!", en: "Good night, Mimi!", ar: "تصبحين على خير يا ميمي!" },
  },
};

const CUTE_NOTES = [
  { pt: "6 horas de distância, zero de carinho", en: "6 hours apart, infinite warmth", ar: "٦ ساعات بيننا، ومحبة بلا حدود" },
  { pt: "Quando você acorda, ela pode estar dormindo", en: "When you wake, she might be dreaming", ar: "عندما تستيقظ، قد تكون نائمة" },
  { pt: "Do Piauí pro deserto — mesma amizade", en: "From Piauí to the desert — same bond", ar: "من بياوي إلى الصحراء — نفس الصداقة" },
  { pt: "Manda um oi pra Mimi quando der!", en: "Say hi to Mimi when you can!", ar: "أرسل تحية لميمي عندما تستطيع!" },
];

const FULL_ANIM_TYPES = ["hearts", "aurora", "stars", "sunrise"];

function getParts(date, timeZone) {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const parts = Object.fromEntries(fmt.formatToParts(date).map((p) => [p.type, p.value]));
  const hour = Number(parts.hour);
  return {
    hour,
    time: `${parts.hour}:${parts.minute}:${parts.second}`,
    date: `${parts.weekday}, ${parts.day} ${parts.month}`,
    period:
      hour >= 5 && hour < 12 ? "morning" : hour >= 12 && hour < 18 ? "afternoon" : hour >= 18 && hour < 22 ? "evening" : "night",
    isDay: hour >= 6 && hour < 19,
  };
}

function hourDiff() {
  const now = new Date();
  const h1 = Number(new Intl.DateTimeFormat("en-GB", { timeZone: TZ_CARLITOS, hour: "numeric", hour12: false }).format(now));
  const h2 = Number(new Intl.DateTimeFormat("en-GB", { timeZone: TZ_MIMI, hour: "numeric", hour12: false }).format(now));
  let diff = h2 - h1;
  if (diff > 12) diff -= 24;
  if (diff < -12) diff += 24;
  return diff;
}

function diffLabels(diff) {
  if (diff === 0) return { pt: "Mesmo horário!", en: "Same time!", ar: "نفس التوقيت!" };
  if (diff > 0) return { pt: `Mimi está ${diff}h à frente`, en: `Mimi is ${diff}h ahead`, ar: `ميمي متقدمة بـ ${diff} ساعات` };
  return { pt: `Você está ${Math.abs(diff)}h à frente`, en: `You're ${Math.abs(diff)}h ahead`, ar: `أنت متقدم بـ ${Math.abs(diff)} ساعات` };
}

function sleepStatusLines(person, time, isAsleep, hour) {
  if (!isAsleep) {
    if (hour < 2) {
      return {
        pt: "Acordado(a) ✨",
        en: "Awake ✨",
        ar: "مستيقظ(ة) ✨",
      };
    }
    return {
      pt: "Acordado(a) — toque o ícone pra dormir",
      en: "Awake — tap icon to mark sleep",
      ar: "مستيقظ(ة) — اضغط الأيقونة للنوم",
    };
  }
  const t = time || "02:00";
  if (person === "mimi") {
    return {
      pt: `Dormindo desde ~${t} 😴 (toque pra acordar)`,
      en: `Sleeping since ~${t} 😴 (tap to wake)`,
      ar: `نائمة منذ ~${t} 😴 (اضغط للاستيقاظ)`,
    };
  }
  return {
    pt: `Dormindo desde ~${t} 😴 (toque pra acordar)`,
    en: `Sleeping since ~${t} 😴 (tap to wake)`,
    ar: `نائم منذ ~${t} 😴 (اضغط للاستيقاظ)`,
  };
}

function Trilingual({ lines, className = "", compact = false }) {
  return (
    <div className={`tri ${compact ? "tri--compact" : ""} ${className}`}>
      <p lang="pt">{lines.pt}</p>
      <p lang="en">{lines.en}</p>
      <p lang="ar" dir="rtl" className="tri__ar">{lines.ar}</p>
    </div>
  );
}

function Sky({ isDay, variant }) {
  return (
    <div className={`sky ${isDay ? "sky--day" : "sky--night"}`} aria-hidden>
      {isDay ? (
        <>
          <div className={`sun sun--${variant}`} />
          <div className="cloud cloud-1" />
          <div className="cloud cloud-2" />
        </>
      ) : (
        <>
          {Array.from({ length: 14 }, (_, i) => (
            <span
              key={i}
              className="star"
              style={{
                left: `${(i * 19 + (variant === "a" ? 5 : 13)) % 95}%`,
                top: `${(i * 11 + 8) % 70}%`,
                animationDelay: `${(i * 0.35) % 2.5}s`,
              }}
            />
          ))}
          <div className={`moon moon--${variant}`} />
        </>
      )}
    </div>
  );
}

function Avatar({ emoji, imageSrc, isAsleep, onToggle, label }) {
  return (
    <button type="button" className={`avatar-btn ${isAsleep ? "avatar-btn--sleep" : "avatar-btn--awake"}`} onClick={onToggle} aria-label={label}>
      {imageSrc ? (
        <img src={imageSrc} alt="" className="avatar-img" />
      ) : (
        <span className="avatar-emoji">{emoji}</span>
      )}
      {isAsleep && <span className="zzz">z z z</span>}
      <span className="avatar-hint">{isAsleep ? "😴" : "✨"}</span>
    </button>
  );
}

function ZoneContent({ person, name, avatar, location, greeting, parts, isDay, align, sleep }) {
  const statusLines = sleepStatusLines(person, sleep.sleepSinceFormatted, sleep.isAsleep, parts.hour);

  return (
    <div className={`zone-content zone-content--${align} ${isDay ? "zone-content--day" : "zone-content--night"}`}>
      <div className="avatar-wrap">
        <Avatar
          emoji={avatar.emoji}
          imageSrc={avatar.image}
          isAsleep={sleep.isAsleep}
          onToggle={sleep.toggleAwake}
          label={sleep.isAsleep ? `Marcar ${name} acordado` : `Marcar ${name} dormindo`}
        />
      </div>
      <h2 className="name">{name}</h2>
      <p className="location">{location}</p>
      <Trilingual lines={greeting} className="greeting-tri" compact />
      <time className="clock" dateTime={parts.time}>{parts.time}</time>
      <p className="date">{parts.date}</p>
      <Trilingual compact className="status-tri" lines={statusLines} />
    </div>
  );
}

function StickyWall({ notes, draft, setDraft, author, setAuthor, addNote, removeNote, syncState, supabaseConfigured: supabaseOk }) {
  return (
    <section className="sticky-wall">
      <div className="sticky-wall__head">
        <h3 className="sticky-wall__title">
          <span>📌</span> sticky notes
        </h3>
        <CloudBadge state={syncState} />
      </div>
      <Trilingual
        compact
        className="sticky-wall__hint"
        lines={{
          pt: "Salvos na nuvem · somem à meia-noite (Piauí) · os dois veem",
          en: "Saved in the cloud · gone at midnight (Piauí) · both see them",
          ar: "محفوظ في السحابة · يختفي عند منتصف الليل",
        }}
      />
      <div className="sticky-compose">
        <div className="sticky-author">
          <button type="button" className={author === "carlitos" ? "active" : ""} onClick={() => setAuthor("carlitos")}>
            👾 Carlitos
          </button>
          <button type="button" className={author === "mimi" ? "active" : ""} onClick={() => setAuthor("mimi")}>
            🌷 Mimi
          </button>
        </div>
        <div className="sticky-input-row">
          <input
            type="text"
            maxLength={120}
            placeholder={supabaseOk ? "write something cute…" : "configure Supabase first…"}
            value={draft}
            disabled={!supabaseOk}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && supabaseOk && addNote()}
          />
          <button type="button" className="sticky-add" onClick={addNote} disabled={!supabaseOk} aria-label="Add note">
            +
          </button>
        </div>
      </div>
      <div className="sticky-grid">
        {notes.length === 0 ? (
          <p className="sticky-empty">…</p>
        ) : (
          notes.map((n, i) => (
            <article
              key={n.id}
              className={`sticky-note sticky-note--${n.author}`}
              style={{ background: n.color, transform: `rotate(${(i % 5) - 2}deg)` }}
            >
              <button type="button" className="sticky-note__x" onClick={() => removeNote(n.id)} aria-label="Remove">
                ×
              </button>
              <span className="sticky-note__who">{n.author === "mimi" ? "🌷" : "👾"}</span>
              <p>{n.text}</p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function CamiAndKids() {
  return (
    <section className="cami-kids">
      <h3 className="cami-kids__title">cami and the kids</h3>
      <div className="cami-row">
        <div className="cami-card">
          <img src="/cami.png" alt="Cami, dinossaurinho laranja" className="cami-photo" />
          <div>
            <strong>Cami</strong>
            <p className="cami-desc">o dinossaurinho laranja 🦖</p>
          </div>
        </div>
      </div>
      <p className="kids-label">the kids</p>
      <ul className="pets-list">
        {PETS.map((pet) => (
          <li key={pet.name} className={`pet-chip pet-chip--${pet.type}`}>
            <span>{pet.emoji}</span>
            {pet.name}
          </li>
        ))}
      </ul>
      <Trilingual
        compact
        lines={{
          pt: "King (cachorro) · Luna, Milk, Jacutinga & Francisca (gatos)",
          en: "King (dog) · Luna, Milk, Jacutinga & Francisca (cats)",
          ar: "كينج (كلب) · لونا، ميلك، جاكوتينغا وفرانسيسكا (قطط)",
        }}
      />
    </section>
  );
}

function FullScreenAnim({ type, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 4800);
    return () => clearTimeout(t);
  }, [onDone]);

  const particles =
    type === "hearts"
      ? ["💛", "💕", "✨", "🌷", "👾", "⭐", "💛", "💕", "🌷", "👾"]
      : type === "stars"
        ? Array(40).fill("✦")
        : type === "aurora"
          ? null
          : ["☀️", "🌅", "✨", "🌤️", "💛"];

  return (
    <div className={`fullscreen-anim fullscreen-anim--${type}`} aria-hidden>
      {type === "aurora" && (
        <div className="aurora-waves">
          <div className="aurora-wave aurora-wave--1" />
          <div className="aurora-wave aurora-wave--2" />
          <div className="aurora-wave aurora-wave--3" />
        </div>
      )}
      {type === "sunrise" && <div className="sunrise-burst" />}
      {particles?.map((p, i) => (
        <span key={i} className="fs-particle" style={{ left: `${(i * 7.3 + 5) % 100}%`, animationDelay: `${(i * 0.12) % 1.5}s` }}>
          {p}
        </span>
      ))}
      <div className="fullscreen-anim__msg">
        <Trilingual
          lines={{
            pt: "Carlitos & Mimi — sempre conectados",
            en: "Carlitos & Mimi — always connected",
            ar: "كارليتوس وميمي — دائماً متصلان",
          }}
        />
      </div>
    </div>
  );
}

export default function App() {
  const [now, setNow] = useState(() => new Date());
  const [noteIndex, setNoteIndex] = useState(0);
  const [fullAnim, setFullAnim] = useState(null);
  const stickies = useStickyNotes();
  const sleepCarlitos = useSleepStatus("carlitos", TZ_CARLITOS);
  const sleepMimi = useSleepStatus("mimi", TZ_MIMI);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNoteIndex((i) => (i + 1) % CUTE_NOTES.length), 8000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const trigger = () => setFullAnim(FULL_ANIM_TYPES[Math.floor(Math.random() * FULL_ANIM_TYPES.length)]);
    const first = setTimeout(trigger, 14000);
    const loop = setInterval(trigger, 60000);
    return () => {
      clearTimeout(first);
      clearInterval(loop);
    };
  }, []);

  const carlitos = useMemo(() => getParts(now, TZ_CARLITOS), [now]);
  const mimi = useMemo(() => getParts(now, TZ_MIMI), [now]);
  const diff = useMemo(() => hourDiff(), [now]);
  const diffText = useMemo(() => diffLabels(diff), [diff]);
  const note = CUTE_NOTES[noteIndex];

  const cloudState =
    stickies.syncState === "online" && sleepCarlitos.syncState === "online" && sleepMimi.syncState === "online"
      ? "online"
      : stickies.syncState === "error" || sleepCarlitos.syncState === "error" || sleepMimi.syncState === "error"
        ? "error"
        : stickies.syncState === "offline"
          ? "offline"
          : "syncing";

  return (
    <div className="app">
      <SetupBanner />
      <header className="header">
        <h1 className="title">
          <span className="title-heart">💛</span>
          Carlitos & Mimi
          <span className="title-heart">💛</span>
        </h1>
        <p className="title-sub">
          <CloudBadge state={cloudState} />
        </p>
        <Trilingual
          compact
          className="subtitle-tri"
          lines={{
            pt: "do Piauí até a Arábia Saudita",
            en: "from Piauí to Saudi Arabia",
            ar: "من بياوي إلى المملكة العربية السعودية",
          }}
        />
      </header>

      <main className="main-scroll">
        <div className="diagonal-stage">
          <section className={`zone zone--mimi ${mimi.isDay ? "zone--day" : "zone--night"}`} aria-label="Mimi">
            <Sky isDay={mimi.isDay} variant="a" />
            <ZoneContent
              person="mimi"
              name="Mimi"
              avatar={{ emoji: "🌷" }}
              location="🇸🇦 Saudi Arabia"
              greeting={GREETINGS.mimi[mimi.period]}
              parts={mimi}
              isDay={mimi.isDay}
              align="tl"
              sleep={sleepMimi}
            />
            <div className="lang-tags lang-tags--mimi">
              <span>EN</span>
              <span>AR</span>
            </div>
          </section>

          <section className={`zone zone--carlitos ${carlitos.isDay ? "zone--day" : "zone--night"}`} aria-label="Carlitos">
            <Sky isDay={carlitos.isDay} variant="b" />
            <ZoneContent
              person="carlitos"
              name="Carlitos"
              avatar={{ emoji: "👾" }}
              location="🇧🇷 Piauí, Brasil"
              greeting={GREETINGS.carlitos[carlitos.period]}
              parts={carlitos}
              isDay={carlitos.isDay}
              align="br"
              sleep={sleepCarlitos}
            />
            <div className="lang-tags lang-tags--carlitos">
              <span>PT</span>
            </div>
          </section>

          <div className="diagonal-line" aria-hidden>
            <div className="diagonal-line__glow" />
          </div>

          <div className="bridge">
            <span className="bridge-heart">💕</span>
            <Trilingual lines={diffText} className="bridge-diff-tri" compact />
            <div className="bridge-note" key={noteIndex}>
              <Trilingual lines={note} compact />
            </div>
          </div>
        </div>

        <CamiAndKids />
        <StickyWall {...stickies} />
      </main>

      <footer className="footer">
        <Trilingual compact lines={{ pt: "Feito com carinho", en: "Made with love", ar: "صُنع بمحبة" }} />
      </footer>

      {fullAnim && <FullScreenAnim type={fullAnim} onDone={() => setFullAnim(null)} />}
    </div>
  );
}
