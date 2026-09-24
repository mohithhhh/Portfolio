'use client'
import { useMemo } from 'react'
import { documents, notes, plainText, type Note } from '@/content'

export type NoteWithText = Note & { text: string; preview: string }

export function useNotesList(query: string, folder: string | null) {
  return useMemo(() => {
    const all: NoteWithText[] = notes.map((n) => {
      const text = plainText(documents[`content/notes/${n.slug}.mdx`] ?? '')
      const body = text.replace(n.title, '').trim()
      return { ...n, text, preview: body.split('\n').find((l) => l.trim()) ?? '' }
    })
    const q = query.trim().toLowerCase()
    return all
      .filter((n) => (!folder || n.folder === folder) && (!q || n.text.toLowerCase().includes(q) || n.title.toLowerCase().includes(q)))
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.modified.localeCompare(a.modified))
  }, [query, folder])
}

export const noteFolders = [...new Set(notes.map((n) => n.folder))]

export const formatNoteDate = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
