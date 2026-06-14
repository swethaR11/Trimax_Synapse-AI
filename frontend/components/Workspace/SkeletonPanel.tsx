export function SkeletonPanel({ chat = false }: { chat?: boolean }) {
  return (
    <div className={`skeleton-panel ${chat ? "chat" : ""}`}>
      {chat && <span className="skeleton-avatar" />}
      <div className="skeleton-lines">
        <span style={{ width: "76%" }} />
        <span style={{ width: "94%" }} />
        <span style={{ width: "87%" }} />
        <span style={{ width: "61%" }} />
        <span style={{ width: "82%" }} />
      </div>
    </div>
  );
}

