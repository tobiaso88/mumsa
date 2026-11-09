/** Linjeikoner på ett 24 × 24-rutnät. Alla ritas med currentColor så att de följer textfärgen. */
const PATHS = {
  day: 'M4 8a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3zM4 10h16M8 3v4M16 3v4',
  week: 'M6 20v-6M12 20V6M18 20v-9',
  plus: 'M12 5v14M5 12h14',
  minus: 'M6 12h12',
  weight: 'M6 4h12a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3zM8 11a4 4 0 0 1 8 0M12 11l2-2.5',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4',
  scan: 'M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M7 9v6M10 9v6M13 9v6M16 9v6',
  pencil: 'M4 20h4L19 9l-4-4L4 16zM14 6l4 4',
  chevronLeft: 'M15 18l-6-6 6-6',
  chevronRight: 'M9 6l6 6-6 6',
  close: 'M6 6l12 12M18 6L6 18',
  settings: 'M4 7h9M17 7h3M15 5v4M4 12h3M11 12h9M9 10v4M4 17h11M19 17h1M17 15v4',
  breakfast: 'M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM17 10h1.5a2.5 2.5 0 0 1 0 5H17M8 3v3M12 3v3',
  lunch:
    'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  dinner: 'M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z',
  snack:
    'M12 7c-1.5-1-4-1.2-5.5.3C4.8 9 5 12.5 6.5 15.5 7.7 18 9.5 20.5 12 19.5c2.5 1 4.3-1.5 5.5-4 1.5-3 1.7-6.5 0-8.2C16 5.8 13.5 6 12 7zM12 7c0-2 1-3.5 3-4',
  lock: 'M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z',
  download: 'M12 4v11M7 10l5 5 5-5M5 20h14',
  upload: 'M12 20V9M7 14l5-5 5 5M5 4h14',
  share: 'M8 10H6v10h12V10h-2M12 3v11M8.5 6.5L12 3l3.5 3.5',
  book: 'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 19V5',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5M12 8h0',
  flash: 'M13 3L5 14h6l-1 7 8-11h-6z',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13',
} as const

export type IconName = keyof typeof PATHS

type Props = {
  name: IconName
  size?: number
  strokeWidth?: number
}

/** Dekorativ ikon. Knappar och länkar som bara har en ikon behöver en egen aria-label. */
export function Icon({ name, size = 24, strokeWidth = 2 }: Props) {
  return (
    <svg
      className="icon"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={PATHS[name]} />
    </svg>
  )
}
