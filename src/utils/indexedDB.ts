import { Category } from '@/types/category';
import { Transaction } from '@/types/transaction';

const DB_VERSION = 9; // 버전 업데이트
const DB_NAME = 'moneyBookDB';
const STORES = {
  CATEGORIES: 'categories',
  TRANSACTIONS: 'transactions'
} as const;

interface CategoryWithCompositeKey extends Category {
  compositeKey?: string;
}

class CategoryDB {
  private db: IDBDatabase | null = null;
  private readonly dbName = DB_NAME;
  private readonly storeName = STORES.CATEGORIES;
  private readonly version = DB_VERSION;
  private connecting: Promise<void> | null = null;
  private isInitialized = false;

  private generateCompositeKey(category: Category): string {
    const key = `${category.type}|${category.section.trim()}|${category.category.trim()}|${category.subcategory.trim()}`.toLowerCase();
    return key;
  }

  private isSameCategory(cat1: Category, cat2: Category): boolean {
    return (
      cat1.type === cat2.type &&
      cat1.section.trim().toLowerCase() === cat2.section.trim().toLowerCase() &&
      cat1.category.trim().toLowerCase() === cat2.category.trim().toLowerCase() &&
      cat1.subcategory.trim().toLowerCase() === cat2.subcategory.trim().toLowerCase()
    );
  }

