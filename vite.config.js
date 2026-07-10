import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

function pickSupabaseEnv(env) {
  const url =
    env.VITE_SUPABASE_URL ||
    env.NEXT_PUBLIC_SUPABASE_URL ||
    env.SUPABASE_URL ||
    "";

  const key =
    env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    env.VITE_SUPABASE_ANON_KEY ||
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
    env.SUPABASE_PUBLISHABLE_KEY ||
    env.SUPABASE_ANON_KEY ||
    "";

  return { url, key };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const { url, key } = pickSupabaseEnv(env);

  return {
    plugins: [react()],
    envPrefix: ["VITE_", "NEXT_PUBLIC_"],
    // Integração Supabase→Vercel usa SUPABASE_* sem prefixo; injeta no bundle
    define: {
      __SUPABASE_URL__: JSON.stringify(url),
      __SUPABASE_KEY__: JSON.stringify(key),
    },
  };
});
