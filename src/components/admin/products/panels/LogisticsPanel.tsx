import { EditorField, editorInputClass } from '../components/EditorField';
import { EditorSection, editorSurfaceClass } from '../components/EditorSection';
import { EditorToggle } from '../components/EditorToggle';

export function LogisticsPanel() {
  return <EditorSection title="گارانتی، حمل و ارتباطات"><div className={`${editorSurfaceClass} grid gap-4 p-4 md:grid-cols-2`}>
    <EditorField label="نوع گارانتی"><select className={editorInputClass}><option>شرکتی</option><option>فروشگاهی</option><option>بدون گارانتی</option></select></EditorField>
    <EditorField label="مدت گارانتی"><input className={editorInputClass} type="number" defaultValue={18} /></EditorField>
    <EditorToggle checked label="ضمانت اصالت کالا" onChange={() => undefined} />
    <EditorToggle checked label="نمایش در فید ترب" onChange={() => undefined} />
    <EditorToggle checked label="نمایش در فید ایمالز" onChange={() => undefined} />
    <EditorToggle checked={false} label="Google Merchant" onChange={() => undefined} />
  </div></EditorSection>;
}
