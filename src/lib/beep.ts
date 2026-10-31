let sharedAudioContext: AudioContext | null = null

function getOrCreateAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') {
    return null
  }
  if (sharedAudioContext && sharedAudioContext.state !== 'closed') {
    return sharedAudioContext
  }

  const AudioCtx =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext
  if (!AudioCtx) {
    return null
  }

  try {
    sharedAudioContext = new AudioCtx()
    return sharedAudioContext
  } catch {
    return null
  }
}

/**
 * Creates or resumes the shared AudioContext inside a user gesture
 * (such as the Timer Start button click) so browsers allow audio playback when the timer finishes.
 */
export function unlockAudioContext(): void {
  try {
    const ctx = getOrCreateAudioContext()
    if (ctx && ctx.state === 'suspended') {
      void ctx.resume().catch(() => {
        // Ignore resume errors when blocked by browser policy
      })
    }
  } catch {
    // Ignore Web Audio errors
  }
}

/**
 * Plays a short two-tone completion chime using the Web Audio API.
 */
export function playTimerBeep(): void {
  try {
    const ctx = getOrCreateAudioContext()
    if (!ctx) {
      return
    }

    if (ctx.state === 'suspended') {
      void ctx.resume().catch(() => {
        // Ignore if browser blocks resume without gesture
      })
    }

    const now = ctx.currentTime
    const notes = [
      { freq: 880, startOffset: 0, duration: 0.16 },
      { freq: 1174.66, startOffset: 0.2, duration: 0.28 },
    ]

    for (const note of notes) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(note.freq, now + note.startOffset)

      gain.gain.setValueAtTime(0.0001, now + note.startOffset)
      gain.gain.exponentialRampToValueAtTime(
        0.22,
        now + note.startOffset + 0.02,
      )
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        now + note.startOffset + note.duration,
      )

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.onended = () => {
        osc.disconnect()
        gain.disconnect()
      }

      osc.start(now + note.startOffset)
      osc.stop(now + note.startOffset + note.duration + 0.02)
    }
  } catch {
    // Ignore Web Audio playback errors
  }
}

/**
 * Closes and cleans up the shared AudioContext on unmount.
 */
export function closeAudioContext(): void {
  if (!sharedAudioContext) {
    return
  }
  try {
    if (sharedAudioContext.state !== 'closed') {
      void sharedAudioContext.close().catch(() => {
        // Ignore close errors
      })
    }
  } catch {
    // Ignore close errors
  } finally {
    sharedAudioContext = null
  }
}