  async connect(): Promise<void> {
    if (this.connecting) {
      return this.connecting;
    }

    if (this.db && this.isInitialized) {
      // object store가 삭제된 경우 강제 재생성
      if (!this.db.objectStoreNames.contains(this.storeName)) {
        this.db.close();
        this.isInitialized = false;
        this.db = null;
        // 버전 강제 증가
        const newVersion = this.version + 1;
        const request = indexedDB.open(this.dbName, newVersion);
        request.onupgradeneeded = async (event: IDBVersionChangeEvent) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(this.storeName)) {
            db.createObjectStore(this.storeName, { keyPath: 'id' });
          }
        };
        await new Promise((resolve, reject) => {
          request.onsuccess = () => resolve(undefined);
          request.onerror = () => reject(request.error);
        });
        this.isInitialized = false;
        this.db = null;
      } else {
        return Promise.resolve();
      }
    }

    this.connecting = new Promise((resolve, reject) => {
      try {
        const request = indexedDB.open(this.dbName, this.version);

        request.onerror = (event) => {
          const error = (event.target as IDBOpenDBRequest).error;
          console.error('IndexedDB connection failed:', error?.message || event);
          this.connecting = null;
          this.isInitialized = false;
          reject(new Error(`Failed to connect to IndexedDB: ${error?.message || 'Unknown error'}`));
        };

        request.onsuccess = (event) => {
          this.db = (event.target as IDBOpenDBRequest).result;
          this.connecting = null;
          this.isInitialized = true;
          
          this.db.onerror = (event) => {
            const target = event.target as IDBRequest;
            console.error('Database error:', target.error);
          };
          
          resolve();
        };

        request.onupgradeneeded = async (event: IDBVersionChangeEvent) => {
          const db = (event.target as IDBOpenDBRequest).result;
          const oldVersion = event.oldVersion;
          
          // 기존 데이터 백업
          let existingCategories: Category[] = [];
          let existingTransactions: Transaction[] = [];

          // 카테고리 데이터 백업
          if (oldVersion > 0 && db.objectStoreNames.contains(STORES.CATEGORIES)) {
            const transaction = (event.target as IDBOpenDBRequest).transaction;
            if (transaction) {
              const store = transaction.objectStore(STORES.CATEGORIES);
              existingCategories = await new Promise((resolve) => {
                const request = store.getAll();
                request.onsuccess = () => resolve(request.result || []);
                request.onerror = () => resolve([]);
              });
            }
            db.deleteObjectStore(STORES.CATEGORIES);
          }

          // 거래내역 데이터 백업
          if (oldVersion > 0 && db.objectStoreNames.contains(STORES.TRANSACTIONS)) {
            const transaction = (event.target as IDBOpenDBRequest).transaction;
            if (transaction) {
              const store = transaction.objectStore(STORES.TRANSACTIONS);
              existingTransactions = await new Promise((resolve) => {
                const request = store.getAll();
                request.onsuccess = () => resolve(request.result || []);
                request.onerror = () => resolve([]);
              });
            }
            db.deleteObjectStore(STORES.TRANSACTIONS);
          }

          // 카테고리 스토어 생성
          const categoryStore = db.createObjectStore(STORES.CATEGORIES, { keyPath: 'id' });
          categoryStore.createIndex('type', 'type', { unique: false });
          categoryStore.createIndex('order', 'order', { unique: false });
          console.log('Category store created successfully');

          // 거래내역 스토어 생성
          const transactionStore = db.createObjectStore(STORES.TRANSACTIONS, { keyPath: 'id' });
          transactionStore.createIndex('date', 'date', { unique: false });
          transactionStore.createIndex('type', 'type', { unique: false });
          console.log('Transaction store created successfully');

          // 카테고리 데이터 복원
          if (existingCategories.length > 0) {
            const uniqueCategories = existingCategories.reduce((acc: Category[], curr) => {
              const isDuplicate = acc.some(cat => this.isSameCategory(cat, curr));
              if (!isDuplicate) {
                acc.push(curr);
              }
              return acc;
            }, []);

            uniqueCategories.forEach((category, index) => {
              const categoryWithOrder = {
                ...category,
                order: index
              };
              categoryStore.add(categoryWithOrder);
            });
          }

          // 거래내역 데이터 복원
          if (existingTransactions.length > 0) {
            existingTransactions.forEach(transaction => {
              transactionStore.add(transaction);
            });
          }
        };
      } catch (error) {
        console.error('Error during IndexedDB connection:', error);
        this.connecting = null;
        this.isInitialized = false;
        reject(error);
      }
    });

    return this.connecting;
  }

  async addCategory(category: Category): Promise<void> {
    try {
      await this.ensureConnection();
      
      if (!this.db || !this.isInitialized) {
        throw new Error('Database is not initialized');
      }

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);

        transaction.onerror = (event) => {
          const error = (event.target as IDBTransaction).error;
          console.error('Transaction failed:', error?.message || event);
          reject(new Error(`Transaction failed: ${error?.message || 'Unknown error'}`));
        };

        const getAllRequest = store.getAll();
        
        getAllRequest.onsuccess = () => {
          const categories = getAllRequest.result || [];
          const maxOrder = categories.reduce((max, cat) => 
            Math.max(max, typeof cat.order === 'number' ? cat.order : -1), -1);

          const newCategory = {
            ...category,
            id: crypto.randomUUID(),
            order: maxOrder + 1,
            section: category.section.trim(),
            category: category.category.trim(),
            subcategory: category.subcategory.trim()
          };

          try {
            const addRequest = store.add(newCategory);
            
            addRequest.onsuccess = () => {
              console.log('Category added successfully:', {
                type: newCategory.type,
                section: newCategory.section,
                category: newCategory.category,
                subcategory: newCategory.subcategory,
                order: newCategory.order
              });
              resolve();
            };
            
            addRequest.onerror = (event) => {
              const error = (event.target as IDBRequest).error;
              console.error('Failed to add category:', error?.message || event);
              reject(new Error(`Failed to add category: ${error?.message || 'Unknown error'}`));
            };
          } catch (error) {
            console.error('Error during add request:', error);
            reject(error);
          }
        };

        getAllRequest.onerror = (event) => {
          const error = (event.target as IDBRequest).error;
          console.error('Failed to get categories:', error?.message || event);
          reject(new Error(`Failed to get categories: ${error?.message || 'Unknown error'}`));
        };
      });
    } catch (error) {
      console.error('Error during category addition:', error);
      throw error;
    }
  }

  async updateCategory(category: CategoryWithCompositeKey): Promise<void> {
    try {
      await this.ensureConnection();
      
      return new Promise((resolve, reject) => {
        if (!this.db || !this.isInitialized) {
          reject(new Error('Database is not initialized'));
          return;
        }

        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        
        const updatedCategory = {
          ...category,
          section: category.section.trim(),
          category: category.category.trim(),
          subcategory: category.subcategory.trim(),
          compositeKey: this.generateCompositeKey(category)
        };

        const request = store.put(updatedCategory);
        
        request.onsuccess = () => {
          resolve();
        };
        
        request.onerror = (event) => {
          const error = (event.target as IDBRequest).error;
          if (error?.name === 'ConstraintError') {
            reject(new Error('이미 존재하는 카테고리입니다.'));
          } else {
            console.error('Failed to update category:', error?.message || event);
            reject(new Error(`Failed to update category: ${error?.message || 'Unknown error'}`));
          }
        };
      });
    } catch (error) {
      console.error('Error during category update:', error);
      throw error;
    }
  }

  async deleteCategory(id: string): Promise<void> {
    await this.ensureConnection();
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error('카테고리 삭제 실패'));
      } catch (error) {
        reject(error);
      }
    });
  }

  async getAllCategories(): Promise<Category[]> {
    try {
      await this.ensureConnection();
      
      return new Promise((resolve, reject) => {
        if (!this.db || !this.isInitialized) {
          reject(new Error('Database is not initialized'));
          return;
        }

        const transaction = this.db.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.index('order').getAll();

        request.onsuccess = () => {
          const categories = request.result || [];
          // order가 없는 경우 인덱스를 order로 사용하고 정렬
          const sortedCategories = categories
            .map((cat, index) => ({
              ...cat,
              order: typeof cat.order === 'number' ? cat.order : index
            }))
            .sort((a, b) => a.order - b.order);
          
          console.log('Retrieved categories successfully:', sortedCategories.length);
          resolve(sortedCategories);
        };

        request.onerror = (event) => {
          console.error('Failed to get categories:', event);
          reject(new Error('Failed to get categories'));
        };
        
        transaction.onerror = (event) => {
          console.error('Transaction failed:', event);
          reject(new Error('Transaction failed'));
        };
      });
    } catch (error) {
      console.error('Error during categories retrieval:', error);
      throw error;
    }
  }

  async replaceAllCategories(categories: Category[]): Promise<void> {
    try {
      await this.ensureConnection();
      
      if (!this.db || !this.isInitialized) {
        throw new Error('Database is not initialized');
      }

      return new Promise((resolve, reject) => {
        try {
          const transaction = this.db!.transaction([this.storeName], 'readwrite');
          const store = transaction.objectStore(this.storeName);

          // 트랜잭션 완료 이벤트 핸들러
          transaction.oncomplete = () => {
            console.log('Transaction completed successfully');
            resolve();
          };

          // 트랜잭션 에러 핸들러
          transaction.onerror = (event) => {
            const error = (event.target as IDBTransaction).error;
            console.error('Transaction failed:', error?.message || event);
            reject(new Error(`Transaction failed: ${error?.message || 'Unknown error'}`));
          };

          // 기존 데이터 모두 삭제 (clear) 후, 완료되면 추가
          const clearRequest = store.clear();
          clearRequest.onsuccess = () => {
            console.log('Successfully cleared existing categories');
            // 정렬된 순서로 추가
            const sortedCategories = categories
              .map((category) => ({
                ...category,
                id: crypto.randomUUID(),
                section: category.section.trim(),
                category: category.category.trim(),
                subcategory: category.subcategory?.trim() || ''
              }))
              .sort((a, b) => {
                // 유형 우선 정렬 (수입이 먼저)
                if (a.type !== b.type) {
                  return a.type === 'income' ? -1 : 1;
                }
                // 관 기준 정렬
                if (a.section !== b.section) {
                  return a.section.localeCompare(b.section);
                }
                // 항 기준 정렬
                if (a.category !== b.category) {
                  return a.category.localeCompare(b.category);
                }
                // 목 기준 정렬
                return (a.subcategory || '').localeCompare(b.subcategory || '');
              });

            // order 값 부여 및 동기적으로 add
            for (let index = 0; index < sortedCategories.length; index++) {
              store.add({ ...sortedCategories[index], order: index });
            }

            console.log(`Added ${sortedCategories.length} categories for import`);
          };
          clearRequest.onerror = (event) => {
            const error = (event.target as IDBRequest).error;
            console.error('Failed to clear categories:', error?.message || event);
            reject(new Error(`Failed to clear categories: ${error?.message || 'Unknown error'}`));
          };
        } catch (error) {
          console.error('Error in transaction:', error);
          reject(error);
        }
      });
    } catch (error) {
      console.error('Error during categories replacement:', error);
      throw error;
    }
  }

  async clearAllCategories(): Promise<void> {
    await this.ensureConnection();
    if (!this.db || !this.isInitialized) throw new Error('Database is not initialized');
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = (event) => reject((event.target as IDBRequest).error);
    });
  }

  private async ensureConnection(): Promise<void> {
    // 이미 연결되어 있고, 닫혀있지 않으면 OK
    if (
      this.db &&
      this.isInitialized &&
      // 최신 브라우저는 closed 프로퍼티 지원
      (typeof (this.db as any).closed === 'undefined' || !(this.db as any).closed)
    ) {
      return;
    }
    // 연결이 닫혔거나 유효하지 않으면 재연결
    this.db = null;
    this.isInitialized = false;
    await this.connect();
  }
}

