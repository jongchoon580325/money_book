# money_book-main

## 프로젝트 개요

**money_book-main**은 개인 또는 가정의 재정 관리를 위한 스마트 가계부 웹 애플리케이션입니다.  
지출/수입 내역 입력, 카테고리별 관리, 통계 분석, 데이터 백업/복원 등 다양한 기능을 제공하여  
효율적이고 체계적인 자산 관리를 지원합니다.

---

## 주요 기능

### 1. 거래 입력 및 관리
- **수입/지출 내역 입력**: 날짜, 금액, 관/항/목(3단계 카테고리), 메모 등 상세 정보 입력
- **실시간 거래 목록**: 입력된 거래를 일자별로 그룹화하여 확인, 일별 합계(수입/지출/잔액) 제공
- **거래 내역 수정/삭제**: 인라인 편집 및 삭제, 편집 시 유효성 검사 및 실시간 반영
- **IndexedDB 기반 저장**: 모든 데이터는 브라우저 내 IndexedDB에 안전하게 저장

### 2. 카테고리(관/항/목) 관리
- **카테고리 3단계 구조**: 관(대분류) - 항(중분류) - 목(소분류)로 세분화
- **카테고리 추가/수정/삭제/정렬**: Drag & Drop 및 버튼을 통한 순서 변경, 중복 방지
- **카테고리 데이터 CSV 가져오기/내보내기**: 대량 관리 및 백업/복원 지원

### 3. 통계 및 시각화
- **월별 수입/지출 추이**
- **카테고리별 지출 분포**
- **일별 수입/지출 패턴**
- **예산 대비 실제 지출**
- (차트 UI는 추후 구현 예정, 확장성 고려된 구조)

### 4. 데이터 관리
- **거래내역 CSV 가져오기/내보내기**: 표준 포맷으로 데이터 백업 및 복원
- **카테고리 CSV 가져오기/내보내기**: 카테고리 구조 일괄 관리
- **CSV 한글/영문 헤더 자동 매핑 및 유효성 검사**

### 5. 보안 및 UX
- **비밀번호 기반 보안 접속(로그인 UI)**
- **반응형 디자인 및 다크모드**
- **토스트 알림, 로딩 애니메이션, 접근성 고려**

---

## 기술 스택

- **Frontend**: Next.js (App Router), React, TypeScript, Tailwind CSS
- **State/Data**: React Hooks, IndexedDB (로컬 영구 저장)
- **유틸리티**: PapaParse(CSV), dnd-kit(Drag & Drop), Custom Hooks
- **구조화**: Atomic Design 기반 컴포넌트 분리, 타입 안전성 강화

---

## 데이터 구조

### 거래(Transaction)
```ts
interface Transaction {
  id: string;
  date: string;
  type: 'income' | 'expense';
  section: string;      // 관
  category: string;     // 항
  subcategory?: string; // 목
  amount: number | string;
  memo?: string;
}
```

### 카테고리(Category)
```ts
interface Category {
  id: string;
  type: 'income' | 'expense';
  section: string;      // 관
  category: string;     // 항
  subcategory: string;  // 목
  order?: number;       // 정렬 순서
}
```

---

## 폴더 구조

```
money_book-main/
├── src/
│   ├── app/
│   │   ├── page.tsx                # 메인(로그인/소개) 페이지
│   │   ├── transaction/
│   │   │   ├── input/              # 거래 입력/목록
│   │   │   ├── statistics/         # 통계 분석
│   │   │   └── settings/           # 거래 관련 설정
│   │   └── settings/               # 카테고리/데이터 관리
│   ├── components/
│   │   ├── transaction/            # 거래 입력 폼, 테이블 등
│   │   ├── settings/               # 카테고리 관리 UI
│   │   └── common/                 # 공통 UI(헤더, 토스트 등)
│   ├── hooks/                      # 커스텀 훅
│   ├── types/                      # 타입 정의
│   └── utils/                      # 유틸리티 함수(IndexedDB, CSV 등)
├── public/                         # 정적 파일
├── README.md
└── ...
```

---

## 사용법

1. **개발 서버 실행**
```bash
npm run dev
   # 또는 yarn dev, pnpm dev, bun dev
```
2. **웹 브라우저 접속**
   - http://localhost:3000

3. **거래 입력/관리**
   - [거래 입력] 메뉴에서 수입/지출 내역을 입력
   - 거래 목록에서 수정/삭제 가능

4. **카테고리 관리**
   - [설정] 메뉴에서 관/항/목 카테고리 추가/수정/삭제/정렬

5. **데이터 백업/복원**
   - [설정] > 데이터 관리에서 CSV로 내보내기/가져오기

---

## 확장 및 커스터마이징

- 차트/통계 UI는 확장 가능하도록 설계됨 (예: recharts, chart.js 등 연동)
- 카테고리 구조, 거래 데이터 구조는 타입 기반으로 쉽게 확장 가능
- IndexedDB를 사용하므로, 서버 연동/동기화 기능도 추가 확장 가능

---

## 기타

- 모든 데이터는 사용자의 브라우저에만 저장되며, 서버로 전송되지 않습니다.
- CSV 포맷은 한글/영문 헤더 모두 지원하며, 표준 엑셀 호환

---

이 README는 실제 코드와 구조를 기반으로 작성되었으며,  
실제 배포/운영 환경에 맞게 추가 설명 및 예시 이미지를 보완할 수 있습니다.
