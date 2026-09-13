'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { KeyboardEvent, PointerEvent, useRef, useState } from 'react';
import { ArrowRight, Mail } from 'lucide-react';

function markForwardTransition() {
  sessionStorage.setItem('public-route-direction', 'forward');
}

export default function Home() {
  const pathname = usePathname();
  const cardRef = useRef<HTMLButtonElement>(null);
  const rafRef = useRef<number | null>(null);
  const [flipped, setFlipped] = useState(false);

  function guardSameRoute(event: { preventDefault: () => void }, targetPath: string) {
    if (pathname !== targetPath) return false;
    event.preventDefault();
    return true;
  }

  function handlePointerMove(event: PointerEvent<HTMLButtonElement>) {
    if (!cardRef.current || window.matchMedia('(pointer: coarse)').matches) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const rect = cardRef.current!.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      cardRef.current!.style.setProperty('--card-rotate-x', `${(-y * 8).toFixed(2)}deg`);
      cardRef.current!.style.setProperty('--card-rotate-y', `${(x * 12).toFixed(2)}deg`);
      cardRef.current!.style.setProperty('--card-light-x', `${((x + 0.5) * 100).toFixed(1)}%`);
      cardRef.current!.style.setProperty('--card-light-y', `${((y + 0.5) * 100).toFixed(1)}%`);
    });
  }

  function resetCardTilt() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    cardRef.current?.style.setProperty('--card-rotate-x', '0deg');
    cardRef.current?.style.setProperty('--card-rotate-y', '0deg');
    cardRef.current?.style.setProperty('--card-light-x', '50%');
    cardRef.current?.style.setProperty('--card-light-y', '50%');
  }

  function handleCardKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    setFlipped((value) => !value);
  }

  return (
    <main className="public-shell public-route public-route-home">
      <div className="public-container">
        <header className="public-header">
          <Link href="/" className="public-brand" aria-label="AWS SBG TIP Manila home" onClick={(event) => { guardSameRoute(event, '/'); }}>
            <span className="public-logo"><span className="public-logo-mark" aria-hidden="true" /></span>
            <span>
              <strong>AWS SBG TIP Manila</strong>
              <small>ID Generator</small>
            </span>
          </Link>
        </header>

        <section className="public-hero public-home-hero">
          <div className="public-hero-copy">
            <p className="public-eyebrow">IT&apos;S ALWAYS DAY ONE.</p>
            <h1>
              Welcome to the
              <span>ID Generator.</span>
            </h1>
            <p className="public-description">
              An internal platform for managing and generating AWS SBG TIP Manila membership IDs.
            </p>
            <Link className="public-primary-action" href="/login" onClick={markForwardTransition}>
              Officer Login <ArrowRight aria-hidden="true" />
            </Link>
          </div>

          <div className="public-card-stage" aria-label="Interactive ID card preview">
            <button
              ref={cardRef}
              type="button"
              className={`public-id-card ${flipped ? 'is-flipped' : ''}`}
              aria-pressed={flipped}
              aria-label="Flip sample ID card"
              onPointerMove={handlePointerMove}
              onPointerLeave={resetCardTilt}
              onClick={() => setFlipped((value) => !value)}
              onKeyDown={handleCardKeyDown}
            >
              <span className="public-id-card-inner">
                <span className="public-id-face public-id-front">
                  <span className="public-id-top">
                    <span className="public-card-logo">AWS</span>
                    <span>
                      <strong>AWS SBG TIP MANILA</strong>
                      <small>MEMBER</small>
                    </span>
                  </span>
                  <span className="public-avatar" />
                  <span className="public-card-name">Juan Dela Cruz</span>
                  <span className="public-card-meta">BS Computer Science</span>
                  <span className="public-card-number">AWS SBG TIPM-260024</span>
                </span>
                <span className="public-id-face public-id-back">
                  <strong>AWS SBG TIP Manila</strong>
                  <span className="public-card-section">Event Attendance</span>
                  <span className="public-slots" aria-hidden="true">
                    {Array.from({ length: 7 }).map((_, index) => <i key={index} />)}
                  </span>
                  <span className="public-card-section">Terms &amp; Conditions</span>
                  <small>This ID is valid for official AWS SBG TIP Manila membership activities only.</small>
                </span>
              </span>
            </button>
          </div>
        </section>

        <footer className="public-footer">
          <div>
            <strong>AWS SBG TIP Manila</strong>
            <span>It&apos;s always day one.</span>
          </div>
          <nav aria-label="Footer links">
            <a href="mailto:awslc.mnl@tip.edu.ph" aria-label="Email AWS SBG TIP Manila"><Mail aria-hidden="true" /></a>
            <a href="https://www.facebook.com/awssbgtip" target="_blank" rel="noreferrer" aria-label="AWS SBG TIP Manila Facebook page"><span aria-hidden="true">f</span></a>
          </nav>
          <p className="public-footer-copy">© 2026 AWS SBG TIP Manila.<br />All rights reserved.</p>
        </footer>
      </div>
    </main>
  );
}
