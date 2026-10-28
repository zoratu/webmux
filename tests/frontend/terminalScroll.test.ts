import { describe, expect, it, vi } from 'vitest';
import type { Terminal } from '@xterm/xterm';
import { scrollTerminalPages } from '@frontend/utils/terminalScroll';

// Minimal xterm stub exposing only what scrollTerminalPages touches.
function stubTerm(viewportY: number, baseY: number) {
  return {
    scrollPages: vi.fn(),
    buffer: { active: { viewportY, baseY } },
  } as unknown as Terminal;
}

describe('scrollTerminalPages', () => {
  it('scrolls up by whole pages and marks the view as user-controlled', () => {
    const term = stubTerm(100, 100);
    const userScrolled = { current: false };
    scrollTerminalPages(term, -1, userScrolled);
    expect(term.scrollPages).toHaveBeenCalledWith(-1);
    expect(userScrolled.current).toBe(true);
  });

  it('keeps the user-controlled flag set when scrolling down but still above the base', () => {
    const term = stubTerm(40, 100); // viewportY < baseY => not yet at bottom
    const userScrolled = { current: true };
    scrollTerminalPages(term, 1, userScrolled);
    expect(term.scrollPages).toHaveBeenCalledWith(1);
    expect(userScrolled.current).toBe(true);
  });

  it('clears the user-controlled flag once scrolled back to the bottom', () => {
    const term = stubTerm(100, 100); // viewportY >= baseY => at bottom
    const userScrolled = { current: true };
    scrollTerminalPages(term, 1, userScrolled);
    expect(term.scrollPages).toHaveBeenCalledWith(1);
    expect(userScrolled.current).toBe(false);
  });

  it('does nothing for a zero delta', () => {
    const term = stubTerm(100, 100);
    const userScrolled = { current: false };
    scrollTerminalPages(term, 0, userScrolled);
    expect(term.scrollPages).not.toHaveBeenCalled();
    expect(userScrolled.current).toBe(false);
  });
});
