// React 18 renders these HTML attributes, but @types/react 18 does not declare them.
import 'react';

declare module 'react' {
  interface HTMLAttributes<T> {
    inert?: '' | undefined;
  }
  interface ImgHTMLAttributes<T> {
    fetchpriority?: 'high' | 'low' | 'auto';
  }
}
