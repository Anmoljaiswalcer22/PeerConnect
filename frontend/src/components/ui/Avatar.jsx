import { memo, useState } from 'react';
import { cn } from '../../utils/cn';

const SIZES = {
  xs: { box: 'size-6', text: 'text-[10px]', dot: 'size-2 border' },
  sm: { box: 'size-8', text: 'text-xs', dot: 'size-2.5 border-2' },
  md: { box: 'size-10', text: 'text-sm', dot: 'size-3 border-2' },
  lg: { box: 'size-14', text: 'text-lg', dot: 'size-3.5 border-2' },
  xl: { box: 'size-24', text: 'text-3xl', dot: 'size-5 border-[3px]' },
};

// Muted, theme-neutral backgrounds for initials; picked deterministically per name.
const PALETTE = ['#5b6ee1', '#2f9e8f', '#c0703a', '#a356c4', '#3b8bd0', '#c4517a', '#6b8e23', '#8a6fd1'];

function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

function colorFor(name = '') {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

/**
 * Profile picture with an initials fallback and an optional presence dot.
 * `online`: true → green dot, false → no dot, undefined → no dot.
 */
export const Avatar = memo(function Avatar({ user, size = 'md', online, className, ringClassName = 'border-surface-1' }) {
  const [failed, setFailed] = useState(false);
  const s = SIZES[size];
  const name = user?.fullName ?? '';
  const showImage = user?.profilePic && !failed;

  return (
    <span className={cn('relative inline-flex shrink-0', className)}>
      {showImage ? (
        <img
          src={user.profilePic}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
          className={cn(s.box, 'rounded-full bg-surface-3 object-cover')}
        />
      ) : (
        <span
          aria-hidden="true"
          className={cn(s.box, s.text, 'inline-flex items-center justify-center rounded-full font-semibold text-white select-none')}
          style={{ backgroundColor: colorFor(name) }}
        >
          {initials(name)}
        </span>
      )}
      {online && (
        <span
          className={cn(
            'absolute right-0 bottom-0 rounded-full bg-success animate-presence-pulse',
            s.dot,
            ringClassName,
          )}
          aria-hidden="true"
        />
      )}
    </span>
  );
});
