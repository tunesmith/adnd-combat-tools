import EncumbranceApp from '../encumbrance/EncumbranceApp';
import type { EncumbranceDmDocument } from '../../types/encumbrance';
export default function HistoricalInventory({
  document,
  sessionLabel,
}: {
  sessionLabel?: string;
  document: EncumbranceDmDocument;
}) {
  return (
    <section aria-label="Historical inventory">
      <p>Historical · read only</p>
      <EncumbranceApp
        mode="dm"
        campaign={{
          document,
          sessionLabel,
          readOnly: true,
          onDocumentChange: () => false,
          onExport: () => undefined,
        }}
      />
    </section>
  );
}
