/**
 * Appikonen: en ljus ring med ett tugg ur kanten. Ringen är både tallriken och dagens framsteg mot målet.
 * scale styr hur stort motivet är i rutan, för maskable-varianten. Samma motiv som src/ui/components/AppIcon.tsx.
 */
export function iconSvg({ rounded, scale }: { rounded: boolean; scale: number }): string {
  const green = '#2f7d5b'
  const offset = (100 - 100 * scale) / 2
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="${rounded ? 23 : 0}" fill="${green}"/>
  <g transform="translate(${offset} ${offset}) scale(${scale})">
    <circle cx="50" cy="50" r="26" fill="none" stroke="#fbfaf7" stroke-width="12"/>
    <circle cx="78.5" cy="35.5" r="7.5" fill="${green}"/>
    <circle cx="72.6" cy="27.4" r="7.5" fill="${green}"/>
    <circle cx="64.5" cy="21.5" r="7.5" fill="${green}"/>
  </g>
</svg>
`
}
