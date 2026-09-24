'use client'
// About This Mac content, shared by macOS and the iOS "About" app.
import { useState } from 'react'
import { ChevronLeft, Mail } from 'lucide-react'
import { BrandIcon, brandOf } from '@/ui/BrandIcon'
import { profile, skills } from '@/content'
import { openCompose } from '@/os/actions'


export function AboutContent({ compact = false }: { compact?: boolean }) {
  const [more, setMore] = useState(false)
  if (more) {
    return (
      <div className="about about-more" data-testid="about-more">
        <button className="btn self-start" onClick={() => setMore(false)}>
          <ChevronLeft size={14} /> Back
        </button>
        <h3>Technical skills</h3>
        {skills.categories.map((c) => (
          <section key={c.id}>
            <h4>{c.label}</h4>
            <ul>
              {c.items.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    )
  }
  return (
    <div className={`about ${compact ? 'is-compact' : ''}`}>
      <img className="about-photo" src="/me.jpg" alt={profile.name} width={112} height={112} />
      <h2>{profile.name}</h2>
      <p className="about-sub">{profile.title} · {profile.location.split(',')[0]}</p>
      <dl className="about-specs">
        {skills.specRows.map((r) => (
          <div key={r.label}>
            <dt>{r.label}</dt>
            <dd>{r.value}</dd>
          </div>
        ))}
      </dl>
      <button className="btn" onClick={() => setMore(true)} data-testid="about-more-info">
        More Info…
      </button>
      <div className="about-links">
        {profile.links.map((l) => {
          const brand = brandOf(l.id)
          return (
            <a key={l.id} href={l.url} target="_blank" rel="noopener noreferrer" aria-label={l.label}>
              {brand ? <BrandIcon brand={brand} size={17} /> : <Mail size={16} />}
            </a>
          )
        })}
        <button aria-label={`Email ${profile.name}`} onClick={() => openCompose()}>
          <Mail size={16} />
        </button>
      </div>
      <p className="about-legal">
        © {new Date().getFullYear()} {profile.name}. Not affiliated with Apple Inc.
      </p>
    </div>
  )
}
