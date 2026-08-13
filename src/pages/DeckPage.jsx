import { useRef, useState } from 'react'
import { Maximize2, ExternalLink, Presentation, X } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/Button'

/**
 * The investment case, shown inside the platform.
 *
 * The deck is a self-contained page under /deck/, the same files published
 * to here.now, so there is one deck rather than two that can disagree. It
 * runs in an iframe here: its own keyboard handling, its own live read of
 * the register, no styles crossing either way.
 *
 * Two modes, because a deck is used two ways. Docked, it sits in the page
 * as a reference a member can scroll while talking. Presenting, it takes
 * the whole screen — which is what the Command Centre wall needs.
 */
export function DeckPage() {
  const [presenting, setPresenting] = useState(false)
  const frame = useRef(null)

  // Focus the frame after switching, so arrow keys reach the deck rather
  // than scrolling the page behind it.
  const focusDeck = () => setTimeout(() => frame.current?.contentWindow?.focus(), 120)

  const present = () => {
    setPresenting(true)
    focusDeck()
    document.documentElement.requestFullscreen?.().catch(() => {})
  }

  const dock = () => {
    setPresenting(false)
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
  }

  const deck = (
    <iframe
      ref={frame}
      src="/deck/index.html"
      title="GovernIQ — the investment case put to the Regional Assembly"
      className="w-full h-full border-0 bg-[#0A1610]"
      allow="fullscreen"
    />
  )

  if (presenting) {
    return (
      <div className="fixed inset-0 z-[80] bg-[#0A1610]">
        {deck}
        <button
          onClick={dock}
          className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] bg-black/45 text-white/70 hover:text-white hover:bg-black/70 backdrop-blur transition"
          aria-label="Leave presentation"
        >
          <X size={15} />
          <span className="mono text-[0.65rem] tracking-widest uppercase">Close</span>
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="The investment case"
        title="Slide deck"
        description="Twelve slides put to the Regional Executive Council for the FCFA 487.5 million envelope. The traction slide reads the live register, so the figures on screen are the ones a member can check by signing in."
        actions={
          <>
            <Button variant="outline" onClick={() => window.open('/deck/index.html', '_blank')}>
              <ExternalLink size={14} />
              New tab
            </Button>
            <Button onClick={present}>
              <Presentation size={14} />
              Present
            </Button>
          </>
        }
      />

      <div
        className="relative rounded-[4px] overflow-hidden border border-[color:var(--rule-firm)] shadow-[0_24px_60px_-30px_rgba(20,21,15,0.55)]"
        style={{ aspectRatio: '16 / 9' }}
      >
        {deck}
        <button
          onClick={present}
          className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] bg-black/45 text-white/75 hover:text-white hover:bg-black/70 backdrop-blur transition"
        >
          <Maximize2 size={13} />
          <span className="mono text-[0.65rem] tracking-widest uppercase">Full screen</span>
        </button>
      </div>

      <p className="text-xs text-[color:var(--sepia)] leading-relaxed">
        Inside the deck: <b className="text-[color:var(--ink)]">↑↓</b> to move,
        <b className="text-[color:var(--ink)]"> G</b> for the slide map,
        <b className="text-[color:var(--ink)]"> F</b> for full screen. Click the
        deck once before using the keyboard.
      </p>
    </div>
  )
}
