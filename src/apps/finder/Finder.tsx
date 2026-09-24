'use client'
import type { AppProps } from '@/os/registry'
import { FinderView } from './FinderView'

export default function Finder(props: AppProps) {
  return <FinderView {...props} />
}
