import type { ProductImage } from '../product-editor.types';
import { ProductImages } from '../components/ProductImages';
import { EditorSection } from '../components/EditorSection';

export function MediaPanel({ images, onChange }: { images: ProductImage[]; onChange: (images: ProductImage[]) => void }) {
  return <EditorSection title="گالری محصول" hint="حداقل ۳ تصویر، Alt اجباری"><ProductImages images={images} onChange={onChange} /></EditorSection>;
}
