/** @jest-environment jsdom */
import { act, render, screen } from '@testing-library/react';
import AutoHeightTextarea from '../components/tracker/AutoHeightTextarea';

test('remeasures after fonts load and width changes, without responding to its own height changes', async () => {
  let height = 100;
  let width = 200;
  let notifyResize: () => void = jest.fn();
  let resolveFonts: () => void = jest.fn();
  const fonts = new EventTarget();
  Object.defineProperty(fonts, 'ready', {
    value: new Promise<void>((resolve) => {
      resolveFonts = resolve;
    }),
  });
  const originalFonts = Object.getOwnPropertyDescriptor(document, 'fonts');
  const originalObserver = Object.getOwnPropertyDescriptor(
    window,
    'ResizeObserver'
  );
  Object.defineProperty(document, 'fonts', {
    configurable: true,
    value: fonts,
  });
  const disconnect = jest.fn();
  Object.defineProperty(window, 'ResizeObserver', {
    configurable: true,
    value: class {
      constructor(callback: () => void) {
        notifyResize = callback;
      }
      observe = jest.fn();
      disconnect = disconnect;
    },
  });
  const scrollHeight = jest
    .spyOn(HTMLTextAreaElement.prototype, 'scrollHeight', 'get')
    .mockImplementation(() => height);
  jest
    .spyOn(HTMLTextAreaElement.prototype, 'getBoundingClientRect')
    .mockImplementation(() => ({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: width,
      bottom: height,
      width,
      height,
      toJSON: () => ({}),
    }));
  try {
    const { unmount } = render(
      <AutoHeightTextarea
        value={'Long saved notes'}
        onChange={jest.fn()}
        style={{ boxSizing: 'border-box', padding: '4px', border: '1px solid' }}
      />
    );
    const textarea = screen.getByRole('textbox');
    expect(textarea.style.height).toBe('102px');
    height = 140;
    await act(async () => {
      resolveFonts();
    });
    expect(textarea.style.height).toBe('142px');
    height = 180;
    act(() => {
      notifyResize();
    });
    expect(textarea.style.height).toBe('142px');
    width = 150;
    act(() => {
      notifyResize();
    });
    expect(textarea.style.height).toBe('182px');
    height = 220;
    act(() => {
      fonts.dispatchEvent(new Event('loadingdone'));
    });
    expect(textarea.style.height).toBe('222px');
    unmount();
    expect(disconnect).toHaveBeenCalled();
    scrollHeight.mockClear();
    fonts.dispatchEvent(new Event('loadingdone'));
    expect(scrollHeight).not.toHaveBeenCalled();
  } finally {
    jest.restoreAllMocks();
    if (originalFonts) Object.defineProperty(document, 'fonts', originalFonts);
    else Reflect.deleteProperty(document, 'fonts');
    if (originalObserver)
      Object.defineProperty(window, 'ResizeObserver', originalObserver);
    else Reflect.deleteProperty(window, 'ResizeObserver');
  }
});
