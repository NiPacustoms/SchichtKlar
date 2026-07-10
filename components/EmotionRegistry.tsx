'use client';

import { useState } from 'react';
import createCache, { Options as EmotionOptions } from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import { useServerInsertedHTML } from 'next/navigation';

type EmotionRegistryProps = {
  options?: EmotionOptions & { key?: string };
  children: React.ReactNode;
};

export function EmotionRegistry({ options, children }: EmotionRegistryProps) {
  const [{ cache, flush }] = useState(() => {
    const cacheOptions: EmotionOptions & { key: string } = {
      key: options?.key ?? 'mui',
      prepend: true,
      ...options,
    };

    if (typeof document !== 'undefined') {
      const emotionInsertionPoint = document.querySelector<HTMLMetaElement>(
        'meta[name="emotion-insertion-point"]'
      );
      if (emotionInsertionPoint) {
        cacheOptions.insertionPoint = emotionInsertionPoint;
      }
    }

    const emotionCache = createCache(cacheOptions);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (emotionCache as any).compat = true;

    const prevInsert = emotionCache.insert;
    let insertedNames: string[] = [];

    emotionCache.insert = (...args: Parameters<typeof prevInsert>) => {
      const [, serialized] = args;
      if (serialized && emotionCache.inserted[serialized.name] === undefined) {
        insertedNames.push(serialized.name);
      }
      return prevInsert(...args);
    };

    const flush = () => {
      const prevInserted = insertedNames;
      insertedNames = [];
      return prevInserted;
    };

    return { cache: emotionCache, flush };
  });

  useServerInsertedHTML(() => {
    const names = flush();
    if (names.length === 0) {
      return null;
    }

    return (
      <style
        data-emotion={`${cache.key} ${names.join(' ')}`}
         
        dangerouslySetInnerHTML={{
          __html: names
            .map(name => {
              const style = cache.inserted[name];
              return typeof style === 'string' ? style : '';
            })
            .join(''),
        }}
      />
    );
  });

  return <CacheProvider value={cache}>{children}</CacheProvider>;
}
