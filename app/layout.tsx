import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { SITE_DESCRIPTION, SITE_TITLE, SITE_URL } from '@/site'
import { BOOT_FLAG, THEME_KEY } from '@/os/keys'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_TITLE, template: '%s · Mohith D K' },
  description: SITE_DESCRIPTION,
  applicationName: 'Mohith D K — Portfolio',
  authors: [{ name: 'Mohith D K' }],
  icons: { icon: '/icons/monogram.svg' },
  openGraph: {
    type: 'website',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    images: [{ url: '/og/home', width: 1200, height: 630 }],
  },
  twitter: { card: 'summary_large_image', title: SITE_TITLE, description: SITE_DESCRIPTION, images: ['/og/home'] },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5f5f7' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
}

// Runs before first paint: picks the shell, applies persisted appearance
// settings and skips the boot screen for returning visitors in this session.
const bootScript = `(function(){try{var d=document.documentElement;
var ios=matchMedia('(pointer: coarse)').matches&&innerWidth<900;d.setAttribute('data-shell',ios?'ios':'macos');
try{if(sessionStorage.getItem(${JSON.stringify(BOOT_FLAG)})==='1')d.setAttribute('data-booted','');}catch(e){}
var s=null;try{s=JSON.parse(localStorage.getItem(${JSON.stringify(THEME_KEY)})||'null');}catch(e){}
s=s&&s.state||{};if(s.theme==='light'||s.theme==='dark')d.setAttribute('data-theme',s.theme);
d.setAttribute('data-transparency',s.transparency==='frosted'?'frosted':'glass');
if(s.motion==='reduce')d.setAttribute('data-motion','reduce');}catch(e){}})();`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
