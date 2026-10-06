import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx'; // ゲーム本体のコンポーネント
import './index.css'; // Tailwindのベーススタイルとカスタムアニメーションを読み込む

// index.html内の <div id="root"></div> を取得し、
// そこにReactアプリ全体をマウント(描画)するためのルートを作成する
createRoot(document.getElementById('root')).render(
  // StrictMode: 開発時にのみ有効な検査モード。
  // 非推奨な書き方やバグになりやすい処理を警告してくれる(本番ビルドには影響しない)
  <StrictMode>
    <App />
  </StrictMode>
);
