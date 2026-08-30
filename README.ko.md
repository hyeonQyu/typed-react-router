# typed-router

[English](./README.md) | **한국어**

## 언제 필요한가

라우트 경로와 쿼리 파라미터는 보통 그냥 문자열입니다. 컴파일러는 `/products/[id]`에 `id`가 필요하다는 것도, `?sort=`가 세 가지 값만 받는다는 것도, 이름을 바꾼 페이지를 가리키는 링크 세 개가 여전히 옛날 경로를 향하고 있다는 것도 알려주지 않습니다. 이런 버그는 런타임에, 그것도 발견된다면 다행인 시점에 드러납니다.

typed-router는 라우트 맵 전체를 타입이 있는 객체 하나로 만듭니다. 한 번만 선언하면 pathname, 경로 파라미터, 쿼리 파라미터의 타입, 네비게이션, (React Router의 경우) 라우터 설정 자체까지 — 전부 그 선언 하나에서 파생되고 컴파일러가 검증합니다.

```bash
npm install @hyeonqyu/typed-router-next zod   # Next.js App Router
npm install @hyeonqyu/typed-router-react zod  # React Router
```

`zod`는 선택 사항입니다 — search param 스키마를 선언하는 라우트에서만 필요하며, [Standard Schema](https://standardschema.dev)를 따르는 검증 라이브러리라면 무엇이든 사용할 수 있습니다.

**이미 쓸 스택이 정해져 있다면?** 각 가이드는 독립적으로 완결됩니다. 여러분 것만 읽으세요:

- **[Next.js App Router →](./packages/next/README.ko.md)**
- **[React Router →](./packages/react/README.ko.md)**

이 페이지의 나머지는 두 가이드가 공통으로 딛고 있는 개념을 설명합니다.

## 라우트 트리

라우트 트리는 중첩된 객체입니다. 각 키는 URL 세그먼트이고, 노드는 `_metadata` 블록을 갖는 순간 실제로 이동 가능한 라우트가 됩니다.

```ts
// -next 또는 -react 에서 import — 아래 선언은 어느 쪽이든 동일합니다.
import { defineRoutes } from '@hyeonqyu/typed-router-next';
import { z } from 'zod';

export const routes = defineRoutes({
  cart: {
    _metadata: { title: 'Cart' },
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
});
```

제네릭도, 커링 호출도, 앱을 감싸야 하는 프로바이더도 없습니다. 키 문법은 Next.js에서 그대로 가져왔으므로, 트리가 `app/` 디렉터리 구조와 그대로 대응됩니다.

| 키 | 의미 |
| --- | --- |
| `products` | 정적 세그먼트 |
| `[id]` | 필수 동적 세그먼트 |
| `[...slug]` | 필수 catch-all (하나 이상의 세그먼트) |
| `[[...slug]]` | 선택적 catch-all (0개 이상의 세그먼트) |
| `(group)` | URL 세그먼트를 추가하지 않고 트리를 조직화 |
| `_metadata`가 없는 노드 | 자식들을 네임스페이스하지만 그 자체는 목적지가 아님 |

## 타입 안전한 네비게이션

이 선언으로부터 `routes`는 모든 pathname(`/products`, `/products/[id]`, `/cart`, …)을 컴파일 타임 문자열 유니온으로 뽑아내고 — 실제로 버그를 잡아내는 부분인데 — 각 pathname을 정확히 그것이 필요로 하는 인자에 묶습니다. `useTypedRouter()`는 `routes`가 제공하는 훅 중 하나이며, 나머지는 두 프레임워크 가이드에서 각각 다룹니다.

```ts
const router = useTypedRouter();

router.push('/products/[id]', { params: { id: 42 } });          // ✅
router.push('/products', { searchParams: { sort: 'price-asc' } }); // ✅
router.push('/cart');                                            // ✅ 아무것도 필요 없음

router.push('/products/[id]');            // ❌ params.id가 필수
router.push('/produtcs');                 // ❌ 존재하지 않는 경로
router.push('/products', { searchParams: { sort: 'cheap' } });  // ❌ enum에 없는 값
router.push('/products', { searchParams: { pge: 1 } });         // ❌ 존재하지 않는 키
router.push('/cart', { searchParams: { anything: 1 } });        // ❌ /cart는 스키마가 없음
router.push('/products', { params: { id: 1 } });                // ❌ 동적 세그먼트가 없는 경로
```

경로 파라미터(`params`)와 쿼리 파라미터(`searchParams`)는 항상 별개의 인자이므로, 어느 쪽이 URL을 채우고 어느 쪽이 쿼리 스트링을 채우는지 모호할 일이 없습니다.

## 파라미터 다시 읽기

쿼리 파라미터를 읽을 때는 스키마를 실제로 실행합니다 — URL에서 오는 값은 전부 문자열이므로, 각 필드 자신의 스키마에게 어떤 해석을 받아들이는지 물어봅니다. `z.number()` 필드는 `"2"`가 아니라 `2`를 받고, `z.string()` 필드는 `"0123"`을 그대로 유지하며, `.default()` 값도 채워집니다.

쓰기 쪽도 이에 맞춰 동작합니다. 객체와 중첩 배열은 JSON으로 쿼리 스트링에 들어가므로, `{ f: { min: 1, max: 9 } }`는 같은 객체로 다시 읽힙니다. 충실한 문자열 표현이 없는 값 — `NaN`, 심볼, `Map`, 순환 참조 객체 — 은 `[object Object]`로 URL에 들어가는 대신 URL을 만드는 그 자리에서 예외를 던집니다. `Date`는 ISO 문자열로 쓰이므로 해당 필드는 `z.coerce.date()`로 선언하세요. 순수한 `z.date()`는 typed-router가 스스로 만든 URL조차 다시 읽지 못합니다.

손으로 수정한 URL이 검증에 실패했을 때의 동작은 선택할 수 있습니다.

```ts
useTypedSearchParams('/search', { onError: 'throw' });   // 기본값 — 잘못된 링크를 조기에 드러냄
useTypedSearchParams('/search', { onError: 'default' }); // 잘못된 필드만 버리고 나머지는 유지
useTypedSearchParams('/search', { onError: 'raw' });     // 검증을 건너뜀
```

## 라우트 메타데이터

`_metadata`는 노드마다 개별적으로 추론되므로, 각 라우트는 서로 다른 필드를 가질 수 있습니다 — `title`, `label`, `description`, `accessible`은 고정값이거나 앱 컨텍스트를 받는 함수일 수 있습니다.

```ts
import { resolveMetadata } from '@hyeonqyu/typed-router-core';

const meta = resolveMetadata(routes.getMetadata('/cart'), { locale, userId });
```

모든 노드가 하나의 메타데이터 계약을 공유하길 원한다면, 명시적으로 opt-in 할 수 있습니다.

```ts
const routes = defineRoutes.withMeta<{ name: string }, { locale: string }>()({ ... });
```

## 프레임워크 독립적인 사용

라우트 트리는 순수한 데이터입니다. `@hyeonqyu/typed-router-core`는 React 의존성이 전혀 없는 동일한 선언 방식을 제공합니다 — 스크립트, 테스트, sitemap 생성기 같은 곳에서요. 그리고 각 프레임워크 패키지에서 얻는 `routes` 객체도 훅들과 함께 이 메서드들을 똑같이 가지고 있습니다.

```ts
import { defineRoutes } from '@hyeonqyu/typed-router-core';

const routes = defineRoutes({ /* 위와 같은 형태 */ });

routes.paths;                        // 선언된 모든 pathname
routes.buildHref('/products/[id]', { params: { id: 42 } }); // '/products/42'
routes.match('/products/42');        // → { path: '/products/[id]', params: { id: '42' }, node, metadata }
routes.getMetadata('/products');
routes.parseSearchParams('/products', new URLSearchParams(search));
```

## 패키지 구성

| 패키지 | 용도 |
| --- | --- |
| `@hyeonqyu/typed-router-core` | 트리, 타입, URL 헬퍼 — 프레임워크 독립적 |
| [`@hyeonqyu/typed-router-next`](./packages/next/README.ko.md) | Next.js App Router |
| [`@hyeonqyu/typed-router-react`](./packages/react/README.ko.md) | React Router 6/7 |

## 예제

*같은* 트리를 선언하고 컴포넌트 코드를 그대로 공유하는 실행 가능한 앱 두 개가 있습니다 — API가 어댑터 간에 진짜로 동일하다는 증거입니다.

```bash
yarn workspace next-example dev    # http://localhost:3000
yarn workspace react-example dev   # http://localhost:5173
```

## 1.x에서 업그레이드하기

2.0은 breaking rewrite입니다. [MIGRATION.md](./MIGRATION.md)를 참고하세요. (현재 마이그레이션 가이드는 영문으로만 제공됩니다.)

## 개발

```bash
yarn install
yarn build                         # 모든 패키지 + 예제 두 개
yarn test                          # 타입 테스트 — 컴파일 실패해야 하는 케이스 포함
node --test tests/runtime.test.mjs # 빌드된 dist를 대상으로 실행되므로 먼저 build 필요
yarn lint
```

`tests/core.types.test-d.ts`는 절반이 정상 통과해야 하는 어서션이고, 절반은 `@ts-expect-error`입니다. 그래서 `yarn test`는 컴파일되어야 할 코드가 깨졌을 때뿐 아니라, 막혀야 할 코드가 몰래 통과하기 시작했을 때도 실패합니다.

## 라이선스

MIT
