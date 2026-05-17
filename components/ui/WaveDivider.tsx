export default function WaveDivider({
  fromColor,
  toColor,
  direction,
}: {
  fromColor: string
  toColor:   string
  direction: 'up' | 'down'
}) {
  const path =
    direction === 'up'
      ? 'M0,60 C360,0 1080,0 1440,60 L1440,0 L0,0 Z'
      : 'M0,0 C360,60 1080,60 1440,0 L1440,60 L0,60 Z'
  return (
    <svg
      className="wave"
      viewBox="0 0 1440 60"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
      style={{ background: fromColor, display: 'block' }}
    >
      <path d={path} fill={toColor} />
    </svg>
  )
}
