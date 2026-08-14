// 메디백 Vite 설정.
// 추가 동작:
//   1) 빌드마다 timestamp 기반 BUILD_VERSION을 생성
//   2) dist/version.json에 그 값을 적어둠 (런타임에 서버 측 버전 확인용)
//   3) JS 번들에 __BUILD_VERSION__ 글로벌로 박아넣음 (런타임에 클라이언트 측 버전 확인용)
// 둘이 다르면 App.jsx가 UpdateBanner를 띄움.
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { writeFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

const BUILD_VERSION = Date.now().toString()

function versionPlugin() {
  return {
    name: 'medbag-version',
    apply: 'build',
    closeBundle() {
      const distDir = resolve(__dirname, 'dist')
      mkdirSync(distDir, { recursive: true })
      writeFileSync(resolve(distDir, 'version.json'), JSON.stringify({ version: BUILD_VERSION }))
    },
  }
}

export default defineConfig({
  plugins: [react(), versionPlugin()],
  define: {
    __BUILD_VERSION__: JSON.stringify(BUILD_VERSION),
  },
})
