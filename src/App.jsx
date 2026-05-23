import { useEffect, useMemo, useState } from "react";
import "./App.css";

const TZ_CARLITOS = "America/Fortaleza";
const TZ_MIMI = "Asia/Riyadh";

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
  {
    pt: "6 horas de distância, zero de carinho",
    en: "6 hours apart, infinite warmth",
    ar: "٦ ساعات بيننا، ومحبة بلا حدود",
  },
  {
    pt: "Quando você acorda, ela pode estar dormindo",
    en: "When you wake, she might be dreaming",
    ar: "عندما تستيقظ، قد تكون نائمة",
  },
  {
    pt: "Do Piauí pro deserto — mesma amizade",
    en: "From Piauí to the desert — same bond",
    ar: "من بياوي إلى الصحراء — نفس الصداقة",
  },
  {
    pt: "Manda um oi pra Mimi quando der!",
    en: "Say hi to Mimi when you can!",
    ar: "أرسل تحية لميمي عندما تستطيع!",
  },
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
  const parts = Object.fromEntries(
    fmt.formatToParts(date).map((p) => [p.type, p.value])
  );
  const hour = Number(parts.hour);
  return {
    hour,
    time: `${parts.hour}:${parts.minute}:${parts.second}`,
    date: `${parts.weekday}, ${parts.day} ${parts.month}`,
    period:
      hour >= 5 && hour < 12
        ? "morning"
        : hour >= 12 && hour < 18
          ? "afternoon"
          : hour >= 18 && hour < 22
            ? "evening"
            : "night",
    isDay: hour >= 6 && hour < 19,
  };
}

function hourDiff() {
  const now = new Date();
  const h1 = Number(
    new Intl.DateTimeFormat("en-GB", { timeZone: TZ_CARLITOS, hour: "numeric", hour12: false }).format(now)
  );
  const h2 = Number(
    new Intl.DateTimeFormat("en-GB", { timeZone: TZ_MIMI, hour: "numeric", hour12: false }).format(now)
  );
  let diff = h2 - h1;
  if (diff > 12) diff -= 24;
  if (diff < -12) diff += 24;
  return diff;
}

function diffLabels(diff) {
  if (diff === 0) {
    return {
      pt: "Mesmo horário!",
      en: "Same time!",
      ar: "نفس التوقيت!",
    };
  }
  if (diff > 0) {
    return {
      pt: `Mimi está ${diff}h à frente`,
      en: `Mimi is ${diff}h ahead`,
      ar: `ميمي متقدمة بـ ${diff} ساعات`,
    };
  }
  return {
    pt: `Você está ${Math.abs(diff)}h à frente`,
    en: `You're ${Math.abs(diff)}h ahead`,
    ar: `أنت متقدم بـ ${Math.abs(diff)} ساعات`,
  };
}

