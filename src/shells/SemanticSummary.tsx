import Link from 'next/link'
import { experience, formatRange, profile, projects } from '@/content'

/**
 * Plain semantic summary rendered with the desktop. Visible without JS;
 * visually hidden (but read by screen readers and crawlers) once the shell runs.
 */
export function SemanticSummary() {
  return (
    <div className="fallback">
      <h1>
        {profile.name} — {profile.title}
      </h1>
      <p>{profile.tagline}</p>
      <p>
        <Link href="/simple">Open the plain, accessible version of this portfolio</Link>
      </p>
      <h2>Projects</h2>
      <ul>
        {projects.map((p) => (
          <li key={p.slug}>
            <Link href={`/projects/${p.slug}`}>{p.name}</Link> ({formatRange(p.start, p.end)}): {p.summary}
          </li>
        ))}
      </ul>
      <h2>Experience</h2>
      <ul>
        {experience.map((e) => (
          <li key={e.slug}>
            <Link href={`/experience/${e.slug}`}>
              {e.role}, {e.company}
            </Link>{' '}
            ({formatRange(e.start, e.end)})
          </li>
        ))}
      </ul>
      <p>
        Contact: <a href={`mailto:${profile.email}`}>{profile.email}</a>
      </p>
    </div>
  )
}
