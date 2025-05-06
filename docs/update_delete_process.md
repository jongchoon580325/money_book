# React 가계부 앱 - IndexedDB 연동 수정/삭제 기능 구현

이 문서는 React로 가계부 앱을 개발하면서 IndexedDB를 사용해 데이터를 영구적으로 저장하고, 특히 '수정' 기능에 중점을 둔 코드 로직을 설명합니다.

## 1. 프로젝트 구조

```
expense-tracker/
├── src/
│   ├── App.js
│   ├── components/
│   │   ├── ExpenseForm.js
│   │   ├── ExpenseList.js
│   │   └── ExpenseItem.js
│   ├── hooks/
│   │   └── useIndexedDB.js
│   └── utils/
│       └── indexedDBHelpers.js
├── public/
│   └── index.html
└── package.json
```

## 2. IndexedDB 설정 (indexedDBHelpers.js)

```javascript
// src/utils/indexedDBHelpers.js

const DB_NAME = 'expenseTrackerDB';
const DB_VERSION = 1;
const STORE_NAME = 'expenses';

// IndexedDB 초기화
export const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = (event) => {
      reject('IndexedDB 열기 실패: ' + event.target.errorCode);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // 기존 객체 저장소가 있다면 삭제
      if (db.objectStoreNames.contains(STORE_NAME)) {
        db.deleteObjectStore(STORE_NAME);
      }
      
      // 자동 증가 ID를 키로 사용하는 새 객체 저장소 생성
      const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      
      // 인덱스 생성
      objectStore.createIndex('date', 'date', { unique: false });
      objectStore.createIndex('category', 'category', { unique: false });
    };
    
    request.onsuccess = (event) => {
      resolve(event.target.result);
    };
  });
};

// 모든 지출 데이터 가져오기
export const getAllExpenses = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await initDB();
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.getAll();
      
      request.onsuccess = (event) => {
        resolve(event.target.result);
      };
      
      request.onerror = (event) => {
        reject('데이터 로드 실패: ' + event.target.errorCode);
      };
    } catch (error) {
      reject(error);
    }
  });
};

// 새 지출 추가
export const addExpense = (expense) => {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await initDB();
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.add(expense);
      
      request.onsuccess = (event) => {
        resolve({ ...expense, id: event.target.result });
      };
      
      request.onerror = (event) => {
        reject('데이터 추가 실패: ' + event.target.errorCode);
      };
    } catch (error) {
      reject(error);
    }
  });
};

// 지출 업데이트
export const updateExpense = (expense) => {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await initDB();
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.put(expense); // put은 해당 id가 있으면 업데이트, 없으면 추가함
      
      request.onsuccess = () => {
        resolve(expense);
      };
      
      request.onerror = (event) => {
        reject('데이터 업데이트 실패: ' + event.target.errorCode);
      };
      
      transaction.oncomplete = () => {
        console.log('업데이트 트랜잭션 완료');
      };
    } catch (error) {
      reject(error);
    }
  });
};

// 지출 삭제
export const deleteExpense = (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await initDB();
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.delete(id);
      
      request.onsuccess = () => {
        resolve(id);
      };
      
      request.onerror = (event) => {
        reject('데이터 삭제 실패: ' + event.target.errorCode);
      };
    } catch (error) {
      reject(error);
    }
  });
};

async function clearAllCategories(): Promise<void> {
  const db = await initDB();
  if (!db || !db.objectStoreNames.contains(STORE_NAME)) throw new Error('Database is not initialized');
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const objectStore = transaction.objectStore(STORE_NAME);
    const request = objectStore.clear();
    request.onsuccess = () => resolve();
    request.onerror = (event) => reject((event.target as IDBRequest).error);
  });
}

async function clearAllTransactions(): Promise<void> {
  const db = await initDB();
  if (!db || !db.objectStoreNames.contains(STORE_NAME)) throw new Error('Database is not initialized');
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const objectStore = transaction.objectStore(STORE_NAME);
    const request = objectStore.clear();
    request.onsuccess = () => resolve();
    request.onerror = (event) => reject((event.target as IDBRequest).error);
  });
}
```

## 3. 커스텀 훅 생성 (useIndexedDB.js)

