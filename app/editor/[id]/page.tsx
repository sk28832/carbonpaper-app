import CarbonPaper from '@/components/Layout/CarbonPaper';

export default function EditorPage({ params }: { params: { id: string } }) {
  return <CarbonPaper fileId={params.id} />;
}