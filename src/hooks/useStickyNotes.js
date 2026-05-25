import { useCallback, useEffect, useState } from "react";
import { supabase, supabaseConfigured } from "../lib/supabase";

export const STICKY_COLORS = ["#fff9c4", "#ffcdd2", "#c8e6c9", "#bbdefb", "#e1bee7", "#ffe0b2"];

/** Mesmo dia (Piauí) para os dois verem os mesmos post-its */
export function todayKey() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Fortaleza" }).format(new Date());
}

function mapRow(row) {
  return {
    id: row.id,
    text: row.text,
    author: row.author,
    color: row.color,
    createdAt: new Date(row.created_at).getTime(),
  };
}

export function useStickyNotes() {
  const [notes, setNotes] = useState([]);
  const [draft, setDraft] = useState("");
  const [author, setAuthor] = useState("carlitos");
  const [syncState, setSyncState] = useState(supabaseConfigured ? "loading" : "offline");

  const refresh = useCallback(async () => {
    if (!supabaseConfigured) {
      setSyncState("offline");
      setNotes([]);
      return;
    }
    try {
      setSyncState("syncing");
      const day = todayKey();
      const { data, error } = await supabase
        .from("sticky_notes")
        .select("*")
        .eq("day_key", day)
        .order("created_at", { ascending: false })
        .limit(12);
      if (error) throw error;
      setNotes((data ?? []).map(mapRow));
      setSyncState("online");
    } catch {
      setSyncState("error");
    }
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 45000);
    return () => clearInterval(t);
  }, [refresh]);

  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel("stickies")
      .on("postgres_changes", { event: "*", schema: "public", table: "sticky_notes" }, () => {
        refresh();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refresh]);

  const addNote = useCallback(async () => {
    const text = draft.trim();
    if (!text || !supabase) return;

    try {
      setSyncState("syncing");
      const { error } = await supabase.from("sticky_notes").insert({
        author,
        text,
        color: STICKY_COLORS[Math.floor(Math.random() * STICKY_COLORS.length)],
        day_key: todayKey(),
      });
      if (error) throw error;
      setDraft("");
      await refresh();
    } catch {
      setSyncState("error");
    }
  }, [draft, author, refresh]);

  const removeNote = useCallback(
    async (id) => {
      if (!supabase) return;
      try {
        setSyncState("syncing");
        const { error } = await supabase.from("sticky_notes").delete().eq("id", id);
        if (error) throw error;
        await refresh();
      } catch {
        setSyncState("error");
      }
    },
    [refresh]
  );

  return {
    notes,
    draft,
    setDraft,
    author,
    setAuthor,
    addNote,
    removeNote,
    syncState,
    supabaseConfigured,
  };
}
