'use client';

import { TypedLink } from '../routes';
import { link, subtleLink } from './ui';

/**
 * Every link below is checked at compile time: the pathname must exist in the tree,
 * `params` is required for dynamic segments, and `searchParams` must match the route's schema.
 */
export const Nav = () => (
  <nav style={{ marginBottom: '1.5rem' }}>
    <TypedLink href="/home" style={link}>
      Home
    </TypedLink>
    <TypedLink href="/products" style={subtleLink}>
      Products
    </TypedLink>
    <TypedLink href="/products" searchParams={{ sort: 'price-asc', page: 2, inStock: true }} style={subtleLink}>
      Products (sorted, page 2)
    </TypedLink>
    <TypedLink href="/products/[id]" params={{ id: 42 }} style={subtleLink}>
      Product 42
    </TypedLink>
    <TypedLink href="/products/[id]/reviews" params={{ id: 42 }} searchParams={{ star: 5 }} style={subtleLink}>
      Reviews of 42
    </TypedLink>
    <TypedLink href="/search" searchParams={{ q: 'laptop', category: 'electronics' }} style={subtleLink}>
      Search
    </TypedLink>
    <TypedLink href="/docs/[...slug]" params={{ slug: ['guide', 'getting-started'] }} style={subtleLink}>
      Docs
    </TypedLink>
    <TypedLink href="/profile" style={subtleLink}>
      Profile
    </TypedLink>
    <TypedLink href="/orders" style={subtleLink}>
      Orders
    </TypedLink>
  </nav>
);
