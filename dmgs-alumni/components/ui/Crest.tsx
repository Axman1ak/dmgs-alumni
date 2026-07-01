/**
 * School crest medallion. Placeholder uses the "DM" monogram until the
 * client supplies the real crest file (Phase 6 / client responsibility #7).
 */
export function Crest({ size = 52 }: { size?: number }) {
  return (
    <span
      className="crest shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.46 }}
      aria-label="DMGS crest"
    >
      DM
    </span>
  );
}
