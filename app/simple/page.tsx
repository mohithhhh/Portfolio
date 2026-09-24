import type { Metadata } from 'next'
import Link from 'next/link'
import { experience, formatRange, notes, profile, projects, skills } from '@/content'
import { MdxServer } from '@/shells/MdxServer'
import { jsonLdScript, personJsonLd } from '@/site'
import './simple.css'

export const metadata: Metadata = {
  title: 'Simple version',
  description: `${profile.name}: resume, projects and experience in plain, accessible HTML.`,
  alternates: { canonical: '/simple' },
}

export default function SimplePage() {
  const about = notes.find((n) => n.pinned)
  return (
    <div className="simple">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(personJsonLd()) }} />
      <a className="skip-link" href="#content">
        Skip to content
      </a>
      <header className="simple-header">
        <nav aria-label="Primary">
          <ul>
            <li>
              <a href="#about">About</a>
            </li>
            <li>
              <a href="#experience">Experience</a>
            </li>
            <li>
              <a href="#projects">Projects</a>
            </li>
            <li>
              <a href="#education">Education</a>
            </li>
            <li>
              <a href="#skills">Skills</a>
            </li>
            <li>
              <a href="#contact">Contact</a>
            </li>
            <li>
              <Link href="/">Desktop version</Link>
            </li>
          </ul>
        </nav>
      </header>
      <main id="content">
        <section aria-labelledby="name">
          <img src="/me.jpg" alt={profile.name} width={120} height={120} className="simple-photo" />
          <h1 id="name">{profile.name}</h1>
          <p className="simple-lede">
            {profile.title} · {profile.location}
          </p>
          <p>{profile.tagline}</p>
          <p>
            <a href="/Resume.pdf" download>
              Download resume (PDF)
            </a>
          </p>
        </section>

        {about && (
          <section id="about" aria-labelledby="about-h">
            <h2 id="about-h">About</h2>
            <MdxServer source={`content/notes/${about.slug}.mdx`} demote />
          </section>
        )}

        <section id="experience" aria-labelledby="exp-h">
          <h2 id="exp-h">Experience</h2>
          {experience.map((e) => (
            <article key={e.slug} id={`experience-${e.slug}`}>
              <MdxServer source={`content/experience/${e.slug}.mdx`} demote />
              <p>
                <Link href={`/experience/${e.slug}`}>Permalink</Link>
              </p>
            </article>
          ))}
        </section>

        <section id="projects" aria-labelledby="proj-h">
          <h2 id="proj-h">Projects</h2>
          {projects.map((p) => (
            <article key={p.slug} id={`project-${p.slug}`}>
              <MdxServer source={`content/projects/${p.slug}.mdx`} demote />
              <p>
                {formatRange(p.start, p.end)} · <Link href={`/projects/${p.slug}`}>Permalink</Link>
                {p.repo && (
                  <>
                    {' · '}
                    <a href={p.repo}>Repository</a>
                  </>
                )}
              </p>
            </article>
          ))}
        </section>

        <section id="education" aria-labelledby="edu-h">
          <h2 id="edu-h">Education</h2>
          {profile.education.map((e) => (
            <article key={e.id}>
              <h3>{e.degree}</h3>
              <p>
                {e.institution}, {e.location} · {formatRange(e.start, e.end)}
              </p>
              <p>Relevant coursework: {e.coursework.join(', ')}.</p>
            </article>
          ))}
          <h3>Publications</h3>
          <ul>
            {profile.publications.map((p) => (
              <li key={p.id}>
                {p.authors}, <cite>“{p.title}”</cite>, {p.venue}, {p.location}, {p.publisher}.
              </li>
            ))}
          </ul>
          <h3>Achievements</h3>
          <ul>
            {profile.achievements.map((a) => (
              <li key={a.id}>
                {a.title} — {a.detail}.
              </li>
            ))}
          </ul>
        </section>

        <section id="skills" aria-labelledby="skills-h">
          <h2 id="skills-h">Technical skills</h2>
          <dl>
            {skills.categories.map((c) => (
              <div key={c.id}>
                <dt>{c.label}</dt>
                <dd>{c.items.join(', ')}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section id="contact" aria-labelledby="contact-h">
          <h2 id="contact-h">Contact</h2>
          <ul>
            <li>
              Email: <a href={`mailto:${profile.email}`}>{profile.email}</a>
            </li>
            <li>
              Phone: <a href={`tel:${profile.phone.replace(/\s/g, '')}`}>{profile.phone}</a>
            </li>
            {profile.links.map((l) => (
              <li key={l.id}>
                {l.label}: <a href={l.url}>{l.url.replace(/^https?:\/\/(www\.)?/, '')}</a>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <footer className="simple-footer">
        <p>
          © {new Date().getFullYear()} {profile.name}. The desktop version is a browser recreation of a Mac. Not affiliated with Apple Inc.
        </p>
      </footer>
    </div>
  )
}
