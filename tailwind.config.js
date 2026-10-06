/** @type {import('tailwindcss').Config} */
// Tailwind CSS の設定ファイル
export default {
  // Tailwindがクラス名を検出しにスキャンする対象ファイル
  // ここに書かれていないファイルはCSSが反映されない(未使用クラスとして削除される)
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    // デフォルトのテーマ(色・余白・フォントなど)を拡張したい場合はここに追記する
    extend: {},
  },
  // Tailwindの公式/サードパーティプラグインを追加する場所(現在は未使用)
  plugins: [],
};
