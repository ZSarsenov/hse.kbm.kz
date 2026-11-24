
import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Calendar,
  Settings,
  Hash,
  Zap,
  Lock,
  MapPin,
  Upload,
  CheckSquare,
  Image as ImageIcon,
  AlertCircle,
  FileText,
  Loader2,
  X,
  ExternalLink
} from 'lucide-react';
import { IsolationMatrix } from '../types';

interface IsolationMatrixFormProps {
  data: IsolationMatrix;
  onChange: (newData: IsolationMatrix) => void;
  readOnly?: boolean;
  permitId?: string | number | null;
  lotoPhotoUrl?: string | null;
  onPhotoUploaded?: (url: string) => void;
  onFileSelected?: (file: File | null) => void;
  onPhotoDeleted?: () => void;
}

export const IsolationMatrixForm: React.FC<IsolationMatrixFormProps> = ({
  data, onChange, readOnly = false, permitId, lotoPhotoUrl, onPhotoUploaded, onFileSelected, onPhotoDeleted
}) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [photoPreviewOpen, setPhotoPreviewOpen] = useState(false);

  const handleChange = (field: keyof IsolationMatrix, value: any) => {
    if (readOnly) return;
    onChange({ ...data, [field]: value });
  };

  const uploadFile = async (file: File) => {
    if (!permitId) {
      setSelectedFile(file);
      handleChange('photo', file.name);
      onFileSelected?.(file);
      return;
    }
    setUploading(true);
    setUploadError('');
    try {
      const token = localStorage.getItem('auth_token');
      const formData = new FormData();
      formData.append('loto_photo', file);
      const uploadUrls = [
        `/api/v1/permits/${permitId}/upload_loto_photo/`,
        `/api/v1/permits/${permitId}/upload-loto-photo/`,
        `/api/v1/permits/${permitId}/upload_loto_photo`,
        `/api/v1/permits/${permitId}/upload-loto-photo`,
      ];
      let res: Response | null = null;
      for (const url of uploadUrls) {
        const attempt = await fetch(url, {
          method: 'POST',
          headers: { 'Authorization': `Token ${token}` },
          body: formData,
        });
        res = attempt;
        if (attempt.status !== 404) break;
      }
      if (!res) {
        setUploadError(t('electrical.loto.uploadError'));
        return;
      }
      if (res.ok) {
        const result = await res.json();
        handleChange('photo', file.name);
        setSelectedFile(null);
        onPhotoUploaded?.(result.loto_photo_url);
      } else {
        const err = await res.json().catch(() => ({}));
        setUploadError(err.error || t('electrical.loto.uploadErrorStatus', { status: res.status }));
      }
    } catch {
      setUploadError(t('electrical.loto.connectionError'));
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (readOnly) return;
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'jpg', 'jpeg', 'png'].includes(ext || '')) {
      setUploadError(t('electrical.loto.fileTypesError'));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError(t('electrical.loto.fileSizeError'));
      return;
    }
    uploadFile(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (readOnly) return;
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (readOnly) return;
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  const hasPhoto = lotoPhotoUrl || data.photo;
  const isImage = lotoPhotoUrl?.match(/\.(jpg|jpeg|png)$/i);

  const deletePhoto = async () => {
    if (!permitId) {
      setSelectedFile(null);
      handleChange('photo', undefined);
      onFileSelected?.(null);
      return;
    }
    setUploading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const deleteUrls = [
        `/api/v1/permits/${permitId}/delete_loto_photo/`,
        `/api/v1/permits/${permitId}/delete-loto-photo/`,
        `/api/v1/permits/${permitId}/delete_loto_photo`,
        `/api/v1/permits/${permitId}/delete-loto-photo`,
      ];
      let res: Response | null = null;
      for (const url of deleteUrls) {
        const attempt = await fetch(url, {
          method: 'DELETE',
          headers: { 'Authorization': `Token ${token}` },
        });
        res = attempt;
        if (attempt.status !== 404) break;
      }
      if (!res) {
        setUploadError(t('electrical.loto.deleteError'));
        return;
      }
      if (res.ok) {
        handleChange('photo', undefined);
        onPhotoDeleted?.();
      } else {
        const err = await res.json().catch(() => ({}));
        setUploadError(err.error || t('electrical.loto.deleteShortError'));
      }
    } catch {
      setUploadError(t('electrical.loto.connectionError'));
    } finally {
      setUploading(false);
    }
  };

  // Input styling
  const labelClass = "block text-sm font-semibold text-gray-700 mb-1";
  const inputClass = `w-full border border-gray-300 rounded px-3 py-2 text-base transition-colors placeholder-gray-400 ${readOnly ? 'bg-gray-100 text-gray-600 cursor-not-allowed border-gray-200' : 'bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500'}`;

  return (
    <div className="space-y-6">
      
      {/* 1. Header / Context - 2 Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-gray-50 rounded-lg border border-gray-200">
        <div>
           <label className={labelClass}>{t('electrical.loto.department')}</label>
           <input 
             type="text" 
              value={data.department === 'Не указано' ? t('electrical.loto.notSpecified') : data.department}
             onChange={(e) => handleChange('department', e.target.value)}
             className={inputClass}
              placeholder={t('electrical.loto.departmentPlaceholder')}
             disabled={readOnly}
           />
        </div>
        <div>
            <label className={labelClass}>{t('electrical.loto.site')}</label>
           <input 
             type="text" 
             value={data.site}
             onChange={(e) => handleChange('site', e.target.value)}
             className={inputClass}
              placeholder={t('electrical.loto.sitePlaceholder')}
             disabled={readOnly}
           />
        </div>
        <div>
            <label className={labelClass}>{t('electrical.loto.dateDeveloped')}</label>
           <div className="relative">
              <input 
                type="date" 
                value={data.dateDeveloped}
                onChange={(e) => handleChange('dateDeveloped', e.target.value)}
                className={inputClass}
                disabled={readOnly}
              />
               <Calendar className="absolute right-3 top-2.5 text-gray-400 w-4 h-4 pointer-events-none"/>
            </div>
          </div>
        <div>
            <label className={labelClass}>{t('electrical.loto.dateRevised')}</label>
           <div className="relative">
              <input 
                type="date" 
                value={data.dateRevised}
                onChange={(e) => handleChange('dateRevised', e.target.value)}
                className={inputClass}
                disabled={readOnly}
              />
              <Calendar className="absolute right-3 top-2.5 text-gray-400 w-4 h-4 pointer-events-none"/>
           </div>
        </div>
      </div>
       {/* 2. Equipment Information */}
      <div className="p-5 bg-white rounded-lg border border-gray-200 shadow-sm">
          <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b pb-2 mb-4">{t('electrical.loto.equipmentInfo')}</h4>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
                <label className={labelClass}>{t('electrical.loto.equipmentName')}</label>
               <div className="relative">
                  <input 
                    type="text"
                    value={data.equipmentName}
                    onChange={(e) => handleChange('equipmentName', e.target.value)}
                    className={inputClass}
                     placeholder={t('electrical.loto.equipmentPlaceholder')}
                    disabled={readOnly}
                  />
                  {!readOnly && <Settings className="absolute right-3 top-2.5 text-gray-400 w-4 h-4"/>}
               </div>
            </div>
            <div className="md:col-span-1">
                <label className={labelClass}>{t('electrical.loto.tag')}</label>
               <div className="relative">
                  <input 
                    type="text"
                    value={data.techNumber}
                    onChange={(e) => handleChange('techNumber', e.target.value)}
                    className={inputClass}
                    placeholder="P-101-A"
                    disabled={readOnly}
                  />
                  {!readOnly && <Hash className="absolute right-3 top-2.5 text-gray-400 w-4 h-4"/>}
               </div>
            </div>
            <div className="md:col-span-1">
                <label className={labelClass}>{t('electrical.loto.energyCount')}</label>
               <input 
                 type="number"
                 value={data.energySourceCount}
                 onChange={(e) => handleChange('energySourceCount', Number(e.target.value))}
                 className={inputClass}
                 min={1}
                 disabled={readOnly}
               />
            </div>
         </div>
      </div>

      {/* 3. Isolation Details (Section B) */}
      <div className="p-5 bg-blue-50 rounded-lg border border-blue-100">
         <h4 className="text-sm font-bold text-blue-900 uppercase tracking-wide border-b border-blue-200 pb-2 mb-4">
              {t('electrical.loto.lockMethod')}
         </h4>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div>
                <label className="block text-sm font-semibold text-blue-800 mb-1">{t('electrical.loto.energyType')}</label>
                <div className="relative">
                   <select 
                      value={data.energyType}
                      onChange={(e) => handleChange('energyType', e.target.value)}
                      className={`w-full border border-blue-200 rounded px-3 py-2 text-base ${readOnly ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : 'bg-white focus:ring-1 focus:ring-blue-500'}`}
                      disabled={readOnly}
                   >
                       <option value="">{t('electrical.loto.choose')}</option>
                       <option value="electric">{t('electrical.loto.electric')}</option>
                       <option value="mechanical">{t('electrical.loto.mechanical')}</option>
                       <option value="hydraulic">{t('electrical.loto.hydraulic')}</option>
                       <option value="pneumatic">{t('electrical.loto.pneumatic')}</option>
                       <option value="chemical">{t('electrical.loto.chemical')}</option>
                       <option value="thermal">{t('electrical.loto.thermal')}</option>
                   </select>
                   {!readOnly && <Zap className="absolute right-3 top-2.5 text-blue-400 w-4 h-4 pointer-events-none"/>}
                </div>
             </div>
             <div>
                 <label className="block text-sm font-semibold text-blue-800 mb-1">{t('electrical.loto.lockType')}</label>
                <div className="relative">
                   <input 
                     type="text" 
                     value={data.lockType}
                     onChange={(e) => handleChange('lockType', e.target.value)}
                     className={`w-full border border-blue-200 rounded px-3 py-2 text-base ${readOnly ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : 'bg-white'}`}
                      placeholder={t('electrical.loto.lockTypePlaceholder')}
                     disabled={readOnly}
                   />
                   {!readOnly && <Lock className="absolute right-3 top-2.5 text-blue-400 w-4 h-4 pointer-events-none"/>}
                </div>
             </div>
             <div>
                <label className="block text-sm font-semibold text-blue-800 mb-1">{t('electrical.loto.installLocation')}</label>
                <div className="relative">
                   <input 
                     type="text" 
                     value={data.installLocation}
                     onChange={(e) => handleChange('installLocation', e.target.value)}
                     className={`w-full border border-blue-200 rounded px-3 py-2 text-base ${readOnly ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : 'bg-white'}`}
                      placeholder={t('electrical.loto.installLocationPlaceholder')}
                     disabled={readOnly}
                   />
                   {!readOnly && <MapPin className="absolute right-3 top-2.5 text-blue-400 w-4 h-4 pointer-events-none"/>}
                </div>
             </div>
         </div>
      </div>

      {/* 4. Section C: Evidence & Procedure (Critical) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         
         {/* Left: Field 8 - Photo Upload */}
         <div className="p-5 bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col h-full">
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                <ImageIcon size={16}/> {t('electrical.loto.photoTitle')}
            </h4>

            {readOnly ? (
               <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                  {lotoPhotoUrl ? (
                      <div className="p-4">
                           {isImage ? (
                               <button type="button" onClick={() => setPhotoPreviewOpen(true)} className="block mx-auto cursor-pointer">
                                  <img src={lotoPhotoUrl} alt={t('electrical.loto.photoTitle')} className="max-w-full max-h-80 rounded-lg border border-gray-200 hover:opacity-90" />
                               </button>
                          ) : (
                              <a
                                href={lotoPhotoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium p-4"
                              >
                                <FileText size={24} />
                                 {t('electrical.loto.openPdf')}
                                <ExternalLink size={14} />
                              </a>
                          )}
                      </div>
                  ) : data.photo ? (
                      <div className="flex items-center justify-center p-6">
                          <div className="text-center">
                              <FileText size={48} className="text-amber-500 mx-auto mb-2"/>
                               <p className="text-sm font-medium text-gray-700">{typeof data.photo === 'string' ? data.photo : t('electrical.loto.fileSpecified')}</p>
                               <p className="text-xs text-amber-600 mt-1">{t('electrical.loto.legacyFile')}</p>
                          </div>
                      </div>
                  ) : (
                      <div className="flex items-center justify-center p-6 text-gray-400">
                          <div className="text-center">
                              <ImageIcon size={48} className="text-gray-300 mx-auto mb-2"/>
                               <p className="text-sm font-medium text-gray-500">{t('electrical.loto.imageMissing')}</p>
                          </div>
                      </div>
                  )}
               </div>
            ) : (
                <div className="flex-1 flex flex-col">
                    {uploading ? (
                        <div className="flex-1 border-2 border-dashed border-blue-300 bg-blue-50 rounded-lg flex flex-col items-center justify-center p-6">
                            <Loader2 size={32} className="text-blue-500 animate-spin mb-2" />
                             <p className="text-sm font-medium text-blue-700">{t('electrical.loto.loading')}</p>
                        </div>
                    ) : hasPhoto && !selectedFile ? (
                        <div className="flex-1 border border-gray-200 rounded-lg p-4">
                            {lotoPhotoUrl && isImage ? (
                                 <button type="button" onClick={() => setPhotoPreviewOpen(true)} className="block mx-auto cursor-pointer">
                                   <img src={lotoPhotoUrl} alt={t('electrical.loto.photoTitle')} className="max-w-full max-h-64 rounded-lg border border-gray-200 mx-auto mb-3 hover:opacity-90" />
                                 </button>
                            ) : lotoPhotoUrl ? (
                                <a href={lotoPhotoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium mb-3">
                                     <FileText size={18} /> {t('electrical.loto.openDocument')} <ExternalLink size={14} />
                                </a>
                            ) : (
                                <div className="flex items-center gap-2 mb-3">
                                    <CheckSquare size={20} className="text-green-500"/>
                                     <span className="text-sm text-gray-700">{typeof data.photo === 'string' ? data.photo : t('electrical.loto.fileUploaded')}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                >
                                     {t('electrical.loto.replace')}
                                </button>
                                 <button
                                     onClick={deletePhoto}
                                    className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1"
                                >
                                      <X size={12}/> {t('electrical.loto.delete')}
                                 </button>
                             </div>
                         </div>
                    ) : (
                        <div
                           className={`flex-1 border-2 border-dashed rounded-lg flex flex-col items-center justify-center p-6 transition-colors cursor-pointer
                              ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'}`}
                           onDragEnter={handleDrag}
                           onDragLeave={handleDrag}
                           onDragOver={handleDrag}
                           onDrop={handleDrop}
                           onClick={() => fileInputRef.current?.click()}
                        >
                           <Upload size={32} className="text-gray-400 mx-auto mb-3"/>
                            <p className="text-sm font-medium text-gray-700">{t('electrical.loto.dropFile')}</p>
                            <p className="text-xs text-gray-400 mt-1">{t('electrical.loto.fileFormats')}</p>
        </div>
                    )}
                    <input
                       ref={fileInputRef}
                       type="file"
                       className="hidden"
                       accept=".jpg,.jpeg,.png,.pdf"
                       onChange={handleFileChange}
                    />
                    {uploadError && (
                        <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                            <AlertCircle size={12}/> {uploadError}
                        </p>
                    )}
                     {!permitId && selectedFile && (
                         <p className="text-xs text-amber-600 mt-2">{t('electrical.loto.afterSave')}</p>
                      )}
                  </div>
             )}
          </div>

         {/* Right: Field 9 - Procedure Checkbox Group */}
         <div className="p-5 bg-white rounded-lg border border-red-200 shadow-sm ring-1 ring-red-50">
             <h4 className="text-sm font-bold text-red-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                <AlertCircle size={16}/> {t('electrical.loto.procedureTitle')}
            </h4>
            {!readOnly && (
                <p className="text-xs text-gray-500 mb-4">
                    {t('electrical.loto.procedureHint')}
                </p>
            )}
            
            <div className="space-y-3">
               {[
                   { key: 'checkResidualEnergy', label: t('electrical.loto.residualEnergy'), sub: t('electrical.loto.residualEnergyHint') },
                   { key: 'checkLockDevice', label: t('electrical.loto.lockDevice'), sub: t('electrical.loto.lockDeviceHint') },
                   { key: 'checkPadlock', label: t('electrical.loto.padlock'), sub: t('electrical.loto.padlockHint') },
                   { key: 'checkTag', label: t('electrical.loto.safetyTag'), sub: t('electrical.loto.tagHint') }
               ].map((item) => (
                   <label key={item.key} className={`flex items-start gap-3 p-3 rounded transition-all border border-transparent ${readOnly ? 'cursor-default' : 'hover:bg-gray-50 cursor-pointer hover:border-gray-200'}`}>
                      <input 
                         type="checkbox" 
                         className={`mt-1 w-5 h-5 rounded focus:ring-blue-500 ${readOnly ? 'text-gray-500 bg-gray-100 border-gray-300' : 'text-blue-600 border-gray-300'}`}
                         checked={(data as any)[item.key]}
                         onChange={(e) => handleChange(item.key as keyof IsolationMatrix, e.target.checked)}
                         disabled={readOnly}
                      />
                      <div>
                         <span className={`block text-base font-medium ${readOnly ? 'text-gray-700' : 'text-gray-900'}`}>{item.label}</span>
                         <span className="text-xs text-gray-500">{item.sub}</span>
                      </div>
                   </label>
                ))}
             </div>
          </div>
       </div>
       {photoPreviewOpen && lotoPhotoUrl && (
         <div
           className="fixed inset-0 z-[130] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4"
           onClick={() => setPhotoPreviewOpen(false)}
         >
           <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
             <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
               <span className="font-bold text-slate-800 text-sm">{t('electrical.loto.photoTitle')}</span>
               <button type="button" onClick={() => setPhotoPreviewOpen(false)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                 <X size={22} />
               </button>
             </div>
             <div className="p-4 overflow-auto flex justify-center bg-slate-50">
               <img src={lotoPhotoUrl} alt={t('electrical.loto.photoTitle')} className="max-w-full max-h-[70vh] object-contain rounded" />
             </div>
             <div className="px-5 py-3 border-t border-gray-100 flex justify-end">
               <button type="button" onClick={() => setPhotoPreviewOpen(false)} className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300">
                 {t('electrical.loto.close')}
               </button>
             </div>
           </div>
         </div>
       )}
     </div>
  );
};
