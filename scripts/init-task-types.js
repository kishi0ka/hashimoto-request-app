const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDocs, query, where } = require('firebase/firestore');

// Firebase設定（環境変数から取得）
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Firebase初期化
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// デフォルトのタスクタイプ
const defaultTaskTypes = [
  {
    name: '鉄製のれん掛けの検品',
    estimatedTimePerUnit: 0.5, // 30秒 = 0.5分
    unit: '個',
    isActive: true,
  },
  {
    name: 'Pバナーアタッチメントパイプの検品',
    estimatedTimePerUnit: 0.17, // 10秒 ≈ 0.17分
    unit: '個',
    isActive: true,
  },
];

async function initTaskTypes() {
  try {
    console.log('🚀 タスクタイプの初期化を開始します...');
    
    // 既存のタスクタイプをチェック
    const existingQuery = query(
      collection(db, 'hashimoto-task-types'),
      where('isActive', '==', true)
    );
    const existingSnapshot = await getDocs(existingQuery);
    
    if (!existingSnapshot.empty) {
      console.log('✅ タスクタイプは既に存在します。');
      console.log(`   既存のタスクタイプ数: ${existingSnapshot.size}件`);
      return;
    }
    
    // デフォルトタスクタイプを追加
    console.log('📝 デフォルトタスクタイプを追加中...');
    
    for (const taskType of defaultTaskTypes) {
      const docData = {
        ...taskType,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const docRef = await addDoc(collection(db, 'hashimoto-task-types'), docData);
      console.log(`   ✅ ${taskType.name} を追加しました (ID: ${docRef.id})`);
    }
    
    console.log('🎉 タスクタイプの初期化が完了しました！');
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    process.exit(1);
  }
}

// スクリプト実行
initTaskTypes().then(() => {
  console.log('✨ 処理が完了しました。');
  process.exit(0);
}); 