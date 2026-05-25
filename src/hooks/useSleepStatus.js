import { useCallback, useEffect, useState } from "react";
import { supabase, supabaseConfigured } from "../lib/supabase";

const SLEEP_HOUR = 2;

function getDateKey(timeZone) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function getHour(timeZone) {
  return Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hour: "numeric",
      hour12: false,
    }).format(new Date())
  );
}

function formatTime(timeZone, iso) {
  if (!iso) return "02:00";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

function computeState(prev, timeZone) {
  const hour = getHour(timeZone);
  const today = getDateKey(timeZone);
  let awake = prev?.awake ?? false;
  let sleepSince = prev?.sleep_since ?? null;
  let dateKey = prev?.date_key ?? today;

  if (dateKey !== today) {
    awake = false;
    sleepSince = null;
    dateKey = today;
  }

  if (hour < SLEEP_HOUR) {
    awake = false;
    sleepSince = null;
  } else if (!awake) {
    if (!sleepSince) sleepSince = new Date().toISOString();
  }

  return { awake, sleep_since: sleepSince, date_key: dateKey, hour };
}

async function fetchRow(person) {
  if (!supabase) return null;
  const { data, error } = await supabase.from("sleep_status").select("*").eq("person", person).maybeSingle();
  if (error) throw error;
  return data;
}

async function upsertRow(person, state) {
  if (!supabase) return;
  const { error } = await supabase.from("sleep_status").upsert({
    person,
    awake: state.awake,
    sleep_since: state.sleep_since,
    date_key: state.date_key,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export function useSleepStatus(person, timeZone) {
  const [status, setStatus] = useState({ awake: false, sleep_since: null, date_key: "" });
  const [syncState, setSyncState] = useState(supabaseConfigured ? "loading" : "offline");

  const applyAndMaybeSave = useCallback(
    async (remote, saveIfChanged = true) => {
      const next = computeState(remote, timeZone);
      setStatus({
        awake: next.awake,
        sleep_since: next.sleep_since,
        date_key: next.date_key,
      });

      if (!saveIfChanged || !supabase) return;

      const changed =
        !remote ||
        remote.awake !== next.awake ||
        remote.date_key !== next.date_key ||
        (next.sleep_since && remote.sleep_since !== next.sleep_since) ||
        (!next.sleep_since && remote.sleep_since);

      if (changed) {
        await upsertRow(person, next);
      }
    },
    [person, timeZone]
  );

  const refresh = useCallback(async () => {
    if (!supabaseConfigured) {
      setSyncState("offline");
      return;
    }
    try {
      setSyncState("syncing");
      const row = await fetchRow(person);
      await applyAndMaybeSave(row);
      setSyncState("online");
    } catch {
      setSyncState("error");
    }
  }, [person, applyAndMaybeSave]);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 20000);
    return () => clearInterval(t);
  }, [refresh]);

  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel(`sleep-${person}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sleep_status", filter: `person=eq.${person}` },
        async () => {
          try {
            const row = await fetchRow(person);
            await applyAndMaybeSave(row, false);
          } catch {
            /* ignore */
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [person, applyAndMaybeSave]);

  const toggleAwake = useCallback(async () => {
    const hour = getHour(timeZone);
    if (hour < SLEEP_HOUR || !supabase) return;

    try {
      setSyncState("syncing");
      const row = await fetchRow(person);
      const base = row ?? { awake: false, sleep_since: null, date_key: getDateKey(timeZone) };
      const isCurrentlyAsleep = hour >= SLEEP_HOUR && !base.awake;

      const next = isCurrentlyAsleep
        ? { ...base, awake: true, date_key: getDateKey(timeZone) }
        : { ...base, awake: false, sleep_since: new Date().toISOString(), date_key: getDateKey(timeZone) };

      await upsertRow(person, next);
      setStatus({ awake: next.awake, sleep_since: next.sleep_since, date_key: next.date_key });
      setSyncState("online");
    } catch {
      setSyncState("error");
    }
  }, [person, timeZone]);

  const hour = getHour(timeZone);
  const isAsleep = hour >= SLEEP_HOUR && !status.awake;
  const sleepSinceFormatted = formatTime(timeZone, status.sleep_since);

  return { isAsleep, sleepSince: status.sleep_since, sleepSinceFormatted, toggleAwake, syncState };
}
