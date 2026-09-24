'use client'
import { useEffect } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'
import { APPS } from '@/os/apps-meta'
import { openNode } from '@/os/actions'
import { useReducedMotion } from '@/os/hooks'
import { useUi } from '@/os/stores/ui'
import { vfs } from '@/os/vfs'
import { FilePreview } from '@/ui/FilePreview'

export function QuickLook() {
  const id = useUi((s) => s.quickLookId)
  const setQuickLook = useUi((s) => s.setQuickLook)
  const reduced = useReducedMotion()
  const node = id ? vfs.byId.get(id) : undefined

  useEffect(() => {
    if (!id) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || (e.key === ' ' && !(e.target instanceof HTMLInputElement))) {
        e.preventDefault()
        e.stopPropagation()
        setQuickLook(null)
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [id, setQuickLook])

  const appName = node?.type === 'file' ? APPS[node.opensWith].name : 'Finder'
  return (
    <AnimatePresence>
      {node && (
        <motion.div
          key={node.id}
          className="quicklook glass"
          role="dialog"
          aria-label={`Quick Look: ${node.name}`}
          initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.94 }}
          transition={reduced ? { duration: 0.12 } : { type: 'spring', stiffness: 460, damping: 34 }}
          style={{ x: '-50%', y: '-50%' }}
          data-testid="quicklook"
        >
          <div className="quicklook-bar">
            <button className="tb-btn" aria-label="Close Quick Look" onClick={() => setQuickLook(null)}>
              <X size={15} />
            </button>
            <span className="flex-1 truncate text-center">{node.name}</span>
            <button
              className="btn"
              onClick={() => {
                setQuickLook(null)
                openNode(node.id)
              }}
            >
              Open with {appName}
            </button>
          </div>
          <div className="quicklook-body">
            <FilePreview node={node} pdfPages={1} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
