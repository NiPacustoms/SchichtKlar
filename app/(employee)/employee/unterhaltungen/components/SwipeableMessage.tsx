'use client';

import { Box, IconButton } from '@mui/material';
import { Delete as DeleteIcon, Reply as ReplyIcon } from '@mui/icons-material';
import React, { useRef, useState, useEffect } from 'react';

interface SwipeableMessageProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftAction?: 'reply' | 'delete' | 'none';
  rightAction?: 'reply' | 'delete' | 'none';
  disabled?: boolean;
}

export default function SwipeableMessage({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction = 'none',
  rightAction = 'reply',
  disabled = false,
}: SwipeableMessageProps) {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const SWIPE_THRESHOLD = 100;
  const MAX_SWIPE = 80;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || disabled) return;

    const currentX = e.touches[0].clientX;
    const diff = currentX - startX;

    // Determine swipe direction and limit
    if (diff > 0 && rightAction !== 'none') {
      // Swipe right
      setSwipeOffset(Math.min(diff, MAX_SWIPE));
    } else if (diff < 0 && leftAction !== 'none') {
      // Swipe left
      setSwipeOffset(Math.max(diff, -MAX_SWIPE));
    }
  };

  const handleTouchEnd = () => {
    if (disabled) return;

    if (Math.abs(swipeOffset) > SWIPE_THRESHOLD) {
      if (swipeOffset > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (swipeOffset < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    }

    // Reset
    setSwipeOffset(0);
    setIsDragging(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    setIsDragging(true);
    setStartX(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || disabled) return;

    const currentX = e.clientX;
    const diff = currentX - startX;

    if (diff > 0 && rightAction !== 'none') {
      setSwipeOffset(Math.min(diff, MAX_SWIPE));
    } else if (diff < 0 && leftAction !== 'none') {
      setSwipeOffset(Math.max(diff, -MAX_SWIPE));
    }
  };

  const handleMouseUp = () => {
    if (disabled) return;

    if (Math.abs(swipeOffset) > SWIPE_THRESHOLD) {
      if (swipeOffset > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (swipeOffset < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    }

    setSwipeOffset(0);
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        if (!containerRef.current) return;
        containerRef.current.getBoundingClientRect(); // Get rect for bounds check
        const currentX = e.clientX;
        const diff = currentX - startX;

        if (diff > 0 && rightAction !== 'none') {
          setSwipeOffset(Math.min(diff, MAX_SWIPE));
        } else if (diff < 0 && leftAction !== 'none') {
          setSwipeOffset(Math.max(diff, -MAX_SWIPE));
        }
      };

      const handleGlobalMouseUp = () => {
        if (Math.abs(swipeOffset) > SWIPE_THRESHOLD) {
          if (swipeOffset > 0 && onSwipeRight) {
            onSwipeRight();
          } else if (swipeOffset < 0 && onSwipeLeft) {
            onSwipeLeft();
          }
        }

        setSwipeOffset(0);
        setIsDragging(false);
      };

      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isDragging, startX, swipeOffset, onSwipeLeft, onSwipeRight, rightAction, leftAction]);

  const renderAction = (action: 'reply' | 'delete' | 'none', side: 'left' | 'right') => {
    if (action === 'none') return null;

    const isVisible = side === 'right' ? swipeOffset > 0 : swipeOffset < 0;
    const opacity = Math.min(Math.abs(swipeOffset) / MAX_SWIPE, 1);

    return (
      <Box
        sx={{
          position: 'absolute',
          [side]: 0,
          top: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: MAX_SWIPE,
          backgroundColor: action === 'delete' ? '#f44336' : '#1976d2',
          opacity: isVisible ? opacity : 0,
          transition: isDragging ? 'none' : 'opacity 0.2s',
          zIndex: 0,
        }}
      >
        <IconButton
          sx={{
            color: 'white',
            pointerEvents: 'none',
          }}
        >
          {action === 'delete' ? <DeleteIcon /> : <ReplyIcon />}
        </IconButton>
      </Box>
    );
  };

  return (
    <Box
      ref={containerRef}
      sx={{
        position: 'relative',
        touchAction: 'pan-y',
        userSelect: 'none',
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {renderAction(leftAction, 'left')}
      {renderAction(rightAction, 'right')}
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          transform: `translateX(${swipeOffset}px)`,
          transition: isDragging ? 'none' : 'transform 0.2s ease-out',
          backgroundColor: 'transparent',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
