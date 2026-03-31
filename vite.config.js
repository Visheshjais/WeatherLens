import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// SWC-based React plugin works correctly with both Vite 5 and Vite 8
// and avoids the "jsx / esbuild deprecated" warnings from the Babel plugin
export default defineConfig({
  plugins: [react()],
})
