import type { Attribute } from '../product-editor.types';
import { AttributeTable } from '../components/AttributeTable';
import { EditorSection } from '../components/EditorSection';

export function SpecsPanel({ attributes, onChange }: { attributes: Attribute[]; onChange: (attributes: Attribute[]) => void }) {
  return <EditorSection title="مشخصات فنی" hint="فیلتر، مقایسه و additionalProperty از همین رکوردها ساخته می‌شوند"><AttributeTable attributes={attributes} onChange={onChange} /></EditorSection>;
}
