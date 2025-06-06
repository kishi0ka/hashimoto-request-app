import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc,
  doc, 
  updateDoc, 
  query, 
  orderBy, 
  where,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { RequestItem, TaskType, User } from '@/types';

const REQUESTS_COLLECTION = 'hashimoto-requests';
const TASK_TYPES_COLLECTION = 'hashimoto-task-types';

// 依頼関連の関数
export const createRequest = async (requestData: Omit<RequestItem, 'id' | 'createdAt' | 'updatedAt' | 'estimatedMinutes'>) => {
  // TaskTypeを取得して想定時間を計算
  const taskType = await getTaskTypeById(requestData.taskTypeId);
  const estimatedMinutes = taskType ? taskType.estimatedTimePerUnit * requestData.quantity : 0;
  
  const docData = {
    ...requestData,
    dueDate: Timestamp.fromDate(requestData.dueDate),
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    estimatedMinutes,
  };

  const docRef = await addDoc(collection(db, REQUESTS_COLLECTION), docData);
  return docRef.id;
};

export const getRequests = async (): Promise<RequestItem[]> => {
  const q = query(collection(db, REQUESTS_COLLECTION), orderBy('dueDate', 'asc'));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    dueDate: doc.data().dueDate.toDate(),
    createdAt: doc.data().createdAt.toDate(),
    updatedAt: doc.data().updatedAt.toDate(),
  } as RequestItem));
};

export const updateRequestStatus = async (id: string, status: 'pending' | 'completed') => {
  const docRef = doc(db, REQUESTS_COLLECTION, id);
  await updateDoc(docRef, {
    status,
    updatedAt: Timestamp.now(),
  });
};

export const updateRequest = async (id: string, updateData: Partial<RequestItem>) => {
  const docRef = doc(db, REQUESTS_COLLECTION, id);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updatePayload: any = {
    ...updateData,
    updatedAt: Timestamp.now(),
  };

  // 数量またはタスクタイプが変更された場合、想定時間を再計算
  if (updateData.quantity || updateData.taskTypeId) {
    const taskType = await getTaskTypeById(updateData.taskTypeId || '');
    if (taskType && updateData.quantity) {
      updatePayload.estimatedMinutes = taskType.estimatedTimePerUnit * updateData.quantity;
    }
  }

  if (updateData.dueDate) {
    updatePayload.dueDate = Timestamp.fromDate(updateData.dueDate);
  }

  await updateDoc(docRef, updatePayload);
};

export const getPendingRequests = async (): Promise<RequestItem[]> => {
  const q = query(
    collection(db, REQUESTS_COLLECTION), 
    where('status', '==', 'pending'),
    orderBy('dueDate', 'asc')
  );
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    dueDate: doc.data().dueDate.toDate(),
    createdAt: doc.data().createdAt.toDate(),
    updatedAt: doc.data().updatedAt.toDate(),
  } as RequestItem));
};

// タスクタイプ関連の関数
export const getTaskTypes = async (): Promise<TaskType[]> => {
  try {
    console.log('🔍 タスクタイプコレクションにアクセス中:', TASK_TYPES_COLLECTION);
    
    // まず全てのドキュメントを取得してからフィルタリング（インデックス問題を回避）
    const querySnapshot = await getDocs(collection(db, TASK_TYPES_COLLECTION));
    
    console.log(`📊 取得したドキュメント数: ${querySnapshot.size}`);
    
    const allTaskTypes = querySnapshot.docs.map(doc => {
      const data = doc.data();
      console.log('📄 ドキュメントデータ:', doc.id, data);
      
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      } as TaskType;
    });
    
    // isActiveがtrueのもののみフィルタリング
    const activeTaskTypes = allTaskTypes.filter(taskType => taskType.isActive);
    
    // 名前でソート
    const sortedTaskTypes = activeTaskTypes.sort((a, b) => a.name.localeCompare(b.name));
    
    console.log(`✅ アクティブなタスクタイプ: ${sortedTaskTypes.length}件`);
    
    return sortedTaskTypes;
  } catch (error) {
    console.error('❌ タスクタイプ取得エラー:', error);
    throw error;
  }
};

export const getTaskTypeById = async (id: string): Promise<TaskType | null> => {
  try {
    const docRef = doc(db, TASK_TYPES_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    return {
      id: docSnap.id,
      ...docSnap.data(),
      createdAt: docSnap.data()!.createdAt.toDate(),
      updatedAt: docSnap.data()!.updatedAt.toDate(),
    } as TaskType;
  } catch (error) {
    console.error('タスクタイプ取得エラー:', error);
    return null;
  }
};

export const createTaskType = async (taskTypeData: Omit<TaskType, 'id' | 'createdAt' | 'updatedAt'>) => {
  const docData = {
    ...taskTypeData,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  const docRef = await addDoc(collection(db, TASK_TYPES_COLLECTION), docData);
  return docRef.id;
};

export const updateTaskType = async (id: string, updateData: Partial<Omit<TaskType, 'id' | 'createdAt' | 'updatedAt'>>) => {
  try {
    const docRef = doc(db, TASK_TYPES_COLLECTION, id);
    const updatePayload = {
      ...updateData,
      updatedAt: Timestamp.now(),
    };

    await updateDoc(docRef, updatePayload);
    console.log(`✅ タスクタイプ ${id} を更新しました`);
  } catch (error) {
    console.error('❌ タスクタイプ更新エラー:', error);
    throw error;
  }
};

// ユーザー関連の関数
export const getUsers = async (): Promise<User[]> => {
  try {
    // 'user' コレクションを試す
    let q = query(collection(db, 'user'), orderBy('name', 'asc'));
    let querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('userコレクションが空です。usersコレクションを試します...');
      // 'users' コレクション（複数形）を試す
      q = query(collection(db, 'users'), orderBy('name', 'asc'));
      querySnapshot = await getDocs(q);
    }
    
    console.log(`${querySnapshot.size}件のユーザーデータを取得しました`);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate(),
    } as User));
  } catch (error) {
    console.error('Firebase接続エラー:', error);
    throw error;
  }
}; 