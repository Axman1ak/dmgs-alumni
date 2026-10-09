"use client";

/** Submit button that asks for confirmation first. */
export function ConfirmSubmit({
  message,
  className,
  style,
  children,
}: {
  message: string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      className={className}
      style={style}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
