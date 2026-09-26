import { useEffect, useRef } from 'react';

interface KeyboardShortcutHandlers {
  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSeekRelative: (offsetSeconds: number) => void;
  onVolumeChangeRelative?: (delta: number) => void;
  onToggleMute?: () => void;
  isEnabled?: boolean;
}

export function useKeyboardShortcuts({
  onTogglePlay,
  onPrev,
  onNext,
  onSeekRelative,
  onVolumeChangeRelative,
  onToggleMute,
  isEnabled = true,
}: KeyboardShortcutHandlers) {
  // Use refs to always invoke latest handlers without re-attaching listeners
  const handlersRef = useRef({
    onTogglePlay,
    onPrev,
    onNext,
    onSeekRelative,
    onVolumeChangeRelative,
    onToggleMute,
  });

  useEffect(() => {
    handlersRef.current = {
      onTogglePlay,
      onPrev,
      onNext,
      onSeekRelative,
      onVolumeChangeRelative,
      onToggleMute,
    };
  });

  useEffect(() => {
    if (!isEnabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Do not capture shortcuts when user is typing in form inputs, textareas, contenteditable or select
      const target = e.target as HTMLElement | null;
      if (target) {
        const isInputField =
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable;

        if (isInputField) {
          return;
        }
      }

      // Spacebar: Play / Pause
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        handlersRef.current.onTogglePlay();
        return;
      }

      // Arrow Left: Seek Backward (-5s, or -10s with Shift)
      if (e.code === 'ArrowLeft' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const offset = e.shiftKey ? -10 : -5;
        handlersRef.current.onSeekRelative(offset);
        return;
      }

      // Arrow Right: Seek Forward (+5s, or +10s with Shift)
      if (e.code === 'ArrowRight' || e.key === 'ArrowRight') {
        e.preventDefault();
        const offset = e.shiftKey ? 10 : 5;
        handlersRef.current.onSeekRelative(offset);
        return;
      }

      // Arrow Up: Volume Up
      if (e.code === 'ArrowUp' || e.key === 'ArrowUp') {
        if (handlersRef.current.onVolumeChangeRelative) {
          e.preventDefault();
          handlersRef.current.onVolumeChangeRelative(0.05);
        }
        return;
      }

      // Arrow Down: Volume Down
      if (e.code === 'ArrowDown' || e.key === 'ArrowDown') {
        if (handlersRef.current.onVolumeChangeRelative) {
          e.preventDefault();
          handlersRef.current.onVolumeChangeRelative(-0.05);
        }
        return;
      }

      // Mute toggle (Key M)
      if (e.code === 'KeyM' || e.key === 'm' || e.key === 'M') {
        if (!e.ctrlKey && !e.metaKey && handlersRef.current.onToggleMute) {
          e.preventDefault();
          handlersRef.current.onToggleMute();
        }
        return;
      }

      // Hardware / Keyboard Media Keys
      if (e.key === 'MediaPlayPause') {
        e.preventDefault();
        handlersRef.current.onTogglePlay();
        return;
      }

      if (e.key === 'MediaTrackNext') {
        e.preventDefault();
        handlersRef.current.onNext();
        return;
      }

      if (e.key === 'MediaTrackPrevious') {
        e.preventDefault();
        handlersRef.current.onPrev();
        return;
      }

      if (e.key === 'MediaStop') {
        e.preventDefault();
        handlersRef.current.onTogglePlay();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isEnabled]);
}
