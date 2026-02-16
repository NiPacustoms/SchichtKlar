'use client';

import { Breadcrumbs, Link, Typography } from '@mui/material';
import NextLink from 'next/link';

export interface PageBreadcrumbItem {
  label: string;
  href?: string;
}

export interface PageBreadcrumbsProps {
  items: PageBreadcrumbItem[];
}

/**
 * Breadcrumbs für Detailseiten gemäß Design-System (Hierarchie: Liste → Detail).
 */
export function PageBreadcrumbs({ items }: PageBreadcrumbsProps) {
  if (items.length === 0) return null;

  return (
    <Breadcrumbs aria-label="Breadcrumb" sx={{ mb: 2 }}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        if (isLast || !item.href) {
          return (
            <Typography key={index} color="text.primary" fontWeight={600}>
              {item.label}
            </Typography>
          );
        }
        return (
          <Link
            key={index}
            component={NextLink}
            href={item.href}
            underline="hover"
            color="text.secondary"
            sx={{ '&:hover': { color: 'primary.main' } }}
          >
            {item.label}
          </Link>
        );
      })}
    </Breadcrumbs>
  );
}
