import { filesystem } from '@/content'
import { indexTree } from './fs'

/** The indexed virtual filesystem shared by every app. */
export const vfs = indexTree(filesystem)
