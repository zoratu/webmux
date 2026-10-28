import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { forwardRef, useImperativeHandle } from 'react';
import { Tile } from '@frontend/components/Tile';
import { InputBroadcastProvider } from '@frontend/contexts/InputBroadcastContext';
import type { Session } from '@frontend/types';
import type { ReactNode } from 'react';

// webmux-local: touch-scroll — control the touch-viewport gate and spy on scrollPages.
const touchMocks = vi.hoisted(() => ({ touchLike: false, scrollPages: vi.fn() }));

vi.mock('@frontend/utils/viewport', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@frontend/utils/viewport')>();
  return { ...actual, useTouchLikeViewport: () => touchMocks.touchLike };
});

vi.mock('@frontend/components/Terminal', () => ({
  Terminal: forwardRef(({ sessionId }: { sessionId: string }, ref) => {
    useImperativeHandle(ref, () => ({ scrollPages: touchMocks.scrollPages }));
    return <div data-testid={`terminal-${sessionId}`}>Terminal Mock</div>;
  }),
}));

beforeEach(() => {
  touchMocks.touchLike = false;
  touchMocks.scrollPages.mockClear();
});

const wrapper = ({ children }: { children: ReactNode }) => (
  <InputBroadcastProvider>{children}</InputBroadcastProvider>
);

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: 's1',
    kind: 'terminal',
    minimized: false,
    owner: 'testuser',
    transport: 'ssh',
    host_id: '',
    hostname: 'example.com',
    username: 'user',
    key_id: '',
    cols: 80,
    rows: 24,
    row: 0,
    col: 0,
    state: 'connected',
    created_at: '',
    updated_at: '',
    title: 'user@example.com',
    persistent: true,
    ...overrides,
  };
}

