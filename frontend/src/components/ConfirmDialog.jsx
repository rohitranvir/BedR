export default function ConfirmDialog({ message, onConfirm, onCancel, title = 'Confirm Action' }) {
  return (
    <div className="modal-backdrop">
      <div className="modal-box">
        <div>
          <div className="modal-icon">⚠️</div>
        </div>
        <div>
          <div className="modal-title">{title}</div>
          <div className="modal-message">{message}</div>
        </div>
        <div className="modal-actions">
          <button className="modal-cancel" onClick={onCancel}>Cancel</button>
          <button className="modal-confirm" onClick={onConfirm}>Yes, Delete</button>
        </div>
      </div>
    </div>
  );
}
