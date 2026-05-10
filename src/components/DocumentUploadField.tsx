import { useState } from 'react';
import { FileText, Upload, X } from 'lucide-react';

type UploadedDocument = {
  url: string;
  name: string;
  content_type?: string;
  storage?: string;
};

type Props = {
  value: UploadedDocument[];
  onChange: (documents: UploadedDocument[]) => void;
  onUploadingChange?: (uploading: boolean) => void;
};

export default function DocumentUploadField({ value, onChange, onUploadingChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function uploadFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    onUploadingChange?.(true);
    setError('');
    const uploaded: UploadedDocument[] = [];

    try {
      for (const file of Array.from(files)) {
        const data = new FormData();
        data.append('file', file, file.name);
        data.append('kind', 'document');
        const response = await fetch('/api/media', { method: 'POST', body: data, credentials: 'include' });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || `Upload impossible pour ${file.name}`);
        uploaded.push({
          url: payload.data.url,
          name: payload.data.name || file.name,
          content_type: payload.data.content_type,
          storage: payload.data.storage,
        });
      }
      onChange([...value, ...uploaded]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload impossible');
    } finally {
      setUploading(false);
      onUploadingChange?.(false);
    }
  }

  function removeDocument(index: number) {
    onChange(value.filter((_, itemIndex) => itemIndex !== index));
  }

  return (
    <div className="bg-white border border-stone-200/60 rounded-2xl p-5">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <p className="text-sm font-semibold text-stone-800">Documents justificatifs</p>
          <p className="text-xs text-stone-400 mt-1">PDF, images, DOC ou DOCX. Taille max 15 MB par fichier.</p>
        </div>
        <label className="btn-secondary px-4 py-2.5 text-sm cursor-pointer">
          <Upload className="w-4 h-4" />
          Ajouter
          <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx" onChange={(event) => uploadFiles(event.target.files)} className="hidden" />
        </label>
      </div>

      {uploading && <p className="text-xs text-stone-400 mb-3">Upload des documents...</p>}
      {error && <p className="text-xs text-red-600 mb-3">{error}</p>}

      {value.length > 0 ? (
        <div className="space-y-2">
          {value.map((document, index) => (
            <div key={`${document.url}-${index}`} className="flex items-center gap-2 bg-stone-50 border border-stone-200/60 rounded-xl px-3 py-2.5">
              <FileText className="w-4 h-4 text-stone-400 flex-shrink-0" />
              <a href={document.url} target="_blank" rel="noopener noreferrer" className="text-xs text-stone-700 hover:underline truncate flex-1">
                {document.name || document.url}
              </a>
              <span className="text-[10px] text-stone-400 uppercase">{document.storage || 'local'}</span>
              <button type="button" onClick={() => removeDocument(index)} className="text-stone-400 hover:text-red-500 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="border border-dashed border-stone-200 rounded-xl py-8 text-center">
          <FileText className="w-8 h-8 text-stone-300 mx-auto mb-2" />
          <p className="text-sm text-stone-400">Aucun document ajoute</p>
        </div>
      )}
    </div>
  );
}

export type { UploadedDocument };
