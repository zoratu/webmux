// webmux-local: touch-scroll strip (fork-local feature; see docs/LOCAL_PATCHES.md)
import React from 'react';

export const SCROLL_STRIP_WIDTH = 20;

interface TerminalScrollStripProps {
  // delta is in pages: -1 = one screenful up, +1 = one screenful down.
  onScroll: (delta: number) => void;
}

/**
 * A thin vertical strip pinned to the right edge of a terminal tile, with an
 * up arrow near the top and a down arrow near the bottom — classic-xterm style.
 * Used on touch devices where xterm's touch-drag scrollback is unreliable.
 */
export function TerminalScrollStrip({ onScroll }: TerminalScrollStripProps) {
  // Prevent the button from stealing focus/selection from the terminal on tap.
  const hold = (e: React.MouseEvent) => e.preventDefault();
  return (
    <div style={styles.strip}>
      <button
        style={styles.arrow}
        onMouseDown={hold}
        onClick={() => onScroll(-1)}
        title="Scroll up"
        aria-label="Scroll up"
      >&#9650;</button>
      <button
        style={styles.arrow}
        onMouseDown={hold}
        onClick={() => onScroll(1)}
        title="Scroll down"
        aria-label="Scroll down"
      >&#9660;</button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  strip: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: SCROLL_STRIP_WIDTH,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'rgba(20, 20, 40, 0.55)',
    borderLeft: '1px solid #333366',
    zIndex: 5,
  },
  arrow: {
    background: 'none',
    border: 'none',
    color: '#8888cc',
    fontSize: 12,
    lineHeight: 1,
    cursor: 'pointer',
    padding: '6px 0',
    width: '100%',
    flex: '0 0 auto',
  },
};
