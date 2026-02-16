import React, { memo, useMemo, useCallback } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Checkbox,
  Avatar,
  Chip,
  Typography,
  Divider,
} from '@mui/material';
import { LoadingSpinner } from './LoadingSpinner';
import { EmptyState } from './EmptyState';

interface OptimizedListItem {
  id: string;
  title: string;
  subtitle?: string;
  avatar?: string;
  icon?: React.ReactNode;
  status?: string;
  statusColor?: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  onSelect?: (id: string, selected: boolean) => void;
}

interface OptimizedListProps {
  items: OptimizedListItem[];
  loading?: boolean;
  emptyMessage?: string;
  emptyDescription?: string;
  onEmptyAction?: () => void;
  selectable?: boolean;
  onSelectionChange?: (selectedIds: string[]) => void;
  searchTerm?: string;
  className?: string;
}

const OptimizedListItemComponent = memo<{
  item: OptimizedListItem;
  onSelect?: (id: string, selected: boolean) => void;
  onClick?: (id: string) => void;
}>(({ item, onSelect, onClick }) => {
  const { id, onClick: itemOnClick } = item;

  const handleSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onSelect?.(id, event.target.checked);
    },
    [id, onSelect]
  );

  const handleClick = useCallback(() => {
    if (itemOnClick) {
      itemOnClick();
    } else if (onClick) {
      onClick?.(id);
    }
  }, [itemOnClick, onClick, id]);

  return (
    <ListItem disablePadding>
      <ListItemButton
        onClick={handleClick}
        disabled={item.disabled}
        sx={{
          '&:hover': {
            backgroundColor: 'action.hover',
          },
        }}
      >
        {item.onSelect && (
          <Checkbox
            checked={item.selected || false}
            onChange={handleSelect}
            onClick={e => e.stopPropagation()}
            sx={{ mr: 1 }}
          />
        )}

        {item.avatar && <Avatar src={item.avatar} sx={{ mr: 2, width: 40, height: 40 }} />}

        {item.icon && <ListItemIcon sx={{ mr: 2 }}>{item.icon}</ListItemIcon>}

        <ListItemText
          primary={item.title}
          secondary={item.subtitle}
          primaryTypographyProps={{
            fontWeight: 500,
          }}
          secondaryTypographyProps={{
            color: 'text.secondary',
          }}
        />

        {item.status && (
          <Chip
            label={item.status}
            color={item.statusColor || 'default'}
            size="small"
            sx={{ ml: 2 }}
          />
        )}
      </ListItemButton>
    </ListItem>
  );
});

OptimizedListItemComponent.displayName = 'OptimizedListItemComponent';

export const OptimizedList = memo<OptimizedListProps>(
  ({
    items,
    loading = false,
    emptyMessage = 'Keine Einträge',
    emptyDescription = 'Es sind keine Einträge verfügbar.',
    onEmptyAction,
    selectable = false,
    onSelectionChange,
    searchTerm = '',
    className = 'glass',
  }) => {
    const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

    const handleSelect = useCallback(
      (id: string, selected: boolean) => {
        setSelectedIds(prev => {
          const newSelection = selected ? [...prev, id] : prev.filter(itemId => itemId !== id);

          onSelectionChange?.(newSelection);
          return newSelection;
        });
      },
      [onSelectionChange]
    );

    const handleSelectAll = useCallback(
      (selected: boolean) => {
        const newSelection = selected ? items.map(item => item.id) : [];
        setSelectedIds(newSelection);
        onSelectionChange?.(newSelection);
      },
      [items, onSelectionChange]
    );

    const filteredItems = useMemo(() => {
      if (!searchTerm) return items;

      return items.filter(
        item =>
          item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.subtitle && item.subtitle.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }, [items, searchTerm]);

    const allSelected = useMemo(() => {
      return filteredItems.length > 0 && filteredItems.every(item => selectedIds.includes(item.id));
    }, [filteredItems, selectedIds]);

    const someSelected = useMemo(() => {
      return selectedIds.length > 0 && !allSelected;
    }, [selectedIds, allSelected]);

    if (loading) {
      return <LoadingSpinner message="Einträge werden geladen..." />;
    }

    if (filteredItems.length === 0) {
      return (
        <EmptyState
          title={emptyMessage}
          description={emptyDescription}
          action={onEmptyAction ? { label: 'Aktion', onClick: onEmptyAction } : undefined}
          className={className}
        />
      );
    }

    return (
      <Box className={className} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        {selectable && (
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Checkbox
                checked={allSelected}
                indeterminate={someSelected}
                onChange={e => handleSelectAll(e.target.checked)}
              />
              <Typography variant="body2" color="text.secondary">
                {selectedIds.length} von {filteredItems.length} ausgewählt
              </Typography>
            </Box>
          </Box>
        )}

        <List disablePadding>
          {filteredItems.map((item, index) => (
            <React.Fragment key={item.id}>
              <OptimizedListItemComponent
                item={item}
                onSelect={selectable ? handleSelect : undefined}
              />
              {index < filteredItems.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </Box>
    );
  }
);

OptimizedList.displayName = 'OptimizedList';

export default OptimizedList;
