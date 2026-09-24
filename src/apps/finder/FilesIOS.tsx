'use client'
import { ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { HOME_ID, kindLabel, listChildren } from '@/os/fs'
import { vfs } from '@/os/vfs'
import { FileIcon } from '@/ui/FileIcon'
import { FilePreview } from '@/ui/FilePreview'
import { IOSNav } from '@/ui/IOSNav'
import { useFinderLocation } from './useFinder'

export default function FilesIOS() {
  const loc = useFinderLocation('ios-files', HOME_ID)
  const [fileId, setFileId] = useState<string | null>(null)
  const file = fileId ? vfs.byId.get(fileId) : undefined
  const parent = vfs.parent.get(loc.folderId)

  if (file) {
    return (
      <div className="ios-screen">
        <IOSNav title={file.name} onBack={() => setFileId(null)} backLabel={loc.folder?.name ?? 'Files'} />
        <div className="ios-preview">
          <FilePreview node={file} />
        </div>
      </div>
    )
  }
  const items = listChildren(vfs, loc.folderId)
  return (
    <div className="ios-screen">
      <IOSNav
        title={loc.folderId === HOME_ID ? 'Files' : (loc.folder?.name ?? 'Files')}
        large={loc.folderId === HOME_ID}
        onBack={loc.folderId !== HOME_ID && parent ? () => loc.go(parent === 'users' ? HOME_ID : parent) : undefined}
      />
      <ul className="ios-list" aria-label="Files">
        {items.map((n) => (
          <li key={n.id}>
            <button
              className="ios-row"
              onClick={() => {
                if (n.type === 'folder') loc.go(n.id)
                else if (n.kind === 'link') window.open(n.source, '_blank', 'noopener,noreferrer')
                else setFileId(n.id)
              }}
            >
              <FileIcon node={n} size={36} />
              <span className="ios-row-text">
                <strong>{n.name}</strong>
                <small>{n.type === 'folder' ? `${listChildren(vfs, n.id).length} items` : kindLabel(n)}</small>
              </span>
              <ChevronRight size={18} className="text-tertiary" />
            </button>
          </li>
        ))}
        {items.length === 0 && <li className="ios-empty">This folder is empty.</li>}
      </ul>
    </div>
  )
}
