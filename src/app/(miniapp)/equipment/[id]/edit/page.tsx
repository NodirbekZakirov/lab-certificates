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
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
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
      setPhotoUrl(data.photoUrl);
    } catch (err) {
      console.error('Failed to load equipment:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'certificate' | 'photo') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert(t.validation.fileTooLarge);
      return;
    }

    // Validate file type
    const allowedTypes = fieldName === 'photo' 
      ? ['image/jpeg', 'image/png', 'image/webp']
      : ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

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
            pathname: `${fieldName}s/${id}/${file.name}`,
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
      
      if (fieldName === 'photo') {
        setPhotoUrl(blob.url);
      } else {
        setFileUrl(blob.url);
        setFileType(file.type.startsWith('image/') ? 'image' : 'pdf');
      }
    } catch (err) {
      console.error('Upload error:', err);
      // Fallback: use simple upload via FormData
      try {
        const reader = new FileReader();
        reader.onload = () => {
          if (fieldName === 'photo') {
            setPhotoUrl(reader.result as string);
          } else {
            setFileUrl(reader.result as string);
            setFileType(file.type.startsWith('image/') ? 'image' : 'pdf');
          }
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
        photoUrl: photoUrl || undefined,
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
      <div className="p-5 space-y-5">
        <div className="skeleton h-10 w-48 mb-6" />
        <div className="skeleton h-20 w-full rounded-2xl" />
        <div className="skeleton h-20 w-full rounded-2xl" />
        <div className="skeleton h-32 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-28">
      <div className="p-5 pb-2">
        <Link
          href={`/equipment/${id}`}
          className="inline-flex items-center gap-2 text-text-secondary hover:text-accent transition-colors mb-5 bg-bg-secondary px-4 py-2 rounded-xl border border-border w-fit active:scale-95 shadow-sm"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
          <span className="text-[13px] font-bold tracking-wide uppercase">{t.app.back}</span>
        </Link>
        <h1 className="text-2xl font-bold gradient-text tracking-tight mb-4">
          {t.equipment.updateCertificate}
        </h1>
      </div>

      {successMessage && (
        <div className="mx-5 mb-5 p-3 rounded-xl bg-status-green-bg border border-status-green/30 animate-slide-up shadow-sm">
          <p className="text-sm text-status-green text-center font-bold tracking-wide">{successMessage}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="px-5 space-y-5 max-w-2xl mx-auto">
        {/* Photo upload */}
        <div className="animate-slide-up delay-100 flex flex-col items-center mb-6">
          <label className="block text-[13px] font-semibold text-text-muted mb-3 uppercase tracking-wider text-center">Фотография прибора</label>
          
          <div className="relative mb-3 group">
            {photoUrl ? (
              <img src={photoUrl} alt="Equipment" className="w-24 h-24 rounded-full object-cover border-4 border-bg-secondary shadow-md" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-bg-secondary flex items-center justify-center border-4 border-border shadow-sm">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-muted">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>
            )}
            
            <label className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center cursor-pointer hover:scale-110 transition-transform shadow-lg border-2 border-bg-primary">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => handleFileChange(e, 'photo')}
                className="hidden"
              />
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </label>
          </div>
        </div>

        {/* Name */}
        <div className="animate-slide-up delay-100">
          <label className="block text-[13px] font-semibold text-text-muted mb-2 ml-1 uppercase tracking-wider">{t.equipment.name}</label>
          <input
            type="text"
            className="input-field shadow-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.equipment.namePlaceholder}
            required
          />
        </div>

        {/* Certificate number */}
        <div className="animate-slide-up delay-200">
          <label className="block text-[13px] font-semibold text-text-muted mb-2 ml-1 uppercase tracking-wider">{t.equipment.certificateNumber}</label>
          <input
            type="text"
            className="input-field shadow-sm"
            value={certificateNumber}
            onChange={(e) => setCertificateNumber(e.target.value)}
            placeholder={t.equipment.certificateNumberPlaceholder}
          />
        </div>

        {/* Expiry date */}
        <div className="animate-slide-up delay-300">
          <label className="block text-[13px] font-semibold text-text-muted mb-2 ml-1 uppercase tracking-wider">{t.equipment.expiryDate}</label>
          <input
            type="date"
            className="input-field shadow-sm block w-full"
            style={{ colorScheme: 'dark' }}
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            required
          />
        </div>

        {/* File upload */}
        <div className="animate-slide-up delay-300">
          <label className="block text-[13px] font-semibold text-text-muted mb-3 ml-1 uppercase tracking-wider">{t.equipment.certificateFile}</label>
          
          {fileUrl && fileType === 'image' && (
            <div className="mb-4 rounded-2xl overflow-hidden border-2 border-border shadow-sm">
              <img src={fileUrl} alt="Certificate" className="w-full h-56 object-cover" />
            </div>
          )}
          
          {fileUrl && fileType === 'pdf' && (
            <div className="mb-4 p-4 rounded-2xl bg-bg-secondary flex items-center gap-3 border border-border shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-accent">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <span className="text-[15px] font-bold text-text-primary">PDF {t.equipment.certificateFile}</span>
            </div>
          )}
          
          <label className="upload-area block cursor-pointer group">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={(e) => handleFileChange(e, 'certificate')}
              className="hidden"
            />
            <div className="flex flex-col items-center gap-3">
              {uploading ? (
                <div className="w-10 h-10 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-bg-secondary group-hover:bg-accent/10 flex items-center justify-center transition-colors border border-border group-hover:border-accent/30">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-muted group-hover:text-accent transition-colors">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </div>
                  <span className="text-[13px] font-bold text-text-secondary group-hover:text-accent transition-colors">
                    {fileUrl ? t.equipment.changeFile : t.equipment.uploadPhoto}
                  </span>
                </>
              )}
            </div>
          </label>
        </div>

        <div className="pt-2 animate-slide-up delay-300">
          <button
            type="submit"
            className="btn-primary w-full shadow-lg"
            disabled={saving || !name || !expiryDate || uploading}
          >
            {saving ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {t.app.loading}
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                  <polyline points="17 21 17 13 7 13 7 21"></polyline>
                  <polyline points="7 3 7 8 15 8"></polyline>
                </svg>
                {t.app.save}
              </div>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
