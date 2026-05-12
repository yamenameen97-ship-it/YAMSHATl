import { useState, useEffect } from 'react';
import Card from '../../components/ui/Card.jsx';

export default function AdminLive() {
  const [streams, setStreams] = useState([
    { id: 1, host: 'GamerX', viewers: 1250, bitrate: '4500kbps', health: 'Excellent', fps: 60 },
    { id: 2, host: 'NewsLive', viewers: 840, bitrate: '2100kbps', health: 'Stable', fps: 30 },
  ]);

  return (
    <div className="admin-live-page">
      <Card>
        <h2>مراقبة البث المباشر (Stream Analytics)</h2>
        <div className="streams-grid mt-4">
          {streams.map(stream => (
            <Card key={stream.id} className="stream-monitor-card">
              <div className="stream-header">
                <strong>{stream.host}</strong>
                <span className="live-badge">LIVE</span>
              </div>
              <div className="stream-metrics">
                <div className="metric">
                  <label>المشاهدون</label>
                  <span>{stream.viewers}</span>
                </div>
                <div className="metric">
                  <label>Bitrate</label>
                  <span>{stream.bitrate}</span>
                </div>
                <div className="metric">
                  <label>الصحة</label>
                  <span className={`health ${stream.health.toLowerCase()}`}>{stream.health}</span>
                </div>
              </div>
              <div className="stream-health-bar">
                <div className="health-fill" style={{ width: stream.health === 'Excellent' ? '100%' : '70%' }} />
              </div>
            </Card>
          ))}
        </div>
      </Card>
      <style dangerouslySetInnerHTML={{ __html: `
        .admin-live-page { padding: 20px; }
        .streams-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; }
        .stream-monitor-card { background: #111827; color: white; }
        .live-badge { background: #ef4444; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; }
        .stream-metrics { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin: 15px 0; }
        .metric label { display: block; font-size: 10px; color: #9ca3af; }
        .metric span { font-weight: bold; font-size: 14px; }
        .health.excellent { color: #10b981; }
        .health.stable { color: #f59e0b; }
        .stream-health-bar { height: 4px; background: #374151; border-radius: 2px; overflow: hidden; }
        .health-fill { height: 100%; background: #10b981; }
      `}} />
    </div>
  );
}
