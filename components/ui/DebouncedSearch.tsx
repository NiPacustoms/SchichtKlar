'use client';

import React, { memo, useState, useEffect, useCallback } from 'react';
import { TextField, InputAdornment, IconButton } from '@mui/material';
import { Search, Clear } from '@mui/icons-material';

interface DebouncedSearchProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  debounceMs?: number;
  initialValue?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  size?: 'small' | 'medium';
  variant?: 'outlined' | 'filled' | 'standard';
  className?: string;
}

export const DebouncedSearch = memo<DebouncedSearchProps>(
  ({
    onSearch,
    placeholder = 'Suchen...',
    debounceMs = 300,
    initialValue = '',
    disabled = false,
    fullWidth = true,
    size = 'medium',
    variant = 'outlined',
    className,
  }) => {
    const [query, setQuery] = useState(initialValue);
    const [debouncedQuery, setDebouncedQuery] = useState(initialValue);

    // Debounce the search query
    useEffect(() => {
      const timer = setTimeout(() => {
        setDebouncedQuery(query);
      }, debounceMs);

      return () => clearTimeout(timer);
    }, [query, debounceMs]);

    // Call onSearch when debounced query changes
    useEffect(() => {
      onSearch(debouncedQuery);
    }, [debouncedQuery, onSearch]);

    const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
      setQuery(event.target.value);
    }, []);

    const handleClear = useCallback(() => {
      setQuery('');
    }, []);

    return (
      <TextField
        value={query}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        fullWidth={fullWidth}
        size={size}
        variant={variant}
        className={className}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search sx={{ color: 'text.secondary', fontSize: 20 }} />
            </InputAdornment>
          ),
          endAdornment: query && (
            <InputAdornment position="end">
              <IconButton
                onClick={handleClear}
                aria-label="Suche löschen"
                size="small"
                edge="end"
                sx={{
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                  },
                }}
              >
                <Clear />
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            backgroundColor: 'background.paper',
          },
        }}
      />
    );
  }
);

DebouncedSearch.displayName = 'DebouncedSearch';

export default DebouncedSearch;