function Trilingual({ lines, className = "", compact = false }) {
  return (
    <div className={`tri ${compact ? "tri--compact" : ""} ${className}`}>
      <p lang="pt">{lines.pt}</p>
      <p lang="en">{lines.en}</p>
      <p lang="ar" dir="rtl" className="tri__ar">
        {lines.ar}
      </p>
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
          {Array.from({ length: 18 }, (_, i) => (
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

const SLEEP_MSG = {
  carlitos: {
    pt: "Talvez dormindo… shhh! 😴",
    en: "Maybe sleeping… shhh! 😴",
    ar: "ربما نائم… هدوء! 😴",
  },
  mimi: {
    pt: "Talvez dormindo… shhh! 😴",
    en: "Maybe sleeping… shhh! 😴",
    ar: "ربما نائمة… هدوء! 😴",
  },
};

function ZoneContent({ person, name, emoji, location, greeting, parts, isDay, asleep, align }) {
  return (
    <div className={`zone-content zone-content--${align} ${isDay ? "zone-content--day" : "zone-content--night"}`}>
      <div className="avatar-wrap">
        <span className="avatar">{emoji}</span>
        {asleep && <span className="zzz">z z z</span>}
      </div>
      <h2 className="name">{name}</h2>
      <p className="location">{location}</p>
      <Trilingual lines={greeting} className="greeting-tri" compact />
      <time className="clock" dateTime={parts.time}>
        {parts.time}
      </time>
      <p className="date">{parts.date}</p>
      {asleep && <Trilingual compact className="sleep-tri" lines={SLEEP_MSG[person]} />}
    </div>
  );
}

function FullScreenAnim({ type, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 4800);
    return () => clearTimeout(t);
  }, [onDone]);

  const particles =
    type === "hearts"
      ? ["💛", "💕", "✨", "🌸", "⭐", "💛", "💕", "✨", "🌸", "⭐", "💛", "💕"]
      : type === "stars"
        ? Array(40).fill("✦")
        : type === "aurora"
          ? null
          : ["☀️", "🌅", "✨", "🌤️", "💛", "☀️"];

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
        <span
          key={i}
          className="fs-particle"
          style={{
            left: `${(i * 7.3 + 5) % 100}%`,
            animationDelay: `${(i * 0.12) % 1.5}s`,
            fontSize: type === "stars" ? "1rem" : "1.4rem",
          }}
        >
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

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNoteIndex((i) => (i + 1) % CUTE_NOTES.length), 8000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const trigger = () => {
      const pick = FULL_ANIM_TYPES[Math.floor(Math.random() * FULL_ANIM_TYPES.length)];
      setFullAnim(pick);
    };
    const first = setTimeout(trigger, 12000);
    const loop = setInterval(trigger, 55000);
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

  const asleepCarlitos = carlitos.hour >= 23 || carlitos.hour < 6;
  const asleepMimi = mimi.hour >= 23 || mimi.hour < 6;

  return (
    <div className="app">
      <div className="diagonal-stage">
        {/* Mimi — triângulo superior esquerdo */}
        <section
          className={`zone zone--mimi ${mimi.isDay ? "zone--day" : "zone--night"}`}
          aria-label="Mimi"
        >
          <Sky isDay={mimi.isDay} variant="a" />
          <ZoneContent
            person="mimi"
            name="Mimi"
            emoji="🌸"
            location="🇸🇦 Saudi Arabia"
            greeting={GREETINGS.mimi[mimi.period]}
            parts={mimi}
            isDay={mimi.isDay}
            asleep={asleepMimi}
            align="tl"
          />
          <div className="lang-tags lang-tags--mimi">
            <span>EN</span>
            <span>AR</span>
          </div>
        </section>

        {/* Carlitos — triângulo inferior direito */}
        <section
          className={`zone zone--carlitos ${carlitos.isDay ? "zone--day" : "zone--night"}`}
          aria-label="Carlitos"
        >
          <Sky isDay={carlitos.isDay} variant="b" />
          <ZoneContent
            person="carlitos"
            name="Carlitos"
            emoji="🧑‍🌾"
            location="🇧🇷 Piauí, Brasil"
            greeting={GREETINGS.carlitos[carlitos.period]}
            parts={carlitos}
            isDay={carlitos.isDay}
            asleep={asleepCarlitos}
            align="br"
          />
          <div className="lang-tags lang-tags--carlitos">
            <span>PT</span>
          </div>
        </section>

        {/* Linha diagonal decorativa */}
        <div className="diagonal-line" aria-hidden>
          <div className="diagonal-line__glow" />
        </div>

        {/* Centro — sobre a diagonal */}
        <div className="bridge">
          <span className="bridge-heart">💕</span>
          <Trilingual lines={diffText} className="bridge-diff-tri" compact />
          <div className="bridge-note" key={noteIndex}>
            <Trilingual lines={note} compact />
          </div>
        </div>
      </div>

      <header className="header">
        <h1 className="title">
          <span className="title-heart">💛</span>
          Carlitos & Mimi
          <span className="title-heart">💛</span>
        </h1>
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

      <footer className="footer">
        <Trilingual
          compact
          lines={{
            pt: "Feito com carinho",
            en: "Made with love",
            ar: "صُنع بمحبة",
          }}
        />
      </footer>

      {fullAnim && (
        <FullScreenAnim type={fullAnim} onDone={() => setFullAnim(null)} />
      )}
    </div>
  );
}
