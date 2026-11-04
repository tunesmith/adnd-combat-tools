import EncumbranceApp from '../encumbrance/EncumbranceApp';
import type { EncumbranceDmDocumentV9 } from '../../types/encumbrance';
export default function HistoricalInventory({
  document,
}: {
  document: EncumbranceDmDocumentV9;
}) {
  return (
    <section aria-label="Historical inventory">
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
