// Small inline SVGs used across the page. Keeping them here means no icon
// dependency and no extra network requests.

export function Star({ filled = true, size = 20, empty = false }) {
  const path =
    "M10 0l2.6 6.1 6.6.5-5 4.3 1.5 6.4L10 13.9 4.3 17.3l1.5-6.4-5-4.3 6.6-.5z";
  if (empty) {
    return (
      <svg width={size} height={size * 0.95} viewBox="0 0 20 19" fill="none" stroke="#e8a33d" strokeWidth="1.5">
        <path d="M10 1.5l2.3 5.3 5.8.5-4.4 3.8 1.3 5.6L10 13.8l-5 2.9 1.3-5.6-4.4-3.8 5.8-.5z" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size * 0.95} viewBox="0 0 20 19" fill={filled ? "#e8a33d" : "#d8d8d8"}>
      <path d={path} />
    </svg>
  );
}

export function Stars({ filled = 5, total = 5, size = 20, outlineLast = false }) {
  return (
    <div className="stars">
      {Array.from({ length: total }, (_, i) =>
        i < filled ? (
          <Star key={i} size={size} />
        ) : outlineLast ? (
          <Star key={i} size={size} empty />
        ) : (
          <Star key={i} size={size} filled={false} />
        )
      )}
    </div>
  );
}

export function QuoteMark() {
  return (
    <svg width="24" height="18" viewBox="0 0 24 18" fill="#fff">
      <path d="M0 0h9.2v11.2L4.9 18H2.2l3.4-6.8H0z" />
      <path d="M14.8 0H24v11.2L19.7 18H17l3.4-6.8h-5.6z" />
    </svg>
  );
}

export function QuestionDiamond() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22">
      <path d="M11 0l11 11-11 11L0 11z" fill="#c0392b" />
      <text x="11" y="15" textAnchor="middle" fontFamily="Inter Tight, sans-serif" fontSize="11" fontWeight="700" fill="#fff">?</text>
    </svg>
  );
}

export function CheckCircle() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20">
      <circle cx="10" cy="10" r="10" fill="#22a44c" />
      <path d="M5.8 10.3l2.7 2.7 5.7-5.9" stroke="#fff" strokeWidth="1.9" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Chevron({ up = false }) {
  return (
    <svg width="32" height="32" viewBox="0 0 26 26">
      <circle cx="13" cy="13" r="13" fill="#0d3729" />
      <path
        d={up ? "M8 15l5-5 5 5" : "M8 11l5 5 5-5"}
        stroke="#fff"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Decorative starburst used behind "What we'll cover" and on the CTA banner.
export function Sunburst({ size = 240, color = "#cdeccf", rays = 14, r1 = 26, r2 = 96, w = 13, className = "" }) {
  const bars = Array.from({ length: rays }, (_, i) => {
    const a = (360 / rays) * i;
    return (
      <rect
        key={i}
        x={100 - w / 2}
        y={100 - r2}
        width={w}
        height={r2 - r1}
        rx={w / 2}
        transform={`rotate(${a} 100 100)`}
      />
    );
  });
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 200 200" fill={color} aria-hidden="true">
      {bars}
    </svg>
  );
}

export function LinkedInMark({ size = 19, bg = "#0a66c2", fg = "#fff" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <rect width="24" height="24" rx="4" fill={bg} />
      <path
        d="M7 9.5h2.4V18H7zM8.2 5.8a1.4 1.4 0 110 2.8 1.4 1.4 0 010-2.8zM11.4 9.5h2.3v1.2a2.6 2.6 0 012.3-1.3c2 0 2.9 1.2 2.9 3.4V18h-2.4v-4.5c0-1.1-.4-1.8-1.4-1.8s-1.4.7-1.4 1.8V18h-2.3z"
        fill={fg}
      />
    </svg>
  );
}

export function PinIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.7">
      <path d="M12 21s7-6.1 7-11a7 7 0 10-14 0c0 4.9 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

export function MailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.7">
      <rect x="2.5" y="5" width="19" height="14" rx="2" />
      <path d="M3 6.5l9 6.5 9-6.5" />
    </svg>
  );
}
