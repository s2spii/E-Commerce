const MESSAGES = [
  'Livraison soignée offerte dès 200 €',
  'Nouvelle collection — pièces en édition rare',
  'Emballage signature Maison Luma',
  'Conseil personnalisé par nos artisans',
];

/**
 * Slim, infinitely-scrolling marquee at the very top of the page. The track is
 * duplicated so the loop is seamless; it pauses on hover for readability.
 */
export function AnnouncementBar() {
  // Two identical halves make the -50% translate loop seamless.
  const track = [...MESSAGES, ...MESSAGES];

  return (
    <div className="group relative overflow-hidden bg-noir text-ivory">
      <div className="flex w-max animate-marquee whitespace-nowrap py-2 group-hover:[animation-play-state:paused]">
        {track.map((msg, i) => (
          <span
            key={i}
            className="mx-8 inline-flex items-center gap-8 text-[11px] uppercase tracking-luxe text-ivory/75"
          >
            {msg}
            <span aria-hidden className="text-gold">
              ✦
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
