# typed-router

Type-safe routing for React and Next.js applications with Zod-powered search parameter validation.

## Features

- 🔒 **Type-safe routes**: Catch routing errors at compile time
- 🔍 **Search parameter validation**: Validate query parameters using Zod schemas
- 📦 **Framework support**: Works with Next.js App Router and React Router
- 🎯 **IntelliSense**: Full autocomplete support for routes and parameters
- 🚀 **Zero runtime overhead**: Compile-time type checking only

## Packages

- `@hyeonqyu/typed-router-core`: Core types and utilities
- `@hyeonqyu/typed-router-next`: Next.js integration
- `@hyeonqyu/typed-router-react`: React Router integration (coming soon)

## Installation

```bash
# For Next.js projects
npm install @hyeonqyu/typed-router-next zod

# For React projects
npm install @hyeonqyu/typed-router-react zod
```

## Quick Start

### 1. Define Your Routes

```typescript
// routes.ts
import { createAppRoutes } from '@hyeonqyu/typed-router-next';
import { z } from 'zod';

const { useTypedRouter, useTypedSearchParams, TypedLink } = createAppRoutes()({
  search: {
    _metadata: {
      name: 'search',
      title: 'Search',
      searchParamsSchema: z.object({
        q: z.string(),
        page: z.number().optional(),
        category: z.enum(['books', 'electronics', 'clothing']).optional(),
      }),
    },
  },
  products: {
    _metadata: {
      name: 'products',
      title: 'Products',
      searchParamsSchema: z.object({
        sort: z.enum(['price-asc', 'price-desc', 'name']).optional(),
        minPrice: z.number().optional(),
        maxPrice: z.number().optional(),
      }),
    },
  },
});

export { useTypedRouter, useTypedSearchParams, TypedLink };
```

### 2. Use Type-Safe Router

```typescript
'use client';
import { useTypedRouter } from './routes';

export default function MyComponent() {
  const router = useTypedRouter();

  const handleSearch = () => {
    // ✅ Type-safe - correct parameters
    router.push('/search', {
      searchParams: { q: 'laptop', page: 1, category: 'electronics' }
    });

    // ❌ Type error - invalid field
    router.push('/search', {
      searchParams: { query: 'laptop' } // Error: 'query' does not exist
    });

    // ❌ Type error - wrong enum value
    router.push('/search', {
      searchParams: { q: 'test', category: 'invalid' } // Error: 'invalid' is not a valid category
    });
  };

  return <button onClick={handleSearch}>Search</button>;
}
```

### 3. Use Type-Safe Links

```typescript
import { TypedLink } from './routes';

export default function Navigation() {
  return (
    <nav>
      {/* ✅ Type-safe link with search parameters */}
      <TypedLink
        href={{
          pathname: '/search',
          searchParams: { q: 'books', category: 'books' }
        }}
      >
        Search Books
      </TypedLink>

      {/* ✅ Type-safe link with different parameters */}
      <TypedLink
        href={{
          pathname: '/products',
          searchParams: { sort: 'price-asc', minPrice: 100 }
        }}
      >
        Products (Low to High)
      </TypedLink>
    </nav>
  );
}
```

### 4. Read Type-Safe Search Parameters

```typescript
'use client';
import { useTypedSearchParams } from './routes';

export default function SearchPage() {
  // Automatically typed based on schema
  const searchParams = useTypedSearchParams('/search');
  // searchParams: { q: string; page?: number; category?: 'books' | 'electronics' | 'clothing' }

  return (
    <div>
      <h1>Searching for: {searchParams.q}</h1>
      {searchParams.category && <p>Category: {searchParams.category}</p>}
      {searchParams.page && <p>Page: {searchParams.page}</p>}
    </div>
  );
}
```

## API Reference

### RouteNodeMetadata

```typescript
type RouteNodeMetadata = {
  title?: string;
  label?: string;
  description?: string;
  href?: (context: TContext) => string;
  accessible?: (context: TContext) => boolean;
  searchParamsSchema?: z.ZodType<any>; // ✨ New!
};
```

### useTypedRouter

Returns a router instance with type-safe methods:

```typescript
const router = useTypedRouter();

router.push(pathname, options); // Navigate with type-safe searchParams
router.replace(pathname, options); // Replace with type-safe searchParams
router.prefetch(pathname, options); // Prefetch with type-safe searchParams
router.back(); // Go back
router.forward(); // Go forward
router.refresh(); // Refresh current route
```

### useTypedSearchParams

Returns type-safe search parameters for the current route:

```typescript
const searchParams = useTypedSearchParams(pathname, options);
```

**Options:**

- `onError`: Error handling mode ('throw' | 'default' | 'raw')

### TypedLink

Type-safe Link component:

```typescript
<TypedLink
  href={pathname | { pathname, searchParams?, hash? }}
  {...otherLinkProps}
>
  Link Text
</TypedLink>
```

## Examples

See the [examples directory](./examples) for complete working examples:

- [Next.js Example](./examples/next-example) - E-commerce app with search parameters validation
- [React Example](./examples/react-example) - React Router integration (coming soon)

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
