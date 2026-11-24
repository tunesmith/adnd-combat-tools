import EncumbranceApp from '../encumbrance/EncumbranceApp';
import type { EncumbranceDmDocument } from '../../types/encumbrance';
export default function HistoricalInventory({
  document,
}: {
  document: EncumbranceDmDocument;
}) {
  return (
    <section aria-label="Historical inventory">
      <p>Historical · read only</p>
      <EncumbranceApp
        mode="dm"
        campaign={{
          document,
          readOnly: true,
          onDocumentChange: () => false,
          onExport: () => undefined,
        }}
      />
    </section>
  );
}