class TransactionDB {
  private db: IDBDatabase | null = null;
  private readonly dbName = DB_NAME;
  private readonly storeName = STORES.TRANSACTIONS;
  private readonly version = DB_VERSION;
  private connecting: Promise<void> | null = null;
  private isInitialized = false;

  async connect(): Promise<void> {
    if (this.connecting) {
      return this.connecting;
    }

    if (this.db && this.isInitialized) {
      // object store가 삭제된 경우 강제 재생성
      if (!this.db.objectStoreNames.contains(this.storeName)) {
        this.db.close();
        this.isInitialized = false;
        this.db = null;
        // 버전 강제 증가
        const newVersion = this.version + 1;
        const request = indexedDB.open(this.dbName, newVersion);
        request.onupgradeneeded = async (event: IDBVersionChangeEvent) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(this.storeName)) {
            db.createObjectStore(this.storeName, { keyPath: 'id' });
          }
        };
        await new Promise((resolve, reject) => {
          request.onsuccess = () => resolve(undefined);
          request.onerror = () => reject(request.error);
        });
        this.isInitialized = false;
        this.db = null;
      } else {
        return Promise.resolve();
      }
    }

    this.connecting = new Promise((resolve, reject) => {
      try {
        const request = indexedDB.open(this.dbName, this.version);

        request.onerror = (event) => {
          const error = (event.target as IDBOpenDBRequest).error;
          console.error('TransactionDB 연결 실패:', error?.message || event);
          this.connecting = null;
          this.isInitialized = false;
          reject(new Error(`TransactionDB 연결 실패: ${error?.message || 'Unknown error'}`));
        };

        request.onsuccess = (event) => {
          this.db = (event.target as IDBOpenDBRequest).result;
          this.connecting = null;
          this.isInitialized = true;
          
          this.db.onerror = (event) => {
            const target = event.target as IDBRequest;
            console.error('Database error:', target.error);
          };
          
          resolve();
        };

        request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
          const db = (event.target as IDBOpenDBRequest).result;
          
          // 기존 스토어가 있으면 삭제
          if (db.objectStoreNames.contains(this.storeName)) {
            db.deleteObjectStore(this.storeName);
          }
          
          // 새로운 스토어 생성
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('date', 'date', { unique: false });
          store.createIndex('type', 'type', { unique: false });
          console.log('Transaction store created successfully');
        };
      } catch (error) {
        console.error('Error during TransactionDB connection:', error);
        this.connecting = null;
        this.isInitialized = false;
        reject(error);
      }
    });

    return this.connecting;
  }

  async getAllTransactions(): Promise<Transaction[]> {
    try {
      await this.ensureConnection();
      
      if (!this.db || !this.isInitialized) {
        throw new Error('Database is not initialized');
      }

      return new Promise((resolve, reject) => {
        try {
          const transaction = this.db!.transaction([this.storeName], 'readonly');
          const store = transaction.objectStore(this.storeName);
          const request = store.index('date').getAll();

          request.onsuccess = () => {
            const transactions = request.result || [];
            resolve(transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
          };

          request.onerror = (event) => {
            const error = (event.target as IDBRequest).error;
            console.error('Failed to get transactions:', error?.message || event);
            reject(new Error(`Failed to get transactions: ${error?.message || 'Unknown error'}`));
          };
          
          transaction.onerror = (event) => {
            const error = (event.target as IDBTransaction).error;
            console.error('Transaction failed:', error?.message || event);
            reject(new Error(`Transaction failed: ${error?.message || 'Unknown error'}`));
          };
        } catch (error) {
          console.error('Error during transaction creation:', error);
          reject(error);
        }
      });
    } catch (error) {
      console.error('Error during transactions retrieval:', error);
      throw error;
    }
  }

  async addTransaction(transactionData: Transaction): Promise<void> {
    try {
      await this.ensureConnection();
      
      if (!this.db || !this.isInitialized) {
        throw new Error('Database is not initialized');
      }

      return new Promise((resolve, reject) => {
        try {
          // amount를 숫자로 변환
          const amount = typeof transactionData.amount === 'string' 
            ? parseInt(transactionData.amount.replace(/[^0-9.-]/g, ''), 10) || 0
            : transactionData.amount || 0;

          // 순수 데이터 객체 생성
          const cleanTransaction: Transaction = {
            id: transactionData.id || crypto.randomUUID(),
            type: transactionData.type,
            date: transactionData.date,
            section: transactionData.section.trim(),
            category: transactionData.category.trim(),
            subcategory: transactionData.subcategory?.trim() || '',
            amount,
            memo: transactionData.memo?.trim() || ''
          };

          const dbTransaction = this.db!.transaction([this.storeName], 'readwrite');
          const store = dbTransaction.objectStore(this.storeName);
          const request = store.add(cleanTransaction);

          request.onsuccess = () => {
            console.log('Transaction added successfully:', cleanTransaction.id);
            resolve();
          };
          
          request.onerror = (event) => {
            const error = (event.target as IDBRequest).error;
            console.error('Failed to add transaction:', error?.message || event);
            reject(new Error(`Failed to add transaction: ${error?.message || 'Unknown error'}`));
          };
          
          dbTransaction.onerror = (event) => {
            const error = (event.target as IDBTransaction).error;
            console.error('Transaction failed:', error?.message || event);
            reject(new Error(`Transaction failed: ${error?.message || 'Unknown error'}`));
          };
        } catch (error) {
          console.error('Error during transaction creation:', error);
          reject(error);
        }
      });
    } catch (error) {
      console.error('Error during transaction addition:', error);
      throw error;
    }
  }

  async updateTransaction(id: string, transaction: Transaction): Promise<void> {
    try {
      await this.ensureConnection();
      if (!this.db || !this.isInitialized) {
        throw new Error('Database is not initialized');
      }
      return new Promise((resolve, reject) => {
        const dbTx = this.db!.transaction([this.storeName], 'readwrite');
        const store = dbTx.objectStore(this.storeName);
        // id가 반드시 포함된 transaction 객체를 그대로 put
        const updateRequest = store.put(transaction);
          updateRequest.onsuccess = () => {
            console.log('Transaction updated successfully:', id);
            resolve();
          };
          updateRequest.onerror = (event) => {
            const error = (event.target as IDBRequest).error;
            console.error('Failed to update transaction:', error?.message || event);
            reject(new Error(`Failed to update transaction: ${error?.message || 'Unknown error'}`));
        };
      });
    } catch (error) {
      console.error('Error during transaction update:', error);
      throw error;
    }
  }

  async deleteTransaction(id: string): Promise<void> {
    try {
      await this.ensureConnection();
      
      if (!this.db || !this.isInitialized) {
        throw new Error('Database is not initialized');
      }

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);

        const request = store.delete(id);

        request.onsuccess = () => {
          console.log('Transaction deleted successfully:', id);
          resolve();
        };

        request.onerror = (event) => {
          const error = (event.target as IDBRequest).error;
          console.error('Failed to delete transaction:', error?.message || event);
          reject(new Error(`Failed to delete transaction: ${error?.message || 'Unknown error'}`));
        };
      });
    } catch (error) {
      console.error('Error during transaction deletion:', error);
      throw error;
    }
  }

  async replaceAllTransactions(transactions: Transaction[]): Promise<void> {
    try {
      await this.ensureConnection();
      
      if (!this.db || !this.isInitialized) {
        throw new Error('Database is not initialized');
      }

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);

        // 기존 데이터 모두 삭제
        const clearRequest = store.clear();

        clearRequest.onerror = (event) => {
          const error = (event.target as IDBRequest).error;
          console.error('Failed to clear transactions:', error?.message || event);
          reject(new Error(`Failed to clear transactions: ${error?.message || 'Unknown error'}`));
        };

        clearRequest.onsuccess = () => {
          console.log('Successfully cleared existing transactions');
          
          // 새로운 데이터 일괄 추가
          let addedCount = 0;
          
          transactions.forEach((transaction) => {
            const newTransaction = {
              ...transaction,
              id: crypto.randomUUID(),
              date: transaction.date,
              amount: typeof transaction.amount === 'string' ? 
                parseInt(transaction.amount.replace(/,/g, '')) : 
                transaction.amount,
              section: transaction.section.trim(),
              category: transaction.category.trim(),
              subcategory: transaction.subcategory?.trim() || '',
              memo: transaction.memo?.trim() || ''
            };

            const addRequest = store.add(newTransaction);

            addRequest.onsuccess = () => {
              addedCount++;
              if (addedCount === transactions.length) {
                console.log(`Successfully imported ${addedCount} transactions`);
                resolve();
              }
            };

            addRequest.onerror = (event) => {
              const error = (event.target as IDBRequest).error;
              console.error('Failed to add transaction during import:', error?.message || event);
              reject(new Error(`Failed to add transaction during import: ${error?.message || 'Unknown error'}`));
            };
          });
        };

        transaction.onerror = (event) => {
          const error = (event.target as IDBTransaction).error;
          console.error('Transaction failed:', error?.message || event);
          reject(new Error(`Transaction failed: ${error?.message || 'Unknown error'}`));
        };
      });
    } catch (error) {
      console.error('Error during transactions replacement:', error);
      throw error;
    }
  }

  async clearAllTransactions(): Promise<void> {
    await this.ensureConnection();
    if (!this.db || !this.isInitialized) throw new Error('Database is not initialized');
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = (event) => reject((event.target as IDBRequest).error);
    });
  }

  private async ensureConnection(): Promise<void> {
    // 이미 연결되어 있고, 닫혀있지 않으면 OK
    if (
      this.db &&
      this.isInitialized &&
      // 최신 브라우저는 closed 프로퍼티 지원
      (typeof (this.db as any).closed === 'undefined' || !(this.db as any).closed)
    ) {
      return;
    }
    // 연결이 닫혔거나 유효하지 않으면 재연결
    this.db = null;
    this.isInitialized = false;
    await this.connect();
  }
}

export const categoryDB = new CategoryDB();
export const transactionDB = new TransactionDB(); 