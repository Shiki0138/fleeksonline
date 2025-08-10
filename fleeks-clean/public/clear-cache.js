// Service Worker キャッシュクリアスクリプト
(function() {
  'use strict';

  console.log('🔄 Service Worker キャッシュクリア開始...');

  // Service Worker が利用可能かチェック
  if ('serviceWorker' in navigator) {
    // 全ての Service Worker を取得
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
      if (registrations.length === 0) {
        console.log('ℹ️ Service Worker は登録されていません');
        return;
      }

      console.log(`🔍 ${registrations.length}個のService Workerを発見`);

      // 各 Service Worker を削除
      registrations.forEach(function(registration, index) {
        console.log(`🗑️ Service Worker ${index + 1}を削除中...`);
        registration.unregister().then(function(success) {
          if (success) {
            console.log(`✅ Service Worker ${index + 1}削除成功`);
          } else {
            console.log(`❌ Service Worker ${index + 1}削除失敗`);
          }
        });
      });
    });

    // キャッシュも削除
    if ('caches' in window) {
      caches.keys().then(function(cacheNames) {
        if (cacheNames.length === 0) {
          console.log('ℹ️ キャッシュは存在しません');
          return;
        }

        console.log(`🔍 ${cacheNames.length}個のキャッシュを発見`);

        return Promise.all(
          cacheNames.map(function(cacheName) {
            console.log(`🗑️ キャッシュ "${cacheName}" を削除中...`);
            return caches.delete(cacheName).then(function(success) {
              if (success) {
                console.log(`✅ キャッシュ "${cacheName}" 削除成功`);
              } else {
                console.log(`❌ キャッシュ "${cacheName}" 削除失敗`);
              }
            });
          })
        );
      }).then(function() {
        console.log('🎉 全キャッシュクリア完了！');
        console.log('🔄 ページを再読み込みしています...');
        
        // 3秒後にページリロード
        setTimeout(function() {
          window.location.reload(true);
        }, 3000);
      });
    }
  } else {
    console.log('ℹ️ このブラウザはService Workerをサポートしていません');
  }

  // LocalStorageもクリア
  try {
    localStorage.clear();
    console.log('✅ LocalStorage クリア完了');
  } catch(e) {
    console.log('❌ LocalStorage クリア失敗:', e);
  }

  // SessionStorageもクリア  
  try {
    sessionStorage.clear();
    console.log('✅ SessionStorage クリア完了');
  } catch(e) {
    console.log('❌ SessionStorage クリア失敗:', e);
  }

})();