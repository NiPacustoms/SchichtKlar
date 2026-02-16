'use client';

import React, { memo, useState, useCallback } from 'react';
import Image from 'next/image';
import { Box, Skeleton, Avatar } from '@mui/material';
import { CloudUpload, Person } from '@mui/icons-material';

interface OptimizedImageProps {
  src?: string;
  alt?: string;
  width?: number;
  height?: number;
  variant?: 'avatar' | 'image' | 'thumbnail';
  fallbackIcon?: React.ReactNode;
  className?: string;
  onClick?: () => void;
  sx?: object;
  showSkeleton?: boolean;
  fallbackBgColor?: string;
  priority?: boolean;
}

export const OptimizedImage = memo<OptimizedImageProps>(
  ({
    src,
    alt = '',
    width = 40,
    height = 40,
    variant = 'image',
    fallbackIcon,
    className,
    onClick,
    sx = {},
    showSkeleton = true,
    fallbackBgColor = 'action.hover',
    priority = false,
  }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const handleLoad = useCallback(() => {
      setLoading(false);
      setError(false);
    }, []);

    const handleError = useCallback(() => {
      setLoading(false);
      setError(true);
    }, []);

    const defaultFallbackIcon =
      fallbackIcon || (variant === 'avatar' ? <Person /> : <CloudUpload />);

    if (variant === 'avatar') {
      return (
        <Avatar
          src={!error && src ? src : undefined}
          alt={alt}
          sx={{
            width,
            height,
            cursor: onClick ? 'pointer' : 'default',
            ...sx,
          }}
          onClick={onClick}
          className={className}
        >
          {error && defaultFallbackIcon}
        </Avatar>
      );
    }

    // Prüfe, ob width/height in sx definiert sind
    const hasSxWidth = sx && 'width' in sx;
    const hasSxHeight = sx && 'height' in sx;
    const hasMaxConstraints = sx && ('maxWidth' in sx || 'maxHeight' in sx);

    // Für fill-Bilder muss das Parent-Element eine feste Höhe haben
    // Wenn width/height in sx definiert sind, werden diese verwendet (via sx prop)
    // Ansonsten verwende die Props, aber niemals 100% für height bei fill
    const boxWidth = hasSxWidth ? undefined : hasMaxConstraints ? '100%' : width;
    const boxHeight = hasSxHeight ? undefined : height;

    return (
      <Box
        position="relative"
        {...(boxWidth !== undefined && { width: boxWidth })}
        {...(boxHeight !== undefined && { height: boxHeight })}
        overflow="hidden"
        borderRadius={variant === 'thumbnail' ? 1 : 0}
        sx={{
          cursor: onClick ? 'pointer' : 'default',
          minHeight: boxHeight || height, // Sicherstellen, dass mindestens eine Höhe gesetzt ist
          ...sx,
        }}
        onClick={onClick}
        className={className}
      >
        {showSkeleton && loading && (
          <Skeleton variant="rectangular" width="100%" height="100%" animation="wave" />
        )}

        {src && !error && (
          <Image
            src={src}
            alt={alt}
            fill
            sizes="(max-width: 768px) 100vw, 400px"
            onLoad={handleLoad}
            onError={handleError}
            priority={priority}
            style={{
              objectFit: 'contain',
              objectPosition: 'center',
            }}
          />
        )}

        {error && (
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            width="100%"
            height="100%"
            bgcolor={fallbackBgColor}
            color="text.secondary"
          >
            {defaultFallbackIcon}
          </Box>
        )}
      </Box>
    );
  }
);

OptimizedImage.displayName = 'OptimizedImage';

export default OptimizedImage;
