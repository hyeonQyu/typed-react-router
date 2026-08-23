# @hyeonqyu/typed-router-next

[English](./README.md) | **한국어**

Next.js App Router를 위한 타입 안전 라우팅입니다. typed-router가 처음이라면 [프로젝트 개요](../../README.ko.md)에서 왜 만들어졌는지와 라우트 트리가 일반적으로 어떻게 동작하는지를 먼저 확인하세요 — 이 문서는 Next 전용 완결 가이드입니다: 설치 → 선언 → 사용, 그게 전부입니다.

```bash
npm install @hyeonqyu/typed-router-next zod
```

## 1. 트리 선언하기

키가 곧 URL 세그먼트이므로, 트리가 `src/app/` 디렉터리와 그대로 대응됩니다 — `[id]`, `[...slug]`, `(group)`은 Next.js에서와 정확히 같은 의미입니다.

```ts
// routes.ts
import { defineRoutes } from '@hyeonqyu/typed-router-next';
import { z } from 'zod';

export const routes = defineRoutes({
  home: {
    _metadata: { title: 'Home' },
  },
  products: {
    _metadata: {
      title: 'Products',
      searchParamsSchema: z.object({
        sort: z.enum(['price-asc', 'price-desc']).optional(),
        page: z.number().default(1),
      }),
    },
    '[id]': {
      _metadata: { title: 'Product detail' },
    },
  },
  '(account)': {
    // 라우트 그룹: 트리를 조직화할 뿐 URL에는 아무것도 추가하지 않음
    profile: { _metadata: { title: 'Profile' } },
  },
});

export const { TypedLink, useCurrentRoute, useTypedParams, useTypedRouter, useTypedSearchParams } = routes;
```

`src/app/` 아래의 폴더들 — `home/`, `products/`, `products/[id]/`, `(account)/profile/` — 은 Next.js가 기대하는 그대로 유지됩니다. `routes`는 아무것도 렌더링하지 않습니다. 이미 있는 구조를 설명할 뿐입니다.

## 2. 네비게이션

```tsx
'use client';
import { useTypedRouter } from './routes';

function Actions() {
  const router = useTypedRouter();

  router.push('/products/[id]', { params: { id: 42 }, scroll: false }); // Next의 `scroll` 옵션이 params/searchParams 옆에 나란히
  router.replace('/products', { searchParams: { sort: 'price-asc' } });
  router.prefetch('/products/[id]', { params: { id: 42 } });
  router.back();
  router.forward();
  router.refresh();
}
```

`push`/`replace`/`prefetch`는 해당 pathname에 대해 트리가 선언한 `params`와 `searchParams`를 정확히 요구합니다 — 무엇이 컴파일되고 무엇이 안 되는지 전체 목록은 프로젝트 개요를 참고하세요.

## 3. 링크

```tsx
import { TypedLink } from './routes';

<TypedLink href="/products/[id]" params={{ id: 42 }}>상세보기</TypedLink>
<TypedLink href="/products" searchParams={{ sort: 'price-asc', page: 2 }} hash="top">정렬됨</TypedLink>
```

`TypedLink`는 `next/link`를 감싸며, 나머지 모든 prop(`className`, `prefetch`, `scroll` 등)을 그대로 전달합니다.

## 4. 현재 라우트 읽기

```tsx
'use client';
import { useTypedParams, useCurrentRoute } from './routes';

function ProductDetail() {
  const params = useTypedParams('/products/[id]');
  params.id; // string

  const { pathname, url, metadata } = useCurrentRoute();
  // /products/42 에서 → pathname: '/products/[id]', url: '/products/42'
}
```

트리 노드나 선언된 패턴만 필요하다면 `useCurrentRouteNode()`와 `useTypedPathname()`도 사용할 수 있습니다.

## 5. 쿼리 파라미터 읽기 — 그리고 Suspense 규칙

```tsx
'use client';
import { Suspense } from 'react';
import { useTypedSearchParams } from './routes';

export default function ProductsPage() {
  return (
    <Suspense fallback={null}>
      <ProductsView />
    </Suspense>
  );
}

function ProductsView() {
  const searchParams = useTypedSearchParams('/products');
  searchParams.page; // number — ?page=2는 런타임에도 실제로 숫자 2, "2"가 아님
  searchParams.sort; // 'price-asc' | 'price-desc' | undefined
}
```

`useTypedSearchParams`는 내부적으로 Next의 `useSearchParams`를 사용하며, 이는 페이지를 정적 프리렌더링 대상에서 제외시킵니다. `useSearchParams`를 직접 쓸 때와 동일한 규칙으로, 이를 호출하는 컴포넌트는 `<Suspense>` 경계로 감싸야 합니다. 위처럼 분리하지 않으면 Next 빌드가 정확히 어디가 문제인지 알려줍니다. 전체 패턴은 [`examples/next-example/src/app/products/page.tsx`](../../examples/next-example/src/app/products/page.tsx)를, 이 훅이 받는 `onError` 모드는 프로젝트 개요를 참고하세요.

## 6. 서버 컴포넌트와 훅 없이 사용하기

`routes`는 순수한 데이터이므로 서버 컴포넌트에서 import해도 안전합니다. 훅만 클라이언트 전용입니다.

```ts
// app/page.tsx — 서버 컴포넌트
import { redirect } from 'next/navigation';
import { routes } from './routes';

export default function Index() {
  redirect(routes.buildHref('/home'));
}
```

서버 컴포넌트에서 `useTypedSearchParams` 같은 훅을 호출하면, `useSearchParams`를 거기서 호출했을 때와 정확히 같은 방식으로 실패합니다 — 클라이언트 전용 코드는 자기만의 `'use client'` 경계 뒤에 있으므로, `routes`를 import했다고 해서 서버 번들로 새어 들어가지 않습니다.

## 메타데이터

`title`, `label`, `description`, `accessible`은 고정값이거나 컨텍스트 객체를 받는 함수일 수 있습니다. `resolveMetadata`(`@hyeonqyu/typed-router-core`에서, 여기서도 재수출됨)로 이를 해석할 수 있습니다. 전체 설명(`defineRoutes.withMeta` 포함)은 [프로젝트 개요](../../README.ko.md#라우트-메타데이터)를 참고하세요.

## 예제

[`examples/next-example`](../../examples/next-example)는 이 가이드로 만든 완전한 앱입니다 — `yarn workspace next-example dev`.

## 라이선스

MIT
