"use client";

interface BilingualInputProps {
  label: string;
  valueCs: string;
  valueEn: string;
  onChangeCs: (value: string) => void;
  onChangeEn: (value: string) => void;
  multiline?: boolean;
}

export function BilingualInput({
  label,
  valueCs,
  valueEn,
  onChangeCs,
  onChangeEn,
  multiline = false,
}: BilingualInputProps) {
  return (
    <div className="admin-form-group">
      <label className="admin-label">{label}</label>
      <div className="admin-grid-2">
        <div>
          <span
            className="text-secondary"
            style={{ fontSize: "12px", display: "block", marginBottom: "4px" }}
          >
            CS
          </span>
          {multiline ? (
            <textarea
              className="admin-input"
              value={valueCs}
              onChange={(e) => onChangeCs(e.target.value)}
              rows={3}
            />
          ) : (
            <input
              type="text"
              className="admin-input"
              value={valueCs}
              onChange={(e) => onChangeCs(e.target.value)}
            />
          )}
        </div>
        <div>
          <span
            className="text-secondary"
            style={{ fontSize: "12px", display: "block", marginBottom: "4px" }}
          >
            EN
          </span>
          {multiline ? (
            <textarea
              className="admin-input"
              value={valueEn}
              onChange={(e) => onChangeEn(e.target.value)}
              rows={3}
            />
          ) : (
            <input
              type="text"
              className="admin-input"
              value={valueEn}
              onChange={(e) => onChangeEn(e.target.value)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
