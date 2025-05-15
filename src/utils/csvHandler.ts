import { Category, CategoryType } from '@/types/category';
import { Transaction } from '@/types/transaction';
import { categoryDB, transactionDB } from '@/utils/indexedDB';
import Papa from 'papaparse';

// CSV 한글 헤더 매핑
const TRANSACTION_HEADERS_MAP: Record<string, string> = {
  date: '날짜',
  type: '유형',
  section: '관',
  category: '항',
  subcategory: '목',
  amount: '금액',
  memo: '메모'
};

const CATEGORY_HEADERS_MAP: Record<string, string> = {
  type: '유형',
  section: '관',
  category: '항',
  subcategory: '목'
};

// 역방향 매핑 (한글 -> 영문)
const REVERSE_TRANSACTION_HEADERS_MAP = Object.entries(TRANSACTION_HEADERS_MAP).reduce((acc, [eng, kor]) => {
  acc[kor] = eng;
  return acc;
}, {} as Record<string, string>);

const REVERSE_CATEGORY_HEADERS_MAP = Object.entries(CATEGORY_HEADERS_MAP).reduce((acc, [eng, kor]) => {
  acc[kor] = eng;
  return acc;
}, {} as Record<string, string>);

// 기본 카테고리 데이터
const DEFAULT_CATEGORIES = [
  {
    type: 'income',
    section: '급여',
    category: '상여금',
    subcategory: '1분기'
  },
  {
    type: 'expense',
    section: '식비',
    category: '부식비',
    subcategory: '반찬재료'
  }
];

// CSV 파일 읽기 (가져오기)
export const parseCSV = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      transformHeader: (header: string) => {
        // 영문 헤더는 그대로 사용, 한글 헤더는 영문으로 변환
        if (REVERSE_TRANSACTION_HEADERS_MAP[header]) {
          return REVERSE_TRANSACTION_HEADERS_MAP[header];
        }
        if (REVERSE_CATEGORY_HEADERS_MAP[header]) {
          return REVERSE_CATEGORY_HEADERS_MAP[header];
        }
        // 이미 영문 헤더인 경우 그대로 반환
        if (Object.keys(TRANSACTION_HEADERS_MAP).includes(header) || 
            Object.keys(CATEGORY_HEADERS_MAP).includes(header)) {
          return header;
        }
        console.warn(`알 수 없는 헤더: ${header}`);
        return header;
      },
      transform: (value, field) => {
        // 필드별 데이터 변환
        if (field === 'type') {
          return value === '수입' ? 'income' : 'expense';
        }
        if (field === 'amount') {
          // 숫자만 추출하여 변환
          const numStr = value.replace(/[^0-9.-]/g, '');
          return numStr ? parseInt(numStr, 10) : 0;
        }
        return value ? value.trim() : '';
      },
      complete: (results) => {
        try {
          const data = results.data
            .filter(item => {
              // 빈 행 제거 (모든 값이 비어있는 행)
              return typeof item === 'object' && 
                     item !== null && 
                     Object.values(item).some(val => val !== '');
            })
            .map(item => {
              // 데이터 정제
              const cleanedItem: Record<string, any> = {};
              
              if (typeof item === 'object' && item !== null) {
                Object.entries(item).forEach(([key, value]) => {
                  // 기본 데이터 타입만 저장
                  if (value !== null && 
                      typeof value !== 'object' && 
                      typeof value !== 'function') {
                    cleanedItem[key] = value;
                  }
                });
              }
              
              return cleanedItem;
            });
          
          resolve(data);
        } catch (error) {
          console.error('CSV 데이터 변환 실패:', error);
          reject(new Error('CSV 데이터 변환에 실패했습니다.'));
        }
      },
      error: (error) => {
        console.error('CSV 파싱 실패:', error);
        reject(error);
      }
    });
  });
};

// CSV 파일 생성 (내보내기)
export const exportToCSV = (data: any[], filename: string, isCategory: boolean = false) => {
  try {
    // 헤더 매핑 선택
    const headerMap = isCategory ? CATEGORY_HEADERS_MAP : TRANSACTION_HEADERS_MAP;
    
    // 빈 템플릿 생성
    const emptyTemplate = Object.entries(headerMap).reduce((acc, [eng, kor]) => {
      acc[kor] = '';
      return acc;
    }, {} as Record<string, string>);

    // 데이터 변환
    const transformedData = data.length > 0 
      ? data.map(item => {
          const transformed: Record<string, string> = {};
          Object.entries(item).forEach(([key, value]) => {
            const koreanHeader = headerMap[key];
            if (koreanHeader) {
              if (key === 'type') {
                transformed[koreanHeader] = value === 'income' ? '수입' : '지출';
              } else if (key === 'date' && !isCategory) {
                // yyyy-mm-dd, dd/mm/yyyy 등 다양한 날짜를 yyyy.mm.dd로 변환
                let dateStr = value?.toString() || '';
                let yyyy = '', mm = '', dd = '';
                if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                  // yyyy-mm-dd
                  [yyyy, mm, dd] = dateStr.split('-');
                } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
                  // dd/mm/yyyy
                  [dd, mm, yyyy] = dateStr.split('/');
                } else if (/^\d{4}\.\d{2}\.\d{2}\.?$/.test(dateStr)) {
                  // yyyy.mm.dd or yyyy.mm.dd.
                  [yyyy, mm, dd] = dateStr.replace(/\.$/, '').split('.');
                }
                if (yyyy && mm && dd) {
                  transformed[koreanHeader] = `${yyyy}.${mm}.${dd}`;
                } else {
                  transformed[koreanHeader] = dateStr;
                }
              } else {
                transformed[koreanHeader] = value?.toString() || '';
              }
            }
          });
          return transformed;
        })
      : DEFAULT_CATEGORIES.map(item => {
          const transformed: Record<string, string> = {};
          Object.entries(item).forEach(([key, value]) => {
            const koreanHeader = headerMap[key];
            if (koreanHeader) {
              if (key === 'type') {
                transformed[koreanHeader] = value === 'income' ? '수입' : '지출';
              } else {
                transformed[koreanHeader] = value?.toString() || '';
              }
            }
          });
          return transformed;
        });

    // CSV 생성
    const csv = Papa.unparse(transformedData, {
      header: true,
      delimiter: ',',
      newline: '\r\n'
    });

    // UTF-8 BOM을 추가하여 한글이 올바르게 표시되도록 함
    const BOM = '\uFEFF';
    const csvWithBOM = BOM + csv;
    
    // 파일 다운로드
    const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

  } catch (error) {
    console.error('CSV 파일 생성 실패:', error);
    throw error;
  }
};

