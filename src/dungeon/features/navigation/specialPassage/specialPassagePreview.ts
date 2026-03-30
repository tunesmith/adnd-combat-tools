import {
  buildPreview,
  type TablePreviewFactory,
} from '../../../adapters/render/shared';
import {
  GalleryStairLocation,
  GalleryStairOccurrence,
  RiverBoatBank,
  RiverConstruction,
  SpecialPassage,
  StreamConstruction,
  galleryStairLocation as galleryStairLocationTable,
  galleryStairOccurrence as galleryStairOccurrenceTable,
  riverBoatBank as riverBoatBankTable,
  riverConstruction as riverConstructionTable,
  specialPassage as specialPassageTable,
  streamConstruction as streamConstructionTable,
} from './specialPassageTable';

export const buildSpecialPassagePreview: TablePreviewFactory = (tableId) =>
  buildEnumPreview(
    tableId,
    'Special Passage',
    specialPassageTable,
    SpecialPassage
  );

export const buildGalleryStairLocationPreview: TablePreviewFactory = (
  tableId
) =>
  buildEnumPreview(
    tableId,
    'Gallery Stair Location',
    galleryStairLocationTable,
    GalleryStairLocation
  );

export const buildStreamConstructionPreview: TablePreviewFactory = (tableId) =>
  buildEnumPreview(
    tableId,
    'Stream Construction',
    streamConstructionTable,
    StreamConstruction
  );

export const buildGalleryStairOccurrencePreview: TablePreviewFactory = (
  tableId
) =>
  buildEnumPreview(
    tableId,
    'Gallery Stair Occurrence',
    galleryStairOccurrenceTable,
    GalleryStairOccurrence
  );

export const buildRiverConstructionPreview: TablePreviewFactory = (tableId) =>
  buildEnumPreview(
    tableId,
    'River Construction',
    riverConstructionTable,
    RiverConstruction
  );

export const buildRiverBoatBankPreview: TablePreviewFactory = (tableId) =>
  buildEnumPreview(tableId, 'Boat Bank', riverBoatBankTable, RiverBoatBank);

function buildEnumPreview<TEnumValue extends string | number>(
  tableId: string,
  title: string,
  table: {
    sides: number;
    entries: ReadonlyArray<{ range: number[]; command: TEnumValue }>;
  },
  labels: Record<string | number, string | number>
) {
  return buildPreview(tableId, {
    title,
    sides: table.sides,
    entries: table.entries.map((entry) => ({
      range: entry.range,
      label: String(labels[entry.command] ?? entry.command),
    })),
  });
}
