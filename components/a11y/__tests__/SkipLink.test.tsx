// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

afterEach(cleanup);
import { SkipLink } from '../SkipLink';

describe('SkipLink', () => {
  it('rendert einen Link mit korrektem href', () => {
    render(<SkipLink />);
    const link = screen.getByRole('link');
    expect(link).toBeDefined();
    expect(link.getAttribute('href')).toBe('#main-content');
  });

  it('enthält den deutschen Linktext', () => {
    render(<SkipLink />);
    expect(screen.getByText('Zum Hauptinhalt springen')).toBeDefined();
  });

  it('ist initial visuell versteckt (top: -100%)', () => {
    render(<SkipLink />);
    const link = screen.getByRole('link') as HTMLAnchorElement;
    expect(link.style.top).toBe('-100%');
  });
});
