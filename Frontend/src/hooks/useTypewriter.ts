import { useEffect, useRef, useState } from "react";

// Reveals `text` progressively instead of all at once. When `enabled` is
// false, the full text is shown immediately (used for already-seen messages
// so history doesn't replay the animation on every render).
export const useTypewriter = (
  text: string,
  enabled: boolean,
  onDone?: () => void,
  charsPerTick = 3,
  intervalMs = 16,
) => {
  const [revealedChars, setRevealedChars] = useState(() =>
    enabled ? 0 : text.length,
  );
  const onDoneRef = useRef(onDone);

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    if (!enabled) return;

    const id = setInterval(() => {
      setRevealedChars((prev) => {
        const next = prev + charsPerTick;
        if (next >= text.length) {
          clearInterval(id);
          onDoneRef.current?.();
          return text.length;
        }
        return next;
      });
    }, intervalMs);

    return () => clearInterval(id);
  }, [text, enabled, charsPerTick, intervalMs]);

  return enabled ? text.slice(0, revealedChars) : text;
};
