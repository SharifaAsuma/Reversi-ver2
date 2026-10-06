// PostCSS の設定ファイル
// CSSをビルド時に変換するためのプラグインを指定する
export default {
  plugins: {
    // TailwindのユーティリティクラスをCSSに変換するプラグイン
    tailwindcss: {},
    // ベンダープレフィックス(-webkit- など)を自動で付与するプラグイン
    autoprefixer: {},
  },
};
