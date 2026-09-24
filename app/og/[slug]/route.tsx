import { ImageResponse } from 'next/og'
import { experienceBySlug, formatRange, profile, projectBySlug } from '@/content'

/** Dynamic OG image styled as a Mac window: /og/home, /og/<project>, /og/<experience>. */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const project = projectBySlug(slug)
  const role = experienceBySlug(slug)
  const title = project?.name ?? (role ? `${role.role} — ${role.company}` : profile.name)
  const subtitle = project
    ? project.summary
    : role
      ? `${role.location} · ${formatRange(role.start, role.end)}`
      : `${profile.title} · ${profile.tagline}`
  const windowTitle = project ? `~/Projects/${project.name}` : role ? `~/Experience/${role.company}` : 'About This Mac'

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #BFE3FF 0%, #7FB8F0 40%, #4D7FD8 75%, #2B4DB0 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            width: 1000,
            height: 470,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 26,
            background: '#ffffff',
            boxShadow: '0 30px 80px rgba(0,0,0,0.35)',
            overflow: 'hidden',
          }}
        >
          <div style={{ height: 64, display: 'flex', alignItems: 'center', padding: '0 26px', background: '#f5f5f7', borderBottom: '1px solid #e5e5ea' }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ width: 18, height: 18, borderRadius: 9, background: '#FF5F57' }} />
              <div style={{ width: 18, height: 18, borderRadius: 9, background: '#FEBC2E' }} />
              <div style={{ width: 18, height: 18, borderRadius: 9, background: '#28C840' }} />
            </div>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', fontSize: 24, color: '#6e6e73', marginRight: 80 }}>{windowTitle}</div>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 64px', gap: 18 }}>
            <div style={{ fontSize: 64, fontWeight: 800, color: '#1d1d1f', letterSpacing: -1.5, lineHeight: 1.05 }}>{title}</div>
            <div style={{ fontSize: 28, color: '#6e6e73', lineHeight: 1.35 }}>{subtitle.length > 150 ? `${subtitle.slice(0, 147)}…` : subtitle}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 12 }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 13,
                  background: 'linear-gradient(135deg, #1E3A8A, #0EA5E9)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  fontWeight: 800,
                }}
              >
                {profile.monogram}
              </div>
              <div style={{ fontSize: 26, color: '#1d1d1f', fontWeight: 600 }}>{profile.name}</div>
            </div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  )
}
