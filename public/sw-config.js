// Service Worker Configuration
// このファイルはPWAの動作を制御します

// Service Workerの更新チェック間隔を設定（ミリ秒）
const SW_UPDATE_INTERVAL = 60 * 60 * 1000; // 1時間

// Service Workerの登録時に更新チェック間隔を設定
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.ready.then(registration => {
    // 定期的な更新チェックを設定
    setInterval(() => {
      registration.update();
    }, SW_UPDATE_INTERVAL);
    
    // ページフォーカス時の更新チェックを無効化（ちらつき防止）
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        // 即座の更新チェックは行わない
        return;
      }
    });
  });
}