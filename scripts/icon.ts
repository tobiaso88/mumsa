/** Appikonen: en skål med ånga. size styr hur stor motivet är i rutan, för maskable-varianten. */
export function iconSvg({ rounded, scale }: { rounded: boolean; scale: number }): string {
  const offset = (512 - 512 * scale) / 2
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="${rounded ? 112 : 0}" fill="#2f7d5b"/>
  <g transform="translate(${offset} ${offset}) scale(${scale})">
    <path d="M176 112c-20 24 20 40 0 72M256 96c-22 28 22 46 0 84M336 112c-20 24 20 40 0 72" fill="none" stroke="#cfe8da" stroke-width="18" stroke-linecap="round"/>
    <path d="M88 232h336c0 92-75 168-168 168S88 324 88 232z" fill="#fbfaf7"/>
    <rect x="200" y="408" width="112" height="22" rx="11" fill="#fbfaf7"/>
  </g>
</svg>
`
}
