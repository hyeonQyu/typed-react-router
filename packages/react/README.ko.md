# @hyeonqyu/typed-router-react

[English](./README.md) | **한국어**

React Router 6/7을 위한 타입 안전 라우팅입니다. typed-router가 처음이라면 [프로젝트 개요](../../README.ko.md)에서 왜 만들어졌는지와 라우트 트리가 일반적으로 어떻게 동작하는지를 먼저 확인하세요 — 이 문서는 React Router 전용 완결 가이드입니다: 설치 → 선언 → 사용, 그게 전부입니다.

```bash
npm install @hyeonqyu/typed-router-react zod
```

## 1. 트리 선언하기

다른 typed-router 어댑터와 같은 트리 형태에, React Router가 실제로 필요로 하는 것 하나만 추가합니다 — 렌더링할 엘리먼트입니다. `_metadata.element`에 페이지를, `_metadata.layout`에 감싸는 레이아웃을 넣으세요.

```tsx
// routes.tsx
import { defineRoutes } from '@hyeonqyu/typed-router-react';
import { z } from 'zod';
import { HomePage, ProductsPage, ProductDetailPage, ProfilePage, AccountLayout } from './pages';

export const routes = defineRoutes({
  home: {
    _metadata: { title: 'Home', element: <HomePage /> },
  },
  products: {
    _metadata: {
      title: 'Products',
      element: <ProductsPage />,
      searchParamsSchema: z.object({
        sort: z.enum(['price-asc', 'price-desc']).optional(),
        page: z.number().default(1),
      }),
    },
    '[id]': {
      _metadata: { title: 'Product detail', element: <ProductDetailPage /> },
    },
  },
  '(account)': {
    _metadata: { layout: <AccountLayout /> }, // 자식들을 <Outlet />으로 감싸며, URL을 차지하지 않음
    profile: { _metadata: { title: 'Profile', element: <ProfilePage /> } },
  },
});

export const { TypedLink, useCurrentRoute, useTypedParams, useTypedRouter, useTypedSearchParams } = routes;
```

## 2. 라우터 생성하기

`toRouteObjects()`는 트리를 순수한 React Router `RouteObject[]`로 변환합니다 — 원래 손으로 작성했을 바로 그 데이터입니다.

```tsx
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { routes } from './routes';

const router = createBrowserRouter(routes.toRouteObjects());

export default function App() {
  return <RouterProvider router={router} />;
}
```

결과가 순수한 데이터이므로, 자동 생성이 자유도를 갉아먹지 않습니다 — 손으로 만든 shell 아래에 중첩시키거나, 트리가 모르는 라우트를 덧붙이거나, 필터링할 수 있습니다.

```tsx
const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <Navigate to="/home" replace /> },
      ...routes.toRouteObjects(),
      { path: '*', element: <NotFound /> },
    ],
  },
]);
```

`_metadata`에 적은 React Router 라우트 필드는 전부 생성된 라우트로 그대로 전달됩니다.

| `_metadata`에 적으면 | 이렇게 변환됩니다 |
| --- | --- |
| `element` / `Component` / `lazy` | 이 노드의 페이지. 자식이 있으면 `index` 라우트로 옮겨져서 여전히 정확한 경로에서 렌더링됨 |
| `layout` | 이 노드의 자식들을 `<Outlet />`으로 감쌈. 자식이 없는 노드에서는 `element` 대신 쓰임 |
| `loader` / `action` / `shouldRevalidate` / `handle` / `middleware` | 이 노드의 페이지로 전달됨 |
| `errorElement` / `ErrorBoundary` / `HydrateFallback` / `hydrateFallbackElement` / `caseSensitive` / `id` | 페이지가 아니라 이 노드의 라우트 자체로 전달됨 |
| `[id]` 키 | `path: ':id'` |
| `[...slug]` / `[[...slug]]` 키 | `path: '*'` — 단, params는 여전히 `*`가 아니라 `slug`로 읽힘 |
| `(group)` 키 | URL을 차지하지 않는 레이아웃 라우트 |

직접 `toRouteObjects()`를 호출하고 싶지 않다면? `<routes.TypedRoutes />`가 그걸 대신하는 얇은 wrapper입니다 — 기존 `<BrowserRouter>` 안에서 쓸 수 있도록 `useRoutes(routes.toRouteObjects())`를 렌더링합니다.

## 3. 네비게이션

```tsx
import { useTypedRouter } from './routes';

function Actions() {
  const router = useTypedRouter();

  router.push('/products/[id]', { params: { id: 42 } });
  router.replace('/products', { searchParams: { sort: 'price-asc' } });
  router.back();
  router.forward();
  router.refresh(); // 현재 엔트리로 다시 이동 — data router에서는 loader를 다시 실행시킴
}
```

`push`/`replace`는 해당 pathname에 대해 트리가 선언한 `params`와 `searchParams`를 정확히 요구합니다 — 무엇이 컴파일되고 무엇이 안 되는지 전체 목록은 프로젝트 개요를 참고하세요. `router.prefetch(...)`도 같은 객체에 같은 타입 시그니처로 존재해서 Next.js 어댑터와 네비게이션 코드를 그대로 옮길 수 있지만, 여기서는 아무 동작도 하지 않습니다 — React Router의 라이브러리 모드에는 클라이언트 사이드 prefetch가 없기 때문입니다.

## 4. 링크

```tsx
import { TypedLink } from './routes';

<TypedLink href="/products/[id]" params={{ id: 42 }}>상세보기</TypedLink>
<TypedLink href="/products" searchParams={{ sort: 'price-asc', page: 2 }} hash="top">정렬됨</TypedLink>
```

`TypedLink`는 React Router의 `Link`를 감싸며 `to` 대신 `href`를 씁니다. 그래서 이 마크업은 Next.js 어댑터의 것과 동일합니다. 나머지 모든 prop(`className`, `replace`, `state` 등)은 그대로 전달됩니다.

## 5. 현재 라우트 읽기

```tsx
import { useTypedParams, useTypedSearchParams, useCurrentRoute } from './routes';

function ProductDetail() {
  const params = useTypedParams('/products/[id]');
  params.id; // string

  const { pathname, url, metadata } = useCurrentRoute();
  // /products/42 에서 → pathname: '/products/[id]', url: '/products/42'
}

function Products() {
  const searchParams = useTypedSearchParams('/products');
  searchParams.page; // number — ?page=2는 런타임에도 실제로 숫자 2, "2"가 아님
  searchParams.sort; // 'price-asc' | 'price-desc' | undefined
}
```

여기서는 Suspense 경계나 클라이언트/서버 분리를 신경 쓸 필요가 없습니다 — `useTypedSearchParams`는 React Router의 `useLocation()`을 직접 읽습니다. 손으로 수정한 URL이 검증에 실패했을 때 받는 `onError` 모드는 프로젝트 개요를 참고하세요. 트리 노드나 선언된 패턴만 필요하다면 `useCurrentRouteNode()`와 `useTypedPathname()`도 사용할 수 있습니다.

## 메타데이터

`title`, `label`, `description`, `accessible`은 고정값이거나 컨텍스트 객체를 받는 함수일 수 있습니다. `resolveMetadata`(`@hyeonqyu/typed-router-core`에서, 여기서도 재수출됨)로 이를 해석할 수 있습니다. 전체 설명(`defineRoutes.withMeta` 포함)은 [프로젝트 개요](../../README.ko.md#라우트-메타데이터)를 참고하세요.

## 예제

[`examples/react-example`](../../examples/react-example)는 이 가이드로 만든 완전한 앱입니다 — `yarn workspace react-example dev`.

## 라이선스

MIT
