# Local patches (fork divergence from upstream)

This fork (`zoratu/webmux`) carries a few changes that are **not** upstreamed. This file is the ledger
to consult **before and after** merging a new upstream release, so each change can be re-verified or
re-applied. Every edit to an upstream-maintained file is tagged with a greppable marker:

```
grep -rn 'webmux-local' webmux/
```

Base: these patches currently sit on upstream **v1.3.22**. Upstream is ahead (v1.3.28+); when catching
up, re-apply/verify each item below.

---

## 1. No auto-compaction on window close; compact on minimize instead

**Why:** closing a tile re-packed the whole grid (every tile moved); minimizing a tile instead left an
empty cell so the survivors appeared shifted right. Desired: closing/minimizing fills only the freed
gap and preserves row structure.

**Files (server + frontend):**
- `webmux/server/internal/session/broker.go` — added `visibleOwnerEntriesLocked` (excludes minimized +
  agent tiles); compact the *visible* set on delete (`deleteSession`) and on minimize (`Patch` with
  `Minimized==true`), with rollback on persist failure. `compact()` itself unchanged.
- `webmux/frontend/src/components/Workspace.tsx` — `handleToggleCollapse` re-fetches sessions after
  `setMinimized(true)` so compacted positions render.
- Test: `webmux/server/internal/session/broker_test.go` → `TestMinimizeCompactsVisibleTiles`.

**Note:** this predates the marker convention and is not tagged in-code; it's a logic change in the two
files above. Verify these call sites still exist after an upstream merge.

---

## 2. Touch/iPad scroll arrows on the terminal tile

**Why:** on iPad/iOS Safari there was no reliable way to scroll terminal scrollback (xterm touch-drag
is unreliable; the existing control only jumps to the bottom; shift-to-scroll needs a hardware key).
Adds an up/down arrow strip on the tile's right edge (classic-xterm style), one screenful per tap,
**shown only on touch viewports**.

**Mode-aware scrolling (`terminalScroll.ts`):** the arrows pick the mechanism from
`term.buffer.active.type`:
- **Alternate screen** (full-screen app — Claude Code, vim, less, tmux): xterm keeps no scrollback, so
  send **Page Up / Page Down** (`\x1b[5~` / `\x1b[6~`) to the session and let the app scroll its own
  history. This is the common case for these users and the reason the first cut (xterm `scrollPages`
  only) appeared to "do nothing."
- **Normal screen** (plain shell): scroll xterm's own 5000-line scrollback via `term.scrollPages`,
  keeping the auto-scroll-pause flag in sync with the wheel handler.

**New files we own (no upstream conflict surface):**
- `webmux/frontend/src/utils/terminalScroll.ts` — `scrollTerminalPages(term, delta, userScrolled)`:
  pages via xterm `scrollPages`, keeps the auto-scroll-pause flag consistent with the wheel handler.
- `webmux/frontend/src/components/TerminalScrollStrip.tsx` — the strip UI (`onScroll(delta)`),
  `SCROLL_STRIP_WIDTH`.
- Tests: `tests/frontend/terminalScroll.test.ts`, `tests/frontend/TerminalScrollStrip.test.tsx`.

**Marked edits to upstream files** (`grep -rn webmux-local`):
- `webmux/frontend/src/components/Terminal.tsx` — `scrollPages` added to `TerminalHandle` + its
  `useImperativeHandle` impl (delegates to `scrollTerminalPages`); import of the helper.
- `webmux/frontend/src/components/Tile.tsx` — imports `TerminalScrollStrip`/`SCROLL_STRIP_WIDTH` and
  `useTouchLikeViewport`; gates the strip + a right-inset `termRegion` wrapper on touch.
- Test wiring: `tests/frontend/Tile.test.tsx` (touch gate mocked; `scrollPages` spied).

**Re-apply after an upstream merge:** if upstream restructures `TerminalHandle`/`Tile`, re-add the
`scrollPages` handle member and the strip render/inset; the two new modules and their tests are
self-contained and should carry over untouched.
