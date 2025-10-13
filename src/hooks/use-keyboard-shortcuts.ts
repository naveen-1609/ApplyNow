'use client';

import { useEffect, useCallback } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    shortcuts.forEach(({ key, ctrlKey, shiftKey, altKey, metaKey, action }) => {
      const isCtrlPressed = ctrlKey ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
      const isShiftPressed = shiftKey ? event.shiftKey : !event.shiftKey;
      const isAltPressed = altKey ? event.altKey : !event.altKey;
      const isMetaPressed = metaKey ? event.metaKey : !event.metaKey;
      
      if (
        event.key.toLowerCase() === key.toLowerCase() &&
        isCtrlPressed &&
        isShiftPressed &&
        isAltPressed &&
        isMetaPressed
      ) {
        // Don't trigger if user is typing in an input
        const target = event.target as HTMLElement;
        if (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.contentEditable === 'true'
        ) {
          return;
        }
        
        event.preventDefault();
        action();
      }
    });
  }, [shortcuts]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// Common keyboard shortcuts for the profile page
export const useProfileKeyboardShortcuts = (handlers: {
  onSave?: () => void;
  onNewNote?: () => void;
  onInsertLink?: () => void;
  onAddTag?: () => void;
  onTogglePreview?: () => void;
  onTogglePin?: () => void;
  onToggleShare?: () => void;
}) => {
  const shortcuts: KeyboardShortcut[] = [
    {
      key: 's',
      ctrlKey: true,
      action: () => handlers.onSave?.(),
      description: 'Save note',
    },
    {
      key: 'p',
      ctrlKey: true,
      shiftKey: true,
      action: () => handlers.onNewNote?.(),
      description: 'New note',
    },
    {
      key: 'k',
      ctrlKey: true,
      action: () => handlers.onInsertLink?.(),
      description: 'Insert link',
    },
    {
      key: 'Enter',
      ctrlKey: true,
      action: () => handlers.onAddTag?.(),
      description: 'Add tag',
    },
    {
      key: 'p',
      ctrlKey: true,
      action: () => handlers.onTogglePreview?.(),
      description: 'Toggle preview',
    },
    {
      key: 'p',
      ctrlKey: true,
      altKey: true,
      action: () => handlers.onTogglePin?.(),
      description: 'Toggle pin',
    },
    {
      key: 's',
      ctrlKey: true,
      shiftKey: true,
      action: () => handlers.onToggleShare?.(),
      description: 'Toggle share',
    },
  ];

  useKeyboardShortcuts(shortcuts);
};
