import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

// [IMP-12] IMPORTANT: tailwindcss() MUST come BEFORE react().
// If reversed, Tailwind v4's PostCSS transform runs after React's JSX
// transform and silently produces an empty stylesheet in production.
// This is a non-obvious trap — the dev server may appear to work fine
// but the production build will have no styles.
export default defineConfig({
  plugins: [
    tailwindcss(), // ← first
    react(),       // ← second
  ],
})
