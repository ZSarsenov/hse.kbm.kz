
import React from 'react';
import { Printer, X, QrCode } from 'lucide-react';

// --- Types based on your specification ---
export interface PermitPrintData {
  id: string;
  status: string;
  generalInfo: {
    workDescription: string;
    location: string;
    startTime: string;
    endTime: string;
    responsiblePerson: string;
    organization: string;
    department: string;
  };
  brigade: Array<{
    id: string;
    fullName: string;
    role: string;
    qualification: string;
    passedBriefing: boolean;
  }>;
  riskAssessment: Array<{
    id: string;
    hazard: string;
    measure: string;
    ppe: string[];
  }>;
  loto?: {
    isRequired: boolean;
    points: Array<{ tagId: string; equipment: string; status: 'LOCKED' | 'UNLOCKED' }>;
  };
  signatures: Array<{
    role: string;
    name: string;
    timestamp: string;
    signHash: string; // Thumbprint/Hash
  }>;
}

interface PermitPrintViewProps {
  data: PermitPrintData;
  onClose: () => void;
}

export const PermitPrintView: React.FC<PermitPrintViewProps> = ({ data, onClose }) => {
  
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-gray-900/50 flex justify-center overflow-y-auto print:bg-white print:p-0 print:absolute print:inset-0 print:block">
      
      {/* --- Toolbar (Hidden on Print) --- */}
      <div className="fixed top-4 right-4 flex gap-2 print:hidden z-50">
        <button 
          onClick={handlePrint} 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-lg flex items-center gap-2 transition-colors"
        >
          <Printer size={20} /> Печать
        </button>
        <button 
          onClick={onClose} 
          className="bg-white hover:bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium shadow-lg flex items-center gap-2 transition-colors"
        >
          <X size={20} /> Закрыть
        </button>
      </div>

      {/* --- A4 Paper Container --- */}
      <div className="bg-white w-[210mm] min-h-[297mm] mx-auto my-8 p-[15mm] shadow-2xl print:shadow-none print:w-full print:m-0 print:h-auto text-black font-serif leading-tight">
        
        {/* 1. Header */}
        <header className="border-b-2 border-black pb-4 mb-6 flex justify-between items-start">
          <div className="w-1/3">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-600 mb-1">АО «Каражанбасмунай»</h2>
            <div className="text-xs">Система электронных нарядов-допусков</div>
          </div>
          
          <div className="w-1/3 text-center">
            <h1 className="text-2xl font-bold uppercase mb-1">Наряд-допуск</h1>
            <div className="text-lg font-mono font-bold">{data.id}</div>
          </div>

          <div className="w-1/3 flex flex-col items-end">
             {/* Fake QR for demo */}
             <div className="border border-black p-1 mb-1">
               <QrCode size={48} />
             </div>
             <div className="text-[10px] text-right">
               <div>Статус: <span className="font-bold uppercase">{data.status}</span></div>
               <div>UUID: {data.id.substring(0, 12)}...</div>
             </div>
          </div>
        </header>

        {/* 2. General Info */}
        <section className="mb-6 break-inside-avoid">
          <h3 className="text-sm font-bold uppercase border-b border-black mb-2 pb-1">1. Общие сведения</h3>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-500 uppercase">Организация / Подразделение</span>
              <span className="font-semibold">{data.generalInfo.organization}, {data.generalInfo.department}</span>
            </div>
             <div className="flex flex-col">
              <span className="text-[10px] text-gray-500 uppercase">Место работ</span>
              <span className="font-semibold">{data.generalInfo.location}</span>
            </div>
             <div className="col-span-2 flex flex-col mt-2">
              <span className="text-[10px] text-gray-500 uppercase">Содержание работ</span>
              <span className="font-semibold italic">{data.generalInfo.workDescription}</span>
            </div>
            <div className="flex flex-col mt-2">
              <span className="text-[10px] text-gray-500 uppercase">Начало работ</span>
              <span>{new Date(data.generalInfo.startTime).toLocaleString('ru-RU')}</span>
            </div>
            <div className="flex flex-col mt-2">
              <span className="text-[10px] text-gray-500 uppercase">Окончание работ</span>
              <span>{new Date(data.generalInfo.endTime).toLocaleString('ru-RU')}</span>
            </div>
            <div className="col-span-2 flex flex-col mt-2">
              <span className="text-[10px] text-gray-500 uppercase">Ответственный руководитель</span>
              <span className="font-semibold">{data.generalInfo.responsiblePerson}</span>
            </div>
          </div>
        </section>

        {/* 3. Brigade */}
        <section className="mb-6 break-inside-avoid">
          <h3 className="text-sm font-bold uppercase border-b border-black mb-2 pb-1">2. Состав бригады</h3>
          <table className="w-full text-xs border-collapse border border-black">
            <thead>
              <tr className="bg-gray-100 print:bg-gray-200">
                <th className="border border-black px-2 py-1 text-left w-10">№</th>
                <th className="border border-black px-2 py-1 text-left">ФИО</th>
                <th className="border border-black px-2 py-1 text-left">Роль / Должность</th>
                <th className="border border-black px-2 py-1 text-center">Инструктаж</th>
              </tr>
            </thead>
            <tbody>
              {data.brigade.map((member, idx) => (
                <tr key={member.id}>
                  <td className="border border-black px-2 py-1 text-center">{idx + 1}</td>
                  <td className="border border-black px-2 py-1 font-semibold">{member.fullName}</td>
                  <td className="border border-black px-2 py-1">{member.role} ({member.qualification})</td>
                  <td className="border border-black px-2 py-1 text-center">
                    {member.passedBriefing ? 'ПРОЙДЕН (ЭЦП)' : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* 4. Risk Assessment */}
        <section className="mb-6 break-inside-avoid">
          <h3 className="text-sm font-bold uppercase border-b border-black mb-2 pb-1">3. Оценка рисков и меры безопасности</h3>
          <table className="w-full text-xs border-collapse border border-black">
            <thead>
              <tr className="bg-gray-100 print:bg-gray-200">
                <th className="border border-black px-2 py-1 text-left w-[30%]">Опасный фактор</th>
                <th className="border border-black px-2 py-1 text-left w-[40%]">Меры контроля</th>
                <th className="border border-black px-2 py-1 text-left w-[30%]">СИЗ</th>
              </tr>
            </thead>
            <tbody>
              {data.riskAssessment.map((risk) => (
                <tr key={risk.id}>
                  <td className="border border-black px-2 py-1 align-top">{risk.hazard}</td>
                  <td className="border border-black px-2 py-1 align-top">{risk.measure}</td>
                  <td className="border border-black px-2 py-1 align-top italic">{risk.ppe.join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* 5. LOTO (Conditional) */}
        {data.loto?.isRequired && (
          <section className="mb-6 break-inside-avoid">
            <h3 className="text-sm font-bold uppercase border-b border-black mb-2 pb-1 flex items-center gap-2">
              4. Блокировка и Маркировка (LOTO)
            </h3>
            <table className="w-full text-xs border-collapse border border-black">
              <thead>
                <tr className="bg-gray-100 print:bg-gray-200">
                  <th className="border border-black px-2 py-1 text-left">Тег / № Оборудования</th>
                  <th className="border border-black px-2 py-1 text-left">Точка изоляции</th>
                  <th className="border border-black px-2 py-1 text-center">Статус</th>
                </tr>
              </thead>
              <tbody>
                {data.loto.points.map((point, idx) => (
                  <tr key={idx}>
                    <td className="border border-black px-2 py-1 font-mono">{point.tagId}</td>
                    <td className="border border-black px-2 py-1">{point.equipment}</td>
                    <td className="border border-black px-2 py-1 text-center font-bold">
                      {point.status === 'LOCKED' ? 'ЗАБЛОКИРОВАНО' : 'РАЗБЛОКИРОВАНО'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* 6. Footer / Signatures */}
        <section className="mt-8 break-inside-avoid">
          <h3 className="text-sm font-bold uppercase border-b border-black mb-4 pb-1">Электронные подписи</h3>
          
          <div className="grid grid-cols-2 gap-4">
            {data.signatures.map((sig, idx) => (
              <div key={idx} className="border border-black p-3 relative">
                <div className="absolute top-0 right-0 bg-black text-white text-[9px] px-1 uppercase font-bold">
                  Подписано ЭЦП
                </div>
                <div className="text-[10px] text-gray-500 uppercase mb-1">{sig.role}</div>
                <div className="font-bold text-sm mb-1">{sig.name}</div>
                <div className="text-[10px] font-mono text-gray-600 mb-1">
                  {new Date(sig.timestamp).toLocaleString('ru-RU')}
                </div>
                <div className="text-[8px] font-mono text-gray-400 break-all leading-none">
                  HASH: {sig.signHash}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-8 text-[10px] text-center text-gray-400">
            Документ сформирован в ИС "Электронный Наряд-Допуск" АО "Каражанбасмунай". 
            Проверить подлинность документа можно по ID: {data.id}
          </div>
        </section>

      </div>
    </div>
  );
};
