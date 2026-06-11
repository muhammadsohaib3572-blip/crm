import InventoryItemPageClient from './InventoryItemPageClient';

export default async function InventoryItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <InventoryItemPageClient id={id} />;
}
