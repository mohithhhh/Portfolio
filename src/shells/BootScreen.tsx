import { profile } from '@/content'

/**
 * Server-rendered boot screen. Animates in pure CSS so it paints before JS
 * and covers shell detection; BootController dismisses it.
 */
export function BootScreen() {
  return (
    <div id="boot" className="boot" aria-hidden="true" data-testid="boot">
      <div className="boot-stage">
        <div className="boot-lid">
          <div className="boot-screen">
            <div className="boot-content">
              <span className="boot-monogram">{profile.monogram}</span>
              <span className="boot-progress">
                <span />
              </span>
            </div>
          </div>
        </div>
        <div className="boot-base" />
      </div>
      <div className="boot-footer">
        <span className="boot-hint-desktop">Click or press any key to skip</span>
        <span className="boot-hint-phone">Tap to skip</span>
        <a href="/simple" tabIndex={-1}>
          Simple version
        </a>
      </div>
    </div>
  )
}
