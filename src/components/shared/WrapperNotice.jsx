/**
 * WrapperNotice
 * Full-screen acknowledgment modal informing users this app is an unofficial
 * wrapper around CIT-U's student portal. Must be acknowledged before use.
 */

import { useState } from 'react';
import '../../styles/WrapperNotice.css';

const STORAGE_KEY = 'wildcatOne_wrapperNoticeAcknowledged';

function WrapperNotice() {
  const [acknowledged, setAcknowledged] = useState(
    () => localStorage.getItem(STORAGE_KEY) === 'true'
  );

  if (acknowledged) return null;

  const handleAcknowledge = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setAcknowledged(true);
  };

  return (
    <div className="wrapper-notice-overlay">
      <div className="wrapper-notice-modal">
        <div className="wrapper-notice-header">
          <span className="wrapper-notice-icon">🔒</span>
          <h2 className="wrapper-notice-title">Before You Continue</h2>
        </div>

        <div className="wrapper-notice-body">
          <p className="wrapper-notice-intro">
            <strong>Wildcat One</strong> is <strong>not</strong> an official CIT-U application.
            It is an independent, student-made wrapper that provides a faster and more
            mobile-friendly interface for the existing CIT-U student portal.
          </p>

          <ul className="wrapper-notice-points">
            <li>
              <span className="point-icon">🔐</span>
              <span>
                <strong>Your credentials are safe.</strong> Your student ID and password
                are sent directly to CIT-U's official servers — this app never stores,
                logs, or intercepts them.
              </span>
            </li>
            <li>
              <span className="point-icon">🚫</span>
              <span>
                <strong>No data collection.</strong> This app does not collect, track, or
                send your personal information to any third-party server. Zero analytics,
                zero tracking.
              </span>
            </li>
            <li>
              <span className="point-icon">🔗</span>
              <span>
                <strong>Same data, better experience.</strong> Everything you see here —
                your grades, schedule, professors — comes directly from CIT-U's systems.
                This app is just a different way to view it.
              </span>
            </li>
            <li>
              <span className="point-icon">📱</span>
              <span>
                <strong>Why does this exist?</strong> The official portal can be slow and
                isn't great on mobile. This wrapper was built to give fellow students a
                smoother experience.
              </span>
            </li>
          </ul>
        </div>

        <button className="wrapper-notice-btn" onClick={handleAcknowledge}>
          I Understand, Continue
        </button>
      </div>
    </div>
  );
}

export default WrapperNotice;
