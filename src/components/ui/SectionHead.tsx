import type { ReactNode } from "react";

export function SectionHead({ index, label, title, accent, id, children }: { index: string; label: string; title: ReactNode; accent: string; id: string; children?: ReactNode }) {
  return (
    <header>
      <p className="tag rv">
        <b>{index}</b> — {label}
      </p>
      <h2 className="h2" id={id}>
        <span className="rv-mask"><span>{title}</span></span>
        <span className="rv-mask" style={{ "--i": 1 } as React.CSSProperties}>
          <span className="serif-accent">{accent}</span>
        </span>
      </h2>
      {children}
    </header>
  );
}
