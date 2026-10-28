// webmux-local: touch-scroll helper (fork-local feature; see docs/LOCAL_PATCHES.md)
import type { Terminal } from '@xterm/xterm';

// A minimal mutable holder, compatible with React's MutableRefObject<boolean>.
export interface BooleanRef {
  current: boolean;
}

/**
 * Scroll the terminal by whole pages and keep the "user has scrolled up" flag
 * (which pauses auto-scroll-on-output) consistent with the wheel handler:
 * scrolling up marks the view as user-controlled; scrolling back to the bottom
 * clears it so new output resumes following the tail.
 *
 * `delta` is in pages: -1 = one screenful up, +1 = one screenful down.
 */
export function scrollTerminalPages(term: Terminal, delta: number, userScrolled: BooleanRef): void {
  if (delta === 0) return;
  term.scrollPages(delta);
  if (delta < 0) {
    userScrolled.current = true;
  } else if (term.buffer.active.viewportY >= term.buffer.active.baseY) {
    userScrolled.current = false;
  }
}
