import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react'; // ReactのJSX変換やHMR(高速リロード)を有効にするViteプラグイン
import { fileURLToPath, URL } from 'node:url'; // パスのエイリアス設定で使うURL変換ユーティリティ

// Vite(開発サーバー・ビルドツール)の設定ファイル
// https://vitejs.dev/config/
export default defineConfig({
  // 使用するプラグイン一覧(ここではReact対応プラグインのみ)
  plugins: [react()],
  resolve: {
    alias: {
      // "@/xxx" という書き方で "./src/xxx" を参照できるようにするエイリアス設定
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  optimizeDeps: {
    // lucide-react を事前バンドルの対象から除外する設定
    exclude: ['lucide-react'],
  },
});
