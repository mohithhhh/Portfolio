'use client'
import { useState } from 'react'
import { motion } from 'motion/react'
import { TRASH_ID, listChildren } from '@/os/fs'
import type { AppProps } from '@/os/registry'
import { useReducedMotion } from '@/os/hooks'
import { useSystem } from '@/os/stores/system'
import { vfs } from '@/os/vfs'
import { FinderView } from '@/apps/finder/FinderView'

export default function Trash(props: AppProps) {
  const emptied = useSystem((s) => s.trashEmptied)
  const setEmptied = useSystem((s) => s.setTrashEmptied)
  const reduced = useReducedMotion()
  const [emptying, setEmptying] = useState(false)
  const hasItems = listChildren(vfs, TRASH_ID).length > 0 && !emptied

  const empty = () => {
    setEmptying(true)
    setTimeout(() => {
      setEmptied(true)
      setEmptying(false)
    }, reduced ? 50 : 650)
  }

  return (
    <motion.div className="flex h-full min-h-0 flex-col" animate={emptying && !reduced ? { opacity: [1, 0.4, 1] } : undefined}>
      <FinderView
        {...props}
        fixedFolder={TRASH_ID}
        hideItems={emptied}
        toolbarExtra={
          <button className="btn" onClick={empty} disabled={!hasItems || emptying}>
            Empty
          </button>
        }
        emptyState={
          <div className="finder-empty">
            <p>Trash is empty.</p>
            {listChildren(vfs, TRASH_ID).length === 0 && (
              <p className="text-[11px]">TODO(owner): add failed experiments and lessons learned.</p>
            )}
          </div>
        }
      />
    </motion.div>
  )
}
