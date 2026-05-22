import { createClient } from "@supabase/supabase-js";

// Safe fallback credentials directly from our environment configuration to prevent initial crashes
const fallbackUrl = "https://uopebbeywagytdriclko.supabase.co";
const fallbackKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvcGViYmV5d2FneXRkcmljbGtvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0Mjk0MDIsImV4cCI6MjA5NTAwNTQwMn0.fpbJSSi1j2ONgpbhR5QCFeyHZdl9Ft21Ue5zq27CfKk";

const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

// Check if a URL is a valid HTTP or HTTPS URL
const isValidUrl = (url: any): boolean => {
  if (typeof url !== "string") return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch (_) {
    return false;
  }
};

const supabaseUrl = isValidUrl(envUrl) ? envUrl : fallbackUrl;
const supabaseAnonKey = (envKey && typeof envKey === "string" && envKey.trim() !== "" && envKey !== "YOUR_SUPABASE_ANON_KEY") 
  ? envKey 
  : fallbackKey;

if (supabaseUrl === fallbackUrl) {
  console.warn("Using fallback Supabase URL because VITE_SUPABASE_URL was empty or invalid.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

