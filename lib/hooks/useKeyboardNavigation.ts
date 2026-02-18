'use client';

import { useEffect, useCallback, useRef } from 'react';

interface KeyboardNavigationOptions {
  onEnter?: () => void;
  onEscape?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onTab?: () => void;
  onShiftTab?: () => void;
  onSpace?: () => void;
  onDelete?: () => void;
  onBackspace?: () => void;
  disabled?: boolean;
  preventDefault?: boolean;
}

export function useKeyboardNavigation({
  onEnter,
  onEscape,
  onArrowUp,
  onArrowDown,
  onArrowLeft,
  onArrowRight,
  onTab,
  onShiftTab,
  onSpace,
  onDelete,
  onBackspace,
  disabled = false,
  preventDefault = true
}: KeyboardNavigationOptions = {}) {
  const elementRef = useRef<HTMLElement>(null);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (disabled) return;

    const { key, shiftKey, ctrlKey, altKey, metaKey } = event;

    // Don't interfere with modifier key combinations
    if (ctrlKey || altKey || metaKey) return;

    switch (key) {
      case 'Enter':
        if (onEnter) {
          if (preventDefault) event.preventDefault();
          onEnter();
        }
        break;
      
      case 'Escape':
        if (onEscape) {
          if (preventDefault) event.preventDefault();
          onEscape();
        }
        break;
      
      case 'ArrowUp':
        if (onArrowUp) {
          if (preventDefault) event.preventDefault();
          onArrowUp();
        }
        break;
      
      case 'ArrowDown':
        if (onArrowDown) {
          if (preventDefault) event.preventDefault();
          onArrowDown();
        }
        break;
      
      case 'ArrowLeft':
        if (onArrowLeft) {
          if (preventDefault) event.preventDefault();
          onArrowLeft();
        }
        break;
      
      case 'ArrowRight':
        if (onArrowRight) {
          if (preventDefault) event.preventDefault();
          onArrowRight();
        }
        break;
      
      case 'Tab':
        if (shiftKey && onShiftTab) {
          if (preventDefault) event.preventDefault();
          onShiftTab();
        } else if (!shiftKey && onTab) {
          if (preventDefault) event.preventDefault();
          onTab();
        }
        break;
      
      case ' ':
        if (onSpace) {
          if (preventDefault) event.preventDefault();
          onSpace();
        }
        break;
      
      case 'Delete':
        if (onDelete) {
          if (preventDefault) event.preventDefault();
          onDelete();
        }
        break;
      
      case 'Backspace':
        if (onBackspace) {
          if (preventDefault) event.preventDefault();
          onBackspace();
        }
        break;
    }
  }, [
    disabled,
    preventDefault,
    onEnter,
    onEscape,
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    onTab,
    onShiftTab,
    onSpace,
    onDelete,
    onBackspace
  ]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('keydown', handleKeyDown);
    return () => element.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return elementRef;
}

// Hook for managing focus within a component tree
export function useFocusManagement() {
  const focusableElementsRef = useRef<HTMLElement[]>([]);
  const currentIndexRef = useRef<number>(-1);

  const registerElement = useCallback((element: HTMLElement | null) => {
    if (!element) return;
    
    if (!focusableElementsRef.current.includes(element)) {
      focusableElementsRef.current.push(element);
    }
  }, []);

  const unregisterElement = useCallback((element: HTMLElement | null) => {
    if (!element) return;
    
    focusableElementsRef.current = focusableElementsRef.current.filter(
      el => el !== element
    );
  }, []);

  const focusNext = useCallback(() => {
    const elements = focusableElementsRef.current;
    if (elements.length === 0) return;

    currentIndexRef.current = (currentIndexRef.current + 1) % elements.length;
    elements[currentIndexRef.current]?.focus();
  }, []);

  const focusPrevious = useCallback(() => {
    const elements = focusableElementsRef.current;
    if (elements.length === 0) return;

    currentIndexRef.current = currentIndexRef.current <= 0 
      ? elements.length - 1 
      : currentIndexRef.current - 1;
    elements[currentIndexRef.current]?.focus();
  }, []);

  const focusFirst = useCallback(() => {
    const elements = focusableElementsRef.current;
    if (elements.length === 0) return;

    currentIndexRef.current = 0;
    elements[0]?.focus();
  }, []);

  const focusLast = useCallback(() => {
    const elements = focusableElementsRef.current;
    if (elements.length === 0) return;

    currentIndexRef.current = elements.length - 1;
    elements[elements.length - 1]?.focus();
  }, []);

  return {
    registerElement,
    unregisterElement,
    focusNext,
    focusPrevious,
    focusFirst,
    focusLast
  };
}

export default useKeyboardNavigation;