```javascript
// src/hooks/useIndexedDB.js

import { useState, useEffect } from 'react';
import {
  initDB,
  getAllExpenses,
  addExpense,
  updateExpense,
  deleteExpense
} from '../utils/indexedDBHelpers';

const useIndexedDB = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 초기 데이터 로드
  useEffect(() => {
    const loadExpenses = async () => {
      try {
        await initDB();
        const data = await getAllExpenses();
        setExpenses(data);
        setLoading(false);
      } catch (err) {
        setError(err.message || '데이터 로드 중 오류가 발생했습니다.');
        setLoading(false);
      }
    };

    loadExpenses();
  }, []);

  // 새 지출 추가 함수
  const handleAddExpense = async (newExpense) => {
    try {
      const expenseWithId = await addExpense(newExpense);
      setExpenses((prevExpenses) => [...prevExpenses, expenseWithId]);
      return expenseWithId;
    } catch (err) {
      setError(err.message || '지출 추가 중 오류가 발생했습니다.');
      throw err;
    }
  };

  // 지출 수정 함수
  const handleUpdateExpense = async (updatedExpense) => {
    try {
      const result = await updateExpense(updatedExpense);
      setExpenses((prevExpenses) =>
        prevExpenses.map((expense) =>
          expense.id === updatedExpense.id ? updatedExpense : expense
        )
      );
      return result;
    } catch (err) {
      setError(err.message || '지출 업데이트 중 오류가 발생했습니다.');
      throw err;
    }
  };

  // 지출 삭제 함수
  const handleDeleteExpense = async (id) => {
    try {
      await deleteExpense(id);
      setExpenses((prevExpenses) =>
        prevExpenses.filter((expense) => expense.id !== id)
      );
      return id;
    } catch (err) {
      setError(err.message || '지출 삭제 중 오류가 발생했습니다.');
      throw err;
    }
  };

  return {
    expenses,
    loading,
    error,
    addExpense: handleAddExpense,
    updateExpense: handleUpdateExpense,
    deleteExpense: handleDeleteExpense,
  };
};

export default useIndexedDB;
```

## 4. 지출 입력 폼 컴포넌트 (ExpenseForm.js)

```javascript
// src/components/ExpenseForm.js

import React, { useState, useEffect } from 'react';

const ExpenseForm = ({ onSubmit, initialData = null, onCancel }) => {
  const [formData, setFormData] = useState({
    date: '',
    description: '',
    amount: '',
    category: '식비', // 기본 카테고리
  });

  // 수정 모드인 경우 초기 데이터 설정
  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        date: initialData.date.split('T')[0], // 날짜 형식 변환
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'amount' ? (value ? parseFloat(value) : '') : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // 데이터 유효성 검사
    if (!formData.date || !formData.description || !formData.amount) {
      alert('모든 필드를 입력해주세요.');
      return;
    }

    // 폼 제출
    onSubmit({
      ...formData,
      date: new Date(formData.date).toISOString(),
      amount: parseFloat(formData.amount),
    });

    // 입력 폼 초기화 (수정 모드가 아닌 경우)
    if (!initialData) {
      setFormData({
        date: '',
        description: '',
        amount: '',
        category: '식비',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="expense-form">
      <div className="form-group">
        <label htmlFor="date">날짜:</label>
        <input
          type="date"
          id="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="description">내용:</label>
        <input
          type="text"
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="amount">금액:</label>
        <input
          type="number"
          id="amount"
          name="amount"
          value={formData.amount}
          onChange={handleChange}
          min="0"
          step="100"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="category">카테고리:</label>
        <select
          id="category"
          name="category"
          value={formData.category}
          onChange={handleChange}
        >
          <option value="식비">식비</option>
          <option value="교통비">교통비</option>
          <option value="주거비">주거비</option>
          <option value="여가">여가</option>
          <option value="기타">기타</option>
        </select>
      </div>

      <div className="form-actions">
        <button type="submit">
          {initialData ? '업데이트' : '추가'}
        </button>
        {initialData && (
          <button type="button" onClick={onCancel}>
            취소
          </button>
        )}
      </div>
    </form>
  );
};

export default ExpenseForm;
```

## 5. 지출 항목 컴포넌트 (ExpenseItem.js)

```javascript
// src/components/ExpenseItem.js

import React from 'react';

const ExpenseItem = ({ expense, onEdit, onDelete }) => {
  // 날짜 형식화
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR');
  };

  // 금액 형식화 (천 단위 콤마)
  const formatAmount = (amount) => {
    return amount.toLocaleString('ko-KR') + '원';
  };

  return (
    <tr className="expense-item">
      <td>{formatDate(expense.date)}</td>
      <td>{expense.description}</td>
      <td>{formatAmount(expense.amount)}</td>
      <td>{expense.category}</td>
      <td>
        <button onClick={() => onEdit(expense)} className="edit-btn">
          수정
        </button>
        <button onClick={() => onDelete(expense.id)} className="delete-btn">
          삭제
        </button>
      </td>
    </tr>
  );
};

export default ExpenseItem;
```