describe('Tile', () => {
  it('renders session title and transport badge', () => {
    render(
      <Tile
        session={makeSession()}
        fontSize={14}
        autoScroll={true}
        onAutoScrollToggle={vi.fn()}
        locked={false}
        onLockToggle={vi.fn()}
        collapsed={false}
        onToggleCollapse={vi.fn()}
        onBell={vi.fn()}
        onClose={vi.fn()}
        onReconnect={vi.fn()}
        onRename={vi.fn()}
      />,
      { wrapper },
    );
    expect(screen.getByText('user@example.com')).toBeDefined();
    expect(screen.getByText('SSH')).toBeDefined();
  });

  it('renders MOSH transport badge', () => {
    render(
      <Tile
        session={makeSession({ transport: 'mosh' })}
        fontSize={14}
        autoScroll={true}
        onAutoScrollToggle={vi.fn()}
        locked={false}
        onLockToggle={vi.fn()}
        collapsed={false}
        onToggleCollapse={vi.fn()}
        onBell={vi.fn()}
        onClose={vi.fn()}
        onReconnect={vi.fn()}
        onRename={vi.fn()}
      />,
      { wrapper },
    );
    expect(screen.getByText('MOSH')).toBeDefined();
  });

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn();
    render(
      <Tile
        session={makeSession()}
        fontSize={14}
        onClose={onClose}
        onReconnect={vi.fn()}
        onRename={vi.fn()}
      />,
      { wrapper },
    );
    fireEvent.click(screen.getByTitle('Close'));
    expect(onClose).toHaveBeenCalledWith('s1');
  });

  it('shows reconnect button for disconnected sessions', () => {
    render(
      <Tile
        session={makeSession({ state: 'disconnected' })}
        fontSize={14}
        autoScroll={true}
        onAutoScrollToggle={vi.fn()}
        locked={false}
        onLockToggle={vi.fn()}
        collapsed={false}
        onToggleCollapse={vi.fn()}
        onBell={vi.fn()}
        onClose={vi.fn()}
        onReconnect={vi.fn()}
        onRename={vi.fn()}
      />,
      { wrapper },
    );
    expect(screen.getByTitle('Reconnect')).toBeDefined();
  });

  it('calls onReconnect when reconnect button clicked', () => {
    const onReconnect = vi.fn();
    render(
      <Tile
        session={makeSession({ state: 'disconnected' })}
        fontSize={14}
        onClose={vi.fn()}
        onReconnect={onReconnect}
        onRename={vi.fn()}
      />,
      { wrapper },
    );
    fireEvent.click(screen.getByTitle('Reconnect'));
    expect(onReconnect).toHaveBeenCalledWith('s1');
  });

  it('shows a prominent reconnect action in a disconnected terminal', () => {
    const onReconnect = vi.fn();
    render(
      <Tile
        session={makeSession({ state: 'disconnected' })}
        fontSize={14}
        onClose={vi.fn()}
        onReconnect={onReconnect}
        onRename={vi.fn()}
      />,
      { wrapper },
    );

    const reconnect = screen.getByRole('button', { name: 'Reconnect' });
    expect(reconnect.textContent).toBe('\u21bb');
    fireEvent.click(reconnect);
    expect(onReconnect).toHaveBeenCalledWith('s1');
  });

  it('hides the prominent reconnect action when reconnection starts', () => {
    const props = {
      fontSize: 14,
      onClose: vi.fn(),
      onReconnect: vi.fn(),
      onRename: vi.fn(),
    };
    const { rerender } = render(
      <Tile session={makeSession({ state: 'disconnected' })} {...props} />,
      { wrapper },
    );

    rerender(<Tile session={makeSession({ state: 'connecting' })} {...props} />);
    expect(screen.queryByText('\u21bb')).toBeNull();
  });

  it('does not show reconnect for connected sessions', () => {
    render(
      <Tile
        session={makeSession({ state: 'connected' })}
        fontSize={14}
        autoScroll={true}
        onAutoScrollToggle={vi.fn()}
        locked={false}
        onLockToggle={vi.fn()}
        collapsed={false}
        onToggleCollapse={vi.fn()}
        onBell={vi.fn()}
        onClose={vi.fn()}
        onReconnect={vi.fn()}
        onRename={vi.fn()}
      />,
      { wrapper },
    );
    expect(screen.queryByTitle('Reconnect')).toBeNull();
  });

  it('shows error state reconnect button', () => {
    render(
      <Tile
        session={makeSession({ state: 'error' })}
        fontSize={14}
        autoScroll={true}
        onAutoScrollToggle={vi.fn()}
        locked={false}
        onLockToggle={vi.fn()}
        collapsed={false}
        onToggleCollapse={vi.fn()}
        onBell={vi.fn()}
        onClose={vi.fn()}
        onReconnect={vi.fn()}
        onRename={vi.fn()}
      />,
      { wrapper },
    );
    expect(screen.getByTitle('Reconnect')).toBeDefined();
  });

  it('renders terminal mock', () => {
    render(
      <Tile
        session={makeSession()}
        fontSize={14}
        autoScroll={true}
        onAutoScrollToggle={vi.fn()}
        locked={false}
        onLockToggle={vi.fn()}
        collapsed={false}
        onToggleCollapse={vi.fn()}
        onBell={vi.fn()}
        onClose={vi.fn()}
        onReconnect={vi.fn()}
        onRename={vi.fn()}
      />,
      { wrapper },
    );
    expect(screen.getByTestId('terminal-s1')).toBeDefined();
  });

  it('renders scroll-to-bottom button', () => {
    render(
      <Tile
        session={makeSession()}
        fontSize={14}
        autoScroll={true}
        onAutoScrollToggle={vi.fn()}
        locked={false}
        onLockToggle={vi.fn()}
        collapsed={false}
        onToggleCollapse={vi.fn()}
        onBell={vi.fn()}
        onClose={vi.fn()}
        onReconnect={vi.fn()}
        onRename={vi.fn()}
      />,
      { wrapper },
    );
    expect(screen.getByTitle('Scroll to bottom')).toBeDefined();
  });

  it('calls onTitleMouseDown when chrome dragged', () => {
    const onTitleMouseDown = vi.fn();
    render(
      <Tile
        session={makeSession()}
        fontSize={14}
        autoScroll={true}
        onAutoScrollToggle={vi.fn()}
        locked={false}
        onLockToggle={vi.fn()}
        collapsed={false}
        onToggleCollapse={vi.fn()}
        onBell={vi.fn()}
        onClose={vi.fn()}
        onReconnect={vi.fn()}
        onRename={vi.fn()}
        onTitleMouseDown={onTitleMouseDown}
      />,
      { wrapper },
    );
    // Fire mousedown on the chrome (not a button) — title includes rename hint
    const chrome = screen.getByTitle('user@example.com (double-click to rename)').closest('[style]')!.parentElement!;
    fireEvent.mouseDown(chrome);
    expect(onTitleMouseDown).toHaveBeenCalledWith('s1', expect.any(Object));
  });

  // webmux-local: touch-scroll
  const baseProps = {
    fontSize: 14,
    autoScroll: true,
    onAutoScrollToggle: vi.fn(),
    locked: false,
    onLockToggle: vi.fn(),
    collapsed: false,
    onToggleCollapse: vi.fn(),
    onBell: vi.fn(),
    onClose: vi.fn(),
    onReconnect: vi.fn(),
    onRename: vi.fn(),
  };

  it('hides the scroll arrows on a non-touch (desktop) viewport', () => {
    touchMocks.touchLike = false;
    render(<Tile session={makeSession()} {...baseProps} />, { wrapper });
    expect(screen.queryByLabelText('Scroll up')).toBeNull();
    expect(screen.queryByLabelText('Scroll down')).toBeNull();
  });

  it('shows the scroll arrows on a touch viewport and wires them to scrollPages', () => {
    touchMocks.touchLike = true;
    render(<Tile session={makeSession()} {...baseProps} />, { wrapper });
    fireEvent.click(screen.getByLabelText('Scroll up'));
    expect(touchMocks.scrollPages).toHaveBeenCalledWith(-1);
    fireEvent.click(screen.getByLabelText('Scroll down'));
    expect(touchMocks.scrollPages).toHaveBeenCalledWith(1);
  });
});
