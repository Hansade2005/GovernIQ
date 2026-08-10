import { createClient } from '@pipilot/client'

const anonKey = import.meta.env.VITE_PIPILOT_ANON_KEY

// null until a PiPilot BaaS backend is provisioned (baas_provision) and the anon key is wired
// into .env as VITE_PIPILOT_ANON_KEY — NEVER call createClient() with an empty key, it throws.
export const pp = anonKey ? createClient(anonKey) : null
