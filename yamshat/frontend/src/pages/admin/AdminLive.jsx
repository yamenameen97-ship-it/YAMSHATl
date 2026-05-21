import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import { getAdminLiveOverview, endAdminLiveRoom } from '../../api/admin.js';
import socket from '../../api/socket.js';
import { useToast } from '../../components/admin/ToastProvider.jsx';

export default function AdminLive() {
  const [rooms, setRooms] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const { pushToast } = useToast();

  const loadLiveStatus = async () => {
    try {
      setLoading(true);
      const { data } = await getAdminLiveOverview();
      setRooms(data.rooms || []);
      setStats(data.stats || {});
    } catch (err) {
      pushToast({ title: 'Monitoring Failed', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLiveStatus();
    socket.on('stream_metrics_update', (data) => {
      setStats(prev => ({ ...prev, ...data }));
    });
    return () => socket.off('stream_metrics_update');
  }, []);

  const handleEmergencyStop = async (roomId) => {
    if (!window.confirm('Are you sure you want to trigger an EMERGENCY STOP?')) return;
    try {
      await endAdminLiveRoom(roomId);
      pushToast({ title: 'Emergency Stop Triggered', description: `Stream ${roomId} terminated`, type: 'error' });
      loadLiveStatus();
    } catch (err) {
      pushToast({ title: 'Action Failed', type: 'error' });
    }
  };

  return (
    <AdminLayout>
      <section className="live-monitoring-header">
        <Card className="metrics-bar">
          <div className="metric-item">
            <span className="label">Active Streams</span>
            <span className="value">{stats.active_rooms || 0}</span>
          </div>
          <div className="metric-item">
            <span className="label">Total Viewers</span>
            <span className="value">{stats.current_viewers || 0}</span>
          </div>
          <div className="metric-item">
            <span className="label">Avg Bitrate</span>
            <span className="value">{stats.avg_bitrate || '0 kbps'}</span>
          </div>
        </Card>
      </section>

      <section className="streams-grid">
        <Card>
          <div className="card-head split">
            <h3 className="section-title">Live Stream Monitoring</h3>
            <span className="live-indicator">Real-time Feed Active</span>
          </div>

          <div className="table-shell">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Host</th>
                  <th>Title</th>
                  <th>Metrics (V/L/B)</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map(room => (
                  <tr key={room.id}>
                    <td>{room.username}</td>
                    <td>{room.title}</td>
                    <td>{room.viewer_count} / {room.likes} / {room.bitrate}k</td>
                    <td><span className="badge success">Live</span></td>
                    <td>
                      <div className="action-row">
                        <button className="mini-action" onClick={() => setSelectedRoom(room)}>Monitor</button>
                        <button className="mini-action danger" onClick={() => handleEmergencyStop(room.id)}>Emergency Stop</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      <Modal open={!!selectedRoom} title="Stream Moderation & Metrics" onClose={() => setSelectedRoom(null)}>
        {selectedRoom && (
          <div className="stream-mod-container">
            <div className="stream-preview-placeholder">
              {/* Stream Video Player would go here */}
              <div className="overlay-metrics">
                <span>FPS: {selectedRoom.fps || 30}</span>
                <span>Latency: {selectedRoom.latency || '120ms'}</span>
              </div>
            </div>
            <div className="mod-controls">
              <Button variant="secondary">Mute Audio</Button>
              <Button variant="secondary">Hide Chat</Button>
              <Button className="danger" onClick={() => handleEmergencyStop(selectedRoom.id)}>Terminate Stream</Button>
            </div>
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
}
