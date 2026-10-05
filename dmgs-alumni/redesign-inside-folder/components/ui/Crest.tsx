/**
 * School crest. Uses the official crest served from the school's website.
 * To self-host your own higher-resolution file instead, drop it at
 * /public/crest.png and change CREST_SRC to "/crest.png".
 */
const CREST_SRC = "/crest.png";

export function Crest({ size = 52 }: { size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={CREST_SRC}
      alt="Doherty Memorial Grammar School crest"
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className="shrink-0 object-contain"
    />
  );
}
