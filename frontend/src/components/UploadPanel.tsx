import React, { useCallback, useEffect, useRef, useState } from 'react';
import { uploadFileXHR, getDocument, type DocumentStatus } from '../services/backend';

const POLL_INTERVAL_MS = 1500;

const UploadPanel: React.FC = () => {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doc, setDoc] = useState<DocumentStatus | null>(null);
  const pollRef = useRef<number | null>(null);

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFile(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const startUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file to upload.');
      return;
    }
    setError(null);
    setUploading(true);
    setProgress(0);
    setDoc(null);
    try {
      const res = await uploadFileXHR(selectedFile, setProgress);
      // begin polling
      const id = res.id;
      pollRef.current = window.setInterval(async () => {
        try {
          const d = await getDocument(id);
          setDoc(d);
          if (d.status === 'processed' || d.status === 'failed') {
            if (pollRef.current) window.clearInterval(pollRef.current);
            pollRef.current = null;
            setUploading(false);
            setProgress(100);
          }
        } catch (err: any) {
          setError(err?.message || 'Polling failed');
          if (pollRef.current) window.clearInterval(pollRef.current);
          pollRef.current = null;
          setUploading(false);
        }
      }, POLL_INTERVAL_MS);
    } catch (err: any) {
      setError(err?.message || 'Upload failed');
      setUploading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, []);

  const accept = [
    '.pdf', '.docx', '.ppt', '.pptx', '.txt', '.png', '.jpg', '.jpeg', '.tiff'
  ].join(',');

  return (
    <section className="bg-slate-800/40 border border-slate-700 rounded-xl p-4 md:p-6">
      <h2 className="text-xl font-semibold mb-3">Upload Documents</h2>
      <p className="text-slate-400 mb-4">Drop a pitch deck, financials, or a text/image file. We will extract the text and make it available for analysis.</p>

      <div
        className={`rounded-lg border-2 border-dashed ${dragOver ? 'border-blue-500 bg-blue-500/10' : 'border-slate-600'} p-6 text-center transition-colors`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        <input id="file-input" type="file" accept={accept} onChange={onFileChange} className="hidden" />
        <label htmlFor="file-input" className="cursor-pointer inline-block px-4 py-2 rounded bg-slate-700 hover:bg-slate-600 border border-slate-600">
          Choose File
        </label>
        <p className="mt-2 text-sm text-slate-400">or drag & drop here</p>
        {selectedFile && (
          <p className="mt-2 text-sm">Selected: <span className="text-slate-300">{selectedFile.name}</span></p>
        )}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-50"
          onClick={startUpload}
          disabled={!selectedFile || uploading}
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
        {uploading && (
          <div className="flex-1 h-3 bg-slate-700 rounded overflow-hidden">
            <div className="h-full bg-blue-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 text-sm text-red-300 bg-red-900/40 border border-red-800 rounded p-3">{error}</div>
      )}

      {doc && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Processed Document</h3>
            <span className={`text-xs px-2 py-1 rounded border ${doc.status === 'processed' ? 'bg-green-500/20 border-green-600 text-green-300' : doc.status === 'failed' ? 'bg-red-500/20 border-red-600 text-red-300' : 'bg-yellow-500/20 border-yellow-600 text-yellow-300'}`}>{doc.status}</span>
          </div>
          <p className="text-slate-400 text-sm break-words">{doc.filename} • {doc.file_type.toUpperCase()}</p>
          {doc.extracted_text && (
            <div className="mt-3 max-h-64 overflow-auto bg-slate-900/60 border border-slate-700 rounded p-3 text-sm whitespace-pre-wrap">
              {doc.extracted_text}
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default UploadPanel;
