import { BRAND_COLORS, GITHUB_PATH, LINKEDIN_PATH } from './brandPaths'

export type Brand = 'github' | 'linkedin'

/**
 * Official GitHub / LinkedIn marks, only for links to Mohith's profiles.
 * GitHub's mark may be black or white; LinkedIn's "in" logo keeps its blue.
 */
export function BrandIcon({ brand, size = 16, inverted = false }: { brand: Brand; size?: number; inverted?: boolean }) {
  const d = brand === 'github' ? GITHUB_PATH : LINKEDIN_PATH
  const fill = brand === 'github' ? (inverted ? '#FFFFFF' : 'currentColor') : BRAND_COLORS.linkedin
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" focusable="false">
      <path d={d} fill={fill} />
    </svg>
  )
}

export const brandOf = (id: string): Brand | undefined => (id === 'github' || id === 'linkedin' ? id : undefined)