// 거래내역 데이터 유효성 검사
export const validateTransactionData = (data: any[]): boolean => {
  if (!Array.isArray(data)) return false;
  
  // 빈 템플릿인 경우 (모든 필드가 비어있는 경우) true 반환
  if (data.length === 0) return true;
  
  return data.every(item => {
    // 필수 필드 존재 여부 확인
    const hasRequiredFields = 
      'date' in item && 
      'type' in item && 
      'section' in item && 
      'category' in item && 
      'amount' in item;

    if (!hasRequiredFields) return false;

    // 빈 행은 건너뛰기
    const isEmptyRow = !Object.values(item).some(val => val !== '');
    if (isEmptyRow) return true;

    // 유형 값 검증
    const validType = ['income', 'expense', '수입', '지출'].includes(item.type);

    // 금액 값 검증
    const amount = String(item.amount).replace(/[^0-9.-]/g, '');
    const validAmount = !isNaN(parseInt(amount, 10));

    // 필수 값이 비어있지 않은지 확인
    const hasRequiredValues = 
      item.date?.toString().trim() !== '' && 
      item.section?.toString().trim() !== '' && 
      item.category?.toString().trim() !== '';

    return validType && validAmount && hasRequiredValues;
  });
};

// 카테고리 데이터 유효성 검사
export const validateCategoryData = (data: any[]): boolean => {
  if (!data || data.length === 0) return false;

  return data.every(item => {
    // 필수 필드 존재 여부 확인
    const hasRequiredFields = 
      'type' in item && 
      'section' in item && 
      'category' in item;

    if (!hasRequiredFields) return false;

    // 유형 값 검증
    const validType = 
      item.type === 'income' || 
      item.type === 'expense' || 
      item.type === '수입' || 
      item.type === '지출';

    // 필수 값이 비어있지 않은지 확인
    const hasRequiredValues = 
      item.section?.trim() !== '' && 
      item.category?.trim() !== '';

    return validType && hasRequiredValues;
  });
};

// 카테고리 데이터 가져오기 및 덮어쓰기
export const importCategories = async (file: File): Promise<void> => {
  try {
    const data = await parseCSV(file);
    
    if (!validateCategoryData(data)) {
      throw new Error('유효하지 않은 카테고리 데이터입니다. 파일 형식을 확인해주세요.');
    }

    // 카테고리 데이터 형식으로 변환
    const categories: Category[] = data.map(item => {
      // type 필드 정규화
      const type: CategoryType = (item.type === 'income' || item.type === '수입') ? 'income' : 'expense';

      return {
        id: crypto.randomUUID(),
        type,
        section: item.section?.toString().trim() || '',
        category: item.category?.toString().trim() || '',
        subcategory: item.subcategory?.toString().trim() || '',
        order: 0 // replaceAllCategories에서 재정렬됨
      };
    });

    // IndexedDB에 덮어쓰기
    await categoryDB.replaceAllCategories(categories);
  } catch (error) {
    console.error('카테고리 가져오기 실패:', error);
    throw error;
  }
};

// 거래내역 데이터 가져오기 및 덮어쓰기
export const importTransactions = async (file: File): Promise<void> => {
  try {
    const data = await parseCSV(file);
    
    if (!validateTransactionData(data)) {
      throw new Error('유효하지 않은 거래내역 데이터입니다. 파일 형식을 확인해주세요.');
    }

    // 거래내역 데이터 형식으로 변환
    const transactions: Transaction[] = data.map(item => {
      // type 필드 정규화
      const type: CategoryType = (item.type === 'income' || item.type === '수입') ? 'income' : 'expense';

      // 기본 데이터 타입만 포함하는 새로운 객체 생성
      return {
        id: crypto.randomUUID(), // 새로운 ID 생성
        type,
        date: item.date?.toString() || '',
        section: item.section?.toString() || '',
        category: item.category?.toString() || '',
        subcategory: item.subcategory?.toString() || '',
        amount: typeof item.amount === 'string' ? 
          parseInt(item.amount.replace(/[^0-9.-]/g, ''), 10) : 
          Number(item.amount) || 0,
        memo: item.memo?.toString() || ''
      };
    });

    // IndexedDB에 덮어쓰기
    await transactionDB.replaceAllTransactions(transactions);

    // 성공적으로 완료되면 이벤트 발생
    const event = new CustomEvent('transactionUpdate');
    window.dispatchEvent(event);
  } catch (error) {
    console.error('거래내역 가져오기 실패:', error);
    throw error;
  }
}; 