## 6. 지출 목록 컴포넌트 (ExpenseList.js)

```javascript
// src/components/ExpenseList.js

import React, { useState } from 'react';
import ExpenseItem from './ExpenseItem';
import ExpenseForm from './ExpenseForm';

const ExpenseList = ({ expenses, onUpdateExpense, onDeleteExpense }) => {
  const [editingExpense, setEditingExpense] = useState(null);

  // 수정 모드 전환
  const handleEdit = (expense) => {
    setEditingExpense(expense);
  };

  // 수정 취소
  const handleCancelEdit = () => {
    setEditingExpense(null);
  };

  // 지출 업데이트
  const handleUpdate = (updatedExpense) => {
    onUpdateExpense(updatedExpense);
    setEditingExpense(null); // 수정 모드 종료
  };

  // 날짜별로 내림차순 정렬
  const sortedExpenses = [...expenses].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  // 월별 합계 계산
  const calculateMonthlyTotal = () => {
    const monthlyTotals = {};
    
    expenses.forEach(expense => {
      const date = new Date(expense.date);
      const monthYear = `${date.getFullYear()}-${date.getMonth() + 1}`;
      
      if (!monthlyTotals[monthYear]) {
        monthlyTotals[monthYear] = 0;
      }
      
      monthlyTotals[monthYear] += expense.amount;
    });
    
    return monthlyTotals;
  };
  
  const monthlyTotals = calculateMonthlyTotal();

  return (
    <div className="expense-list-container">
      {editingExpense ? (
        <div className="edit-form-container">
          <h3>지출 수정</h3>
          <ExpenseForm
            initialData={editingExpense}
            onSubmit={handleUpdate}
            onCancel={handleCancelEdit}
          />
        </div>
      ) : null}

      <h2>지출 내역</h2>
      
      {/* 월별 요약 */}
      <div className="monthly-summary">
        <h3>월별 합계</h3>
        <ul>
          {Object.entries(monthlyTotals).map(([month, total]) => (
            <li key={month}>
              {month}: {total.toLocaleString('ko-KR')}원
            </li>
          ))}
        </ul>
      </div>

      {expenses.length === 0 ? (
        <p>등록된 지출 내역이 없습니다.</p>
      ) : (
        <table className="expense-table">
          <thead>
            <tr>
              <th>날짜</th>
              <th>내용</th>
              <th>금액</th>
              <th>카테고리</th>
              <th>작업</th>
            </tr>
          </thead>
          <tbody>
            {sortedExpenses.map((expense) => (
              <ExpenseItem
                key={expense.id}
                expense={expense}
                onEdit={handleEdit}
                onDelete={onDeleteExpense}
              />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ExpenseList;
```

## 7. 메인 앱 컴포넌트 (App.js)

```javascript
// src/App.js

import React, { useState } from 'react';
import ExpenseForm from './components/ExpenseForm';
import ExpenseList from './components/ExpenseList';
import useIndexedDB from './hooks/useIndexedDB';
import './App.css';

function App() {
  const {
    expenses,
    loading,
    error,
    addExpense,
    updateExpense,
    deleteExpense
  } = useIndexedDB();

  // 새 지출 추가 처리
  const handleAddExpense = async (newExpense) => {
    try {
      await addExpense(newExpense);
    } catch (err) {
      console.error('지출 추가 실패:', err);
      alert('지출 추가에 실패했습니다: ' + err.message);
    }
  };

  // 지출 업데이트 처리
  const handleUpdateExpense = async (updatedExpense) => {
    try {
      await updateExpense(updatedExpense);
    } catch (err) {
      console.error('지출 업데이트 실패:', err);
      alert('지출 업데이트에 실패했습니다: ' + err.message);
    }
  };

  // 지출 삭제 처리
  const handleDeleteExpense = async (id) => {
    if (window.confirm('이 지출 항목을 삭제하시겠습니까?')) {
      try {
        await deleteExpense(id);
      } catch (err) {
        console.error('지출 삭제 실패:', err);
        alert('지출 삭제에 실패했습니다: ' + err.message);
      }
    }
  };

  if (loading) {
    return <div className="loading">데이터를 불러오는 중...</div>;
  }

  if (error) {
    return <div className="error">오류 발생: {error}</div>;
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>가계부 앱</h1>
      </header>

      <main className="app-main">
        <section className="form-section">
          <h2>새 지출 추가</h2>
          <ExpenseForm onSubmit={handleAddExpense} />
        </section>

        <section className="list-section">
          <ExpenseList
            expenses={expenses}
            onUpdateExpense={handleUpdateExpense}
            onDeleteExpense={handleDeleteExpense}
          />
        </section>
      </main>
    </div>
  );
}

export default App;
```

