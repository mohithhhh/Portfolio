import Link from 'next/link'

export default function NotFound() {
  return (
    <main style={{ maxWidth: 560, margin: '0 auto', padding: '64px 20px', background: '#fff', color: '#111', minHeight: '100%' }}>
      <h1>Not found</h1>
      <p>That page doesn’t exist.</p>
      <p>
        <Link href="/">Back to the desktop</Link> · <Link href="/simple">Simple version</Link>
      </p>
    </main>
  )
}
