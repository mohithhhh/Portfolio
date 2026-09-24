import createMDX from '@next/mdx'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  pageExtensions: ['ts', 'tsx'],
  poweredByHeader: false,
}

const withMDX = createMDX({
  options: { remarkPlugins: ['remark-gfm'] },
})

export default withMDX(nextConfig)
