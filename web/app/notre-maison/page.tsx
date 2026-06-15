'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { CmsPage } from '@/lib/types';
import { PageSpinner } from '@/components/Spinner';

/**
 * Renders CMS content with very light Markdown handling: `#`/`##`/`###`
 * headings become serif headings, blank-line-separated blocks become
 * paragraphs. Anything else is shown as plain text — safe by default (no raw
 * HTML injection).
 */
function renderContent(content: string) {
  const blocks = content.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return blocks.map((block, i) => {
    if (block.startsWith('### ')) {
      return (
        <h3 key={i} className="mt-10 text-2xl">
          {block.slice(4)}
        </h3>
      );
    }
    if (block.startsWith('## ')) {
      return (
        <h2 key={i} className="mt-12 text-3xl">
          {block.slice(3)}
        </h2>
      );
    }
    if (block.startsWith('# ')) {
      return (
        <h2 key={i} className="mt-12 text-4xl">
          {block.slice(2)}
        </h2>
      );
    }
    // Preserve single newlines inside a paragraph as line breaks.
    const lines = block.split('\n');
    return (
      <p key={i} className="mt-5 text-sm leading-relaxed text-muted">
        {lines.map((line, j) => (
          <span key={j}>
            {line}
            {j < lines.length - 1 ? <br /> : null}
          </span>
        ))}
      </p>
    );
  });
}

export default function NotreMaisonPage() {
  const [page, setPage] = useState<CmsPage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await api<CmsPage>('/cms/pages/notre-maison');
        if (active) setPage(res);
      } catch {
        /* fall back to default copy below */
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <PageSpinner />;

  return (
    <article className="container-luxe max-w-3xl py-20">
      <header className="animate-fade-up mb-12 text-center">
        <span className="eyebrow eyebrow-center before:hidden">Notre Maison</span>
        <h1 className="mt-4 text-5xl leading-tight sm:text-6xl">
          {page?.title ?? 'Notre Maison'}
        </h1>
        <span className="rule-gold mx-auto mt-7" />
      </header>

      <div className="animate-fade-up" style={{ animationDelay: '0.15s' }}>
        {page?.content ? (
          renderContent(page.content)
        ) : (
          <>
            <p className="mt-5 text-sm leading-relaxed text-muted">
              Maison Luma célèbre l&apos;artisanat d&apos;exception. Chaque création est le fruit
              d&apos;une collaboration avec des ateliers rares, choisis pour leur maîtrise et leur
              sens du détail.
            </p>
            <p className="mt-5 text-sm leading-relaxed text-muted">
              Nous croyons en une consommation rare et réfléchie : moins de pièces, mais des pièces
              qui traversent le temps.
            </p>
          </>
        )}
      </div>
    </article>
  );
}