## 8. 간단한 스타일링 (App.css)

```css
/* src/App.css */

/* 기본 스타일 */
body {
  font-family: 'Noto Sans KR', sans-serif;
  line-height: 1.6;
  margin: 0;
  padding: 0;
  background-color: #f7f7f7;
  color: #333;
}

.app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.app-header {
  text-align: center;
  margin-bottom: 30px;
}

.app-main {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 30px;
}

@media (max-width: 768px) {
  .app-main {
    grid-template-columns: 1fr;
  }
}

/* 폼 스타일 */
.form-section {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

.form-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

button {
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  background-color: #4CAF50;
  color: white;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
}

button:hover {
  background-color: #45a049;
}

button.delete-btn {
  background-color: #f44336;
}

button.delete-btn:hover {
  background-color: #d32f2f;
}

button.edit-btn {
  background-color: #2196F3;
}

button.edit-btn:hover {
  background-color: #0b7dda;
}

/* 목록 스타일 */
.list-section {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.expense-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

.expense-table th,
.expense-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.expense-table th {
  background-color: #f2f2f2;
  font-weight: bold;
}

.expense-table tr:hover {
  background-color: #f9f9f9;
}

/* 수정 폼 스타일 */
.edit-form-container {
  background-color: #f0f8ff;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  border-left: 4px solid #2196F3;
}

/* 로딩 및 에러 메시지 */
.loading, .error {
  text-align: center;
  padding: 20px;
  font-size: 18px;
}

.error {
  color: #f44336;
}

/* 월별 요약 */
.monthly-summary {
  margin-top: 20px;
  padding: 15px;
  background-color: #e8f5e9;
  border-radius: 8px;
}

.monthly-summary ul {
  list-style-type: none;
  padding: 0;
}

.monthly-summary li {
  padding: 5px 0;
  border-bottom: 1px dashed #aaa;
}
```

## 9. 사용 방법

1. React 프로젝트를 생성합니다:
   ```bash
   npx create-react-app expense-tracker
   cd expense-tracker
   ```

2. 위의 코드 파일들을 적절한 위치에 저장합니다.

3. 앱을 실행합니다:
   ```bash
   npm start
   ```

## 10. 주요 기능 설명

1. **IndexedDB 설정**:
   - 브라우저의 IndexedDB를 사용하여 데이터를 로컬에 영구 저장
   - DB 초기화, 데이터 추가, 조회, 수정, 삭제 기능 구현

2. **데이터 수정 흐름**:
   1. 사용자가 지출 항목의 '수정' 버튼을 클릭
   2. 해당 항목의 데이터가 수정 폼에 로드됨
   3. 사용자가 데이터를 수정하고 '업데이트' 버튼을 클릭
   4. 업데이트된 데이터가 IndexedDB에 저장됨
   5. UI가 자동으로 업데이트되어 수정된 데이터 표시
   6. 페이지를 새로고침해도 수정된 데이터가 유지됨

3. **사용자 인터페이스**:
   - 입력 폼과 목록이 나란히 표시되는 직관적인 레이아웃
   - 월별 합계를 요약하여 상단에 표시
   - 테이블 형식의 지출 목록으로 쉽게 조회 가능

4. **반응형 디자인**:
   - 모바일과 데스크톱 환경 모두에서 사용하기 좋은 디자인

## 11. 확장 가능성

1. **카테고리 관리**: 사용자 정의 카테고리 추가/수정/삭제 기능
2. **데이터 시각화**: 차트를 통한 지출 분석 추가
3. **데이터 내보내기/가져오기**: CSV 또는 JSON 형식으로 데이터 백업/복원
4. **테마 설정**: 다크 모드 등 사용자 정의 테마 지원
5. **필터링 및 검색**: 날짜 범위, 카테고리, 금액 등으로 필터링 기능

이 코드를 기반으로 IndexedDB를 활용한 데이터 영구 저장 기능이 있는 React 가계부 앱을 구현할 수 있습니다.
