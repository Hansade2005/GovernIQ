import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

// Injects the PiPilot live-preview bridge into the DEV-served HTML only (apply: 'serve',
// so it's NEVER in the production `vite build` output). This powers the builder's preview
// tools (inspect/click/fill/screenshot/console) — essential in the cloud sandbox, which has
// no other way to inject it. The script self-noops on deployed pages (parent === self) and
// is idempotent. Do not remove this plugin — without it the live-preview tools time out.
const pipilotPreviewBridge = () => ({
  name: 'pipilot-preview-bridge',
  apply: 'serve',
  transformIndexHtml: (html) =>
    html.includes('pipilot-bridge.js') ? html
      : html.replace('</head>', '    <script src="https://cdn.jsdelivr.net/gh/Hansade2005/pipilot-bridge@main/pipilot-bridge.js"></script>\n  </head>'),
})

export default defineConfig({
  plugins: [react(), tailwindcss(), pipilotPreviewBridge()],
  // '@' → /src so imports like `@/components/Button` resolve.
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: { host: true },
})
