'use client';

import React, { memo, useMemo, useCallback, useState, useEffect } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { User } from '@/lib/types';

interface VirtualizedListProps {
  items: User[];
  itemHeight?: number;
  containerHeight?: number;
  renderItem: (item: User, index: number) => React.ReactNode;
  loading?: boolean;
  emptyMessage?: string;
}

export const VirtualizedList = memo<VirtualizedListProps>(
  ({
    items,
    itemHeight = 80,
    containerHeight = 400,
    renderItem,
    loading = false,
    emptyMessage = 'Keine Einträge gefunden',
  }) => {
    const [scrollTop, setScrollTop] = useState(0);
    const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null);

    const visibleRange = useMemo(() => {
      const startIndex = Math.floor(scrollTop / itemHeight);
      const endIndex = Math.min(
        startIndex + Math.ceil(containerHeight / itemHeight) + 1,
        items.length
      );
      return { startIndex, endIndex };
    }, [scrollTop, itemHeight, containerHeight, items.length]);

    const visibleItems = useMemo(() => {
      return items.slice(visibleRange.startIndex, visibleRange.endIndex);
    }, [items, visibleRange]);

    const totalHeight = items.length * itemHeight;

    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(e.currentTarget.scrollTop);
    }, []);

    useEffect(() => {
      if (containerRef) {
        const handleResize = () => {
          // Trigger re-render on resize
          setScrollTop(containerRef?.scrollTop || 0);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
      }
    }, [containerRef]);

    if (loading) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" height={containerHeight}>
          <CircularProgress />
        </Box>
      );
    }

    if (items.length === 0) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" height={containerHeight}>
          <Typography variant="body1" color="text.secondary">
            {emptyMessage}
          </Typography>
        </Box>
      );
    }

    return (
      <Box
        ref={setContainerRef}
        height={containerHeight}
        overflow="auto"
        onScroll={handleScroll}
        sx={{
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'rgba(0,0,0,0.1)',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '4px',
            '&:hover': {
              background: 'rgba(0,0,0,0.5)',
            },
          },
        }}
      >
        <Box height={totalHeight} position="relative">
          <Box position="absolute" top={visibleRange.startIndex * itemHeight} width="100%">
            {visibleItems.map((item, index) => (
              <Box key={item.id} height={itemHeight} display="flex" alignItems="center">
                {renderItem(item, visibleRange.startIndex + index)}
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    );
  }
);

VirtualizedList.displayName = 'VirtualizedList';

export default VirtualizedList;
