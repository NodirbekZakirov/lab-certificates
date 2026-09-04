'use client';

import { useEffect, useState, use } from 'react';
import { useTranslation } from '@/lib/i18n/context';
import { api, getInitData, type EquipmentDetail } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function EditEquipmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { t } = useTranslation();
  const router = useRouter();
  const [equipment, setEquipment] = useState<EquipmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [certificateNumber, setCertificateNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadEquipment();
  }, [id]);

  const loadEquipment = async () => {
    try {
      const data = await api.getEquipmentById(id);
      setEquipment(data);
      setName(data.name);
      setCertificateNumber(data.certificateNumber || '');
      setExpiryDate(data.expiryDate);
      setFileUrl(data.certificateFileUrl);
      setFileType(data.certificateFileType);
    } catch (err) {
      console.error('Failed to load equipment:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert(t.validation.fileTooLarge);
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      alert(t.validation.invalidFileType);
      return;
    }

    setUploading(true);
    try {
      // Upload directly to Vercel Blob via client upload
      const initData = getInitData();
      const response = await fetch('/api/upload/blob-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'blob.generate-client-token',
          payload: {
            pathname: `certificates/${id}/${file.name}`,
            callbackUrl: '/api/upload/blob-token',
            clientPayload: initData,
          },
        }),
      });

      if (!response.ok) throw new Error('Upload failed');

      const { clientToken } = await response.json();

      // Use the token to upload
      const uploadResponse = await fetch(clientToken, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });

      if (!uploadResponse.ok) throw new Error('Upload failed');

      const blob = await uploadResponse.json();
      setFileUrl(blob.url);
      setFileType(file.type.startsWith('image/') ? 'image' : 'pdf');
    } catch (err) {
      console.error('Upload error:', err);
      // Fallback: use simple upload via FormData
      try {
        const formData = new FormData();
        formData.append('file', file);

        // For now, convert to base64 data URL as fallback
        const reader = new FileReader();
        reader.onload = () => {
          setFileUrl(reader.result as string);
          setFileType(file.type.startsWith('image/') ? 'image' : 'pdf');
        };
        reader.readAsDataURL(file);
      } catch {
        alert('Failed to upload file');
      }
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !expiryDate) {
      return;
    }

    setSaving(true);
    try {
      await api.updateEquipment(id, {
        name,
        certificateNumber: certificateNumber || undefined,
        expiryDate,
        certificateFileUrl: fileUrl || undefined,
        certificateFileType: fileType || undefined,
      });
      setSuccessMessage(t.equipment.updated);
      setTimeout(() => {
        router.push(`/equipment/${id}`);
      }, 1000);
    } catch (err) {
      console.error('Failed to update:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-16 w-full" />
        <div className="skeleton h-16 w-full" />
        <div className="skeleton h-16 w-full" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="p-4 pb-0">
        <Link
          href={`/equipment/${id}`}
          className="inline-flex items-center gap-1 text-text-secondary hover:text-accent transition-colors mb-4"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6" />
          </svg>
          <span className="text-sm">{t.app.back}</span>
        </Link>
        <h1 className="text-lg font-bold gradient-text mb-4">
          {t.equipment.updateCertificate}
        </h1>
      </div>

      {successMessage && (
        <div className="mx-4 mb-4 p-3 rounded-xl bg-status-green-bg border border-status-green/20">
          <p className="text-sm text-status-green text-center font-medium">{successMessage}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="px-4 space-y-4 pb-8">
        {/* Name */}
        <div>
          <label className="block text-xs text-text-muted mb-2">{t.equipment.name}</label>
          <input
            type="text"
            className="input-field"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.equipment.namePlaceholder}
            required
          />
        </div>

        {/* Certificate number */}
        <div>
          <label className="block text-xs text-text-muted mb-2">{t.equipment.certificateNumber}</label>
          <input
            type="text"
            className="input-field"
            value={certificateNumber}
            onChange={(e) => setCertificateNumber(e.target.value)}
            placeholder={t.equipment.certificateNumberPlaceholder}
          />
        </div>

        {/* Expiry date */}
        <div>
          <label className="block text-xs text-text-muted mb-2">{t.equipment.expiryDate}</label>
          <input
            type="date"
            className="input-field"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            required
          />
        </div>

        {/* File upload */}
        <div>
          <label className="block text-xs text-text-muted mb-2">{t.equipment.certificateFile}</label>
          {fileUrl && fileType === 'image' && (
            <div className="mb-3 rounded-xl overflow-hidden border border-border">
              <img src={fileUrl} alt="Certificate" className="w-full h-48 object-cover" />
            </div>
          )}
          {fileUrl && fileType === 'pdf' && (
            <div className="mb-3 p-3 rounded-xl bg-bg-secondary flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <span className="text-sm text-text-secondary">PDF</span>
            </div>
          )}
          <label className="upload-area block cursor-pointer">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex flex-col items-center gap-2">
              {uploading ? (
                <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-muted">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <span className="text-sm text-text-muted">
                    {fileUrl ? t.equipment.changeFile : t.equipment.uploadPhoto}
                  </span>
                </>
              )}
            </div>
          </label>
        </div>

        <button
          type="submit"
          className="btn-primary w-full"
          disabled={saving || !name || !expiryDate}
        >
          {saving ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {t.app.loading}
            </div>
          ) : (
            t.app.save
          )}
        </button>
      </form>
    </div>
  );
}
