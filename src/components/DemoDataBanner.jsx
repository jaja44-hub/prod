/**
 * Shown on modules that still use static demo datasets (Batch D honesty).
 */
export default function DemoDataBanner({ label = "Demo data — not connected to live Firestore feeds yet." }) {
  return (
    <div
      style={{
        margin: "0 24px 16px",
        padding: "10px 16px",
        borderRadius: 8,
        background: "rgba(217, 119, 6, 0.12)",
        border: "1px dashed var(--warning, #d97706)",
        color: "var(--warning, #d97706)",
        fontSize: 13,
        fontWeight: 600,
        textAlign: "center",
      }}
      role="status"
    >
      ⬡ {label}
    </div>
  );
}
