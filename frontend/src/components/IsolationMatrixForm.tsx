
import React, { useRef, useState } from 'react';
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
  AlertCircle
} from 'lucide-react';
import { IsolationMatrix } from '../types';

interface IsolationMatrixFormProps {
  data: IsolationMatrix;
  onChange: (newData: IsolationMatrix) => void;
  readOnly?: boolean; // New prop for report view mode
}

export const IsolationMatrixForm: React.FC<IsolationMatrixFormProps> = ({ data, onChange, readOnly = false }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleChange = (field: keyof IsolationMatrix, value: any) => {
    if (readOnly) return;
    onChange({ ...data, [field]: value });
  };

  // Mock File Upload Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (readOnly) return;
    if (e.target.files && e.target.files[0]) {
      handleChange('photo', e.target.files[0].name);
    }
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
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleChange('photo', e.dataTransfer.files[0].name);
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
           <label className={labelClass}>1. Структурное подразделение</label>
           <input 
             type="text" 
             value={data.department}
             onChange={(e) => handleChange('department', e.target.value)}
             className={inputClass}
             placeholder="Напр. Цех добычи нефти"
             disabled={readOnly}
           />
        </div>
        <div>
           <label className={labelClass}>Участок / Цех</label>
           <input 
             type="text" 
             value={data.site}
             onChange={(e) => handleChange('site', e.target.value)}
             className={inputClass}
             placeholder="Напр. Участок №2"
             disabled={readOnly}
           />
        </div>
        <div>
           <label className={labelClass}>2. Дата разработки</label>
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
           <label className={labelClass}>3. Дата пересмотра</label>
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
         <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b pb-2 mb-4">Информация об оборудовании</h4>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
               <label className={labelClass}>4. Наименование оборудования</label>
               <div className="relative">
                  <input 
                    type="text"
                    value={data.equipmentName}
                    onChange={(e) => handleChange('equipmentName', e.target.value)}
                    className={inputClass}
                    placeholder="Насос, Компрессор..."
                    disabled={readOnly}
                  />
                  {!readOnly && <Settings className="absolute right-3 top-2.5 text-gray-400 w-4 h-4"/>}
               </div>
            </div>
            <div className="md:col-span-1">
               <label className={labelClass}>5. Технологический номер (Tag)</label>
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
               <label className={labelClass}>6. Кол-во источников энергии</label>
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
             7. Способ установки блокирующего устройства
         </h4>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div>
                <label className="block text-sm font-semibold text-blue-800 mb-1">Вид опасной энергии</label>
                <div className="relative">
                   <select 
                      value={data.energyType}
                      onChange={(e) => handleChange('energyType', e.target.value)}
                      className={`w-full border border-blue-200 rounded px-3 py-2 text-base ${readOnly ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : 'bg-white focus:ring-1 focus:ring-blue-500'}`}
                      disabled={readOnly}
                   >
                      <option value="">Выберите...</option>
                      <option value="electric">Электрическая</option>
                      <option value="mechanical">Механическая</option>
                      <option value="hydraulic">Гидравлическая</option>
                      <option value="pneumatic">Пневматическая</option>
                      <option value="chemical">Химическая</option>
                      <option value="thermal">Термическая</option>
                   </select>
                   {!readOnly && <Zap className="absolute right-3 top-2.5 text-blue-400 w-4 h-4 pointer-events-none"/>}
                </div>
             </div>
             <div>
                <label className="block text-sm font-semibold text-blue-800 mb-1">Тип блокирующего устройства</label>
                <div className="relative">
                   <input 
                     type="text" 
                     value={data.lockType}
                     onChange={(e) => handleChange('lockType', e.target.value)}
                     className={`w-full border border-blue-200 rounded px-3 py-2 text-base ${readOnly ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : 'bg-white'}`}
                     placeholder="Напр. Блокиратор вентиля"
                     disabled={readOnly}
                   />
                   {!readOnly && <Lock className="absolute right-3 top-2.5 text-blue-400 w-4 h-4 pointer-events-none"/>}
                </div>
             </div>
             <div>
                <label className="block text-sm font-semibold text-blue-800 mb-1">Место установки</label>
                <div className="relative">
                   <input 
                     type="text" 
                     value={data.installLocation}
                     onChange={(e) => handleChange('installLocation', e.target.value)}
                     className={`w-full border border-blue-200 rounded px-3 py-2 text-base ${readOnly ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : 'bg-white'}`}
                     placeholder="Напр. Щитовая №3"
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
               <ImageIcon size={16}/> 8. Фотография / Схема установки
            </h4>
            
            {readOnly ? (
               <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center p-6 text-gray-400">
                  {data.photo ? (
                      <div className="text-center">
                          <CheckSquare size={48} className="text-blue-500 mx-auto mb-2"/>
                          <p className="text-sm font-medium text-gray-900">Фотография приложена</p>
                          <p className="text-xs text-gray-500 mt-1">{typeof data.photo === 'string' ? data.photo : data.photo.name}</p>
                      </div>
                  ) : (
                      <div className="text-center">
                          <ImageIcon size={48} className="text-gray-300 mx-auto mb-2"/>
                          <p className="text-sm font-medium text-gray-500">Изображение отсутствует</p>
                      </div>
                  )}
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
                   <input 
                      ref={fileInputRef}
                      type="file" 
                      className="hidden" 
                      accept="image/*,.pdf"
                      onChange={handleFileChange} 
                   />
                   
                   {data.photo ? (
                      <div className="text-center">
                         <CheckSquare size={48} className="text-green-500 mx-auto mb-2"/>
                         <p className="text-sm font-medium text-gray-900">Файл загружен</p>
                         <p className="text-xs text-gray-500 mt-1">{typeof data.photo === 'string' ? data.photo : data.photo.name}</p>
                         <button 
                            onClick={(e) => { e.stopPropagation(); handleChange('photo', undefined); }}
                            className="mt-3 text-xs text-red-500 hover:text-red-700 font-medium"
                         >
                            Удалить
                         </button>
                      </div>
                   ) : (
                      <div className="text-center">
                         <Upload size={32} className="text-gray-400 mx-auto mb-3"/>
                         <p className="text-sm font-medium text-gray-700">Нажмите или перетащите фото</p>
                         <p className="text-xs text-gray-400 mt-1">JPG, PNG, PDF до 5MB</p>
                      </div>
                   )}
                </div>
            )}
         </div>

         {/* Right: Field 9 - Procedure Checkbox Group */}
         <div className="p-5 bg-white rounded-lg border border-red-200 shadow-sm ring-1 ring-red-50">
             <h4 className="text-sm font-bold text-red-700 uppercase tracking-wide mb-3 flex items-center gap-2">
               <AlertCircle size={16}/> 9. Порядок выполнения работ (Чек-лист)
            </h4>
            {!readOnly && (
                <p className="text-xs text-gray-500 mb-4">
                   Отметьте каждый пункт после фактического выполнения действия. Это ваша личная ответственность за безопасность.
                </p>
            )}
            
            <div className="space-y-3">
               {[
                  { key: 'checkResidualEnergy', label: '9.1. Определить остаточную энергию', sub: 'Убедиться в отсутствии напряжения и давления.' },
                  { key: 'checkLockDevice', label: '9.2. Установить блокирующее устройство', sub: 'Зафиксировать устройство в положении «Отключено».' },
                  { key: 'checkPadlock', label: '9.3. Установить навесной замок', sub: 'Каждый работник устанавливает личный замок.' },
                  { key: 'checkTag', label: '9.4. Установить бирку безопасности', sub: 'Указать ФИО, дату и причину блокировки.' }
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
    </div>
  );
};
