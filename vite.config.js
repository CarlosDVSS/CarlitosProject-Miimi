import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Supabase → Vercel sync usa NEXT_PUBLIC_; local usa VITE_
  envPrefix: ["VITE_", "NEXT_PUBLIC_"],
});
