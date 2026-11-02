import { forwardRef, useLayoutEffect, useRef } from 'react';
import type { TextareaHTMLAttributes } from 'react';

type AutoHeightTextareaProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  'onChange' | 'value'
> & {
  value: string;
  onChange: (value: string) => void;
};

const AutoHeightTextarea = forwardRef<
  HTMLTextAreaElement,
  AutoHeightTextareaProps
>(function AutoHeightTextarea(
  { className, onInput, value, onChange, rows = 1, ...props },
  forwardedRef
) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const resizeTextarea = () => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    textarea.style.height = '0px';
    const style = window.getComputedStyle(textarea);
    const padding =
      parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
    const border =
      parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
    const height =
      style.boxSizing === 'border-box'
        ? textarea.scrollHeight + border
        : textarea.scrollHeight - padding;
    textarea.style.height = `${height}px`;
  };

  useLayoutEffect(() => {
    resizeTextarea();
  }, [value]);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    let disposed = false;
    let width = textarea.getBoundingClientRect().width;
    const resizeForWidth = () => {
      const nextWidth = textarea.getBoundingClientRect().width;
      if (nextWidth === width) return;
      width = nextWidth;
      resizeTextarea();
    };
    // Observe width only: changing our own height must not trigger a resize loop.
    const observer =
      typeof ResizeObserver === 'undefined'
        ? undefined
        : new ResizeObserver(resizeForWidth);
    observer?.observe(textarea);
    window.addEventListener('resize', resizeForWidth);
    const resizeForFonts = () => {
      if (!disposed) resizeTextarea();
    };
    const fonts = document.fonts;
    void fonts?.ready.then(resizeForFonts);
    fonts?.addEventListener('loadingdone', resizeForFonts);
    return () => {
      disposed = true;
      observer?.disconnect();
      window.removeEventListener('resize', resizeForWidth);
      fonts?.removeEventListener('loadingdone', resizeForFonts);
    };
  }, []);

  return (
    <textarea
      {...props}
      ref={(node) => {
        textareaRef.current = node;

        if (!forwardedRef) {
          return;
        }

        if (typeof forwardedRef === 'function') {
          forwardedRef(node);
          return;
        }

        forwardedRef.current = node;
      }}
      rows={rows}
      className={className}
      value={value}
      onInput={(event) => {
        resizeTextarea();
        onInput?.(event);
      }}
      onChange={(event) => onChange(event.target.value)}
    />
  );
});

export default AutoHeightTextarea;
