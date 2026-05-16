import Modal from '../ui/Modal.jsx';

export default function MediaViewerModal({ item, onClose }) {
  const open = Boolean(item?.url);
  return (
    <Modal open={open} title={item?.title || 'Media Viewer'} onClose={onClose}>
      {!item?.url ? null : (
        <div className="media-viewer-modal-body">
          {item.type === 'video' ? (
            <video src={item.url} controls autoPlay className="media-viewer-asset" />
          ) : item.type === 'image' ? (
            <img src={item.url} alt={item.title || 'media'} className="media-viewer-asset" />
          ) : (
            <a href={item.url} target="_blank" rel="noreferrer" className="btn btn-primary">فتح الملف</a>
          )}
        </div>
      )}
    </Modal>
  );
}
