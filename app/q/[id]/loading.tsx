export default function Loading() {
  return (
    <div className="dossier-skeleton">
      <div className="skeleton-breadcrumb" />

      <p className="skeleton-kicker" />
      <h1 className="skeleton-title" />

      <dl className="skeleton-identity">
        <div className="skeleton-identity-item">
          <span className="skeleton-id-label" />
          <span className="skeleton-id-value" />
        </div>
        <div className="skeleton-identity-item">
          <span className="skeleton-id-label" />
          <span className="skeleton-id-value short" />
        </div>
        <div className="skeleton-identity-item">
          <span className="skeleton-id-label" />
          <span className="skeleton-id-value" />
        </div>
        <div className="skeleton-identity-item">
          <span className="skeleton-id-label" />
          <span className="skeleton-id-value short" />
        </div>
      </dl>

      <div className="dossier-skeleton-grid">
        <div className="dossier-skeleton-left">
          <dl className="skeleton-dl">
            <div className="skeleton-dl-row">
              <span className="skeleton-dt" />
              <span className="skeleton-dd" />
            </div>
            <div className="skeleton-dl-row">
              <span className="skeleton-dt" />
              <span className="skeleton-dd wide" />
            </div>
            <div className="skeleton-dl-row">
              <span className="skeleton-dt" />
              <span className="skeleton-dd short" />
            </div>
            <div className="skeleton-dl-row">
              <span className="skeleton-dt" />
              <span className="skeleton-dd short" />
            </div>
            <div className="skeleton-dl-row">
              <span className="skeleton-dt" />
              <span className="skeleton-dd short" />
            </div>
          </dl>

          <div className="skeleton-countdown">
            <span className="skeleton-countdown-label" />
            <span className="skeleton-countdown-value" />
            <span className="skeleton-countdown-hint" />
          </div>

          <div className="skeleton-lifecycle">
            <span className="skeleton-section-label" />
            <span className="skeleton-lifecycle-bar" />
          </div>

          <div className="skeleton-rule">
            <span className="skeleton-rule-title" />
            <span className="skeleton-rule-body" />
          </div>
        </div>

        <div className="dossier-skeleton-right">
          <div className="skeleton-forecast-panel">
            <span className="skeleton-panel-title" />
            <span className="skeleton-panel-hint" />
            <div className="skeleton-panel-form">
              <span className="skeleton-panel-label" />
              <span className="skeleton-slider" />
              <span className="skeleton-panel-label" />
              <span className="skeleton-textarea" />
              <span className="skeleton-char-count" />
              <span className="skeleton-btn" />
            </div>
          </div>
        </div>
      </div>

      <div className="skeleton-history">
        <span className="skeleton-history-title" />
        <div className="skeleton-history-list">
          <div className="skeleton-history-step">
            <span className="skeleton-history-date" />
            <span className="skeleton-history-text" />
          </div>
          <div className="skeleton-history-step">
            <span className="skeleton-history-date" />
            <span className="skeleton-history-text wide" />
          </div>
          <div className="skeleton-history-step">
            <span className="skeleton-history-date" />
            <span className="skeleton-history-text" />
          </div>
          <div className="skeleton-history-step">
            <span className="skeleton-history-date" />
            <span className="skeleton-history-text short" />
          </div>
        </div>
      </div>
    </div>
  );
}
