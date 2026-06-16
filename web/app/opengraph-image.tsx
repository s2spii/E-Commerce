import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Maison Luma — L’artisanat d’exception';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** Branded social-share card rendered at build/edge (no external fonts). */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0E0C0A',
          color: '#FAF7F1',
          fontFamily: 'Georgia, serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(184,146,74,0.5)',
            borderRadius: 24,
            padding: '80px 110px',
          }}
        >
          <div style={{ fontSize: 28, letterSpacing: 12, color: '#E2C892' }}>MAISON LUMA</div>
          <div style={{ width: 80, height: 1, backgroundColor: '#B8924A', margin: '36px 0' }} />
          <div style={{ fontSize: 64, textAlign: 'center', lineHeight: 1.1 }}>
            L’artisanat d’exception
          </div>
          <div style={{ fontSize: 26, color: 'rgba(250,247,241,0.65)', marginTop: 28 }}>
            Pièces intemporelles · façonnées avec exigence
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
