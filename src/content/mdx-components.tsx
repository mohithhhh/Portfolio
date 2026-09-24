import type { MDXComponents } from 'mdx/types'

// Links in documents always open in a new tab; the shell never navigates away.
export const mdxComponents: MDXComponents = {
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
}
