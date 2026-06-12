
import React from 'react';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';
import { RiskTableRow, RiskGroupMember } from '../types';

interface RiskAssessmentWidgetProps {
    // Risk Table Data
    riskTable: RiskTableRow[];
    onAddRiskRow: () => void;
    onRemoveRiskRow: (id: string) => void;
    onUpdateRiskRow: (id: string, field: keyof RiskTableRow, value: string) => void;

    // Risk Group Data (Optional - for participant list)
    riskGroup?: RiskGroupMember[];
    onAddRiskGroupMember?: () => void;
    onRemoveRiskGroupMember?: (id: string) => void;
    onUpdateRiskGroupMember?: (id: string, field: keyof RiskGroupMember, value: string) => void;

    // Optional metadata (shown at top)
    riskIdentifiedBy?: string;
    onRiskIdentifiedByChange?: (value: string) => void;

    // General info display (optional)
    workPlace?: string;
    organization?: string;
    content?: string;

    // Readonly mode
    isReadonly?: boolean;

    // Style variant
    variant?: 'standard' | 'electrical';
}

// Common input classes for the widget (reusable styling)
const commonInputClasses = "w-full bg-[#f7f7f7] border-gray-300 rounded-md px-4 py-3 text-lg text-gray-900 focus:ring-blue-500 focus:border-blue-500 border transition-colors placeholder-gray-400";

export const RiskAssessmentWidget: React.FC<RiskAssessmentWidgetProps> = ({
    riskTable,
    onAddRiskRow,
    onRemoveRiskRow,
    onUpdateRiskRow,
    riskGroup,
    onAddRiskGroupMember,
    onRemoveRiskGroupMember,
    onUpdateRiskGroupMember,
    riskIdentifiedBy,
    onRiskIdentifiedByChange,
    workPlace,
    organization,
    content,
    isReadonly = false,
    variant = 'standard'
}) => {

    // Show general info if any of the metadata is provided
    const showGeneralInfo = workPlace || organization || content;

    // Show participants section if risk group handlers are provided
    const showParticipants = riskGroup !== undefined && onAddRiskGroupMember && onRemoveRiskGroupMember && onUpdateRiskGroupMember;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">

            {/* General Info (Optional) */}
            {showGeneralInfo && (
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-4 uppercase text-base tracking-wider border-b pb-2">Общая информация</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-lg">
                        {workPlace && (
                            <div className="flex flex-col">
                                <span className="text-gray-500 font-semibold text-sm uppercase">Место работ</span>
                                <span className="text-gray-900">{workPlace}</span>
                            </div>
                        )}
                        {organization && (
                            <div className="flex flex-col">
                                <span className="text-gray-500 font-semibold text-sm uppercase">Компания</span>
                                <span className="text-gray-900">{organization}</span>
                            </div>
                        )}
                        <div className="flex flex-col">
                            <span className="text-gray-500 font-semibold text-sm uppercase">№ Наряда-допуска</span>
                            <span className="text-gray-400 italic">Черновик (б/н)</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-gray-500 font-semibold text-sm uppercase">Дата</span>
                            <span className="text-gray-900">{new Date().toLocaleDateString('ru-RU')}</span>
                        </div>
                        {content && (
                            <div className="flex flex-col md:col-span-2">
                                <span className="text-gray-500 font-semibold text-sm uppercase">Работа / Задание</span>
                                <span className="text-gray-900">{content}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Participants Section (Optional) */}
            {showParticipants && (
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-6 uppercase text-base tracking-wider border-b pb-2">Участники оценки рисков</h3>

                    {/* Risk Identified By */}
                    {onRiskIdentifiedByChange && (
                        <div className="mb-6">
                            <label className="block text-lg font-semibold text-gray-700 mb-2">Опасности и риски выявил (ФИО, Должность)</label>
                            <input
                                type="text"
                                value={riskIdentifiedBy || ''}
                                onChange={(e) => onRiskIdentifiedByChange(e.target.value)}
                                placeholder="Иванов И.И., Мастер"
                                className={commonInputClasses}
                                disabled={isReadonly}
                            />
                        </div>
                    )}

                    {/* Risk Group Members */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-lg font-semibold text-gray-700">Участники группы выявления опасностей и рисков</label>
                            {!isReadonly && (
                                <button onClick={onAddRiskGroupMember} className="text-blue-600 hover:bg-blue-50 px-3 py-1 rounded text-sm font-medium flex items-center gap-1 transition-colors">
                                    <Plus size={16} /> Добавить участника
                                </button>
                            )}
                        </div>

                        <div className="space-y-3">
                            {riskGroup?.map((member, index) => (
                                <div key={member.id} className="flex gap-3 items-start">
                                    <div className="w-8 pt-3 text-center text-gray-400 font-bold">{index + 1}.</div>
                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <input
                                            type="text"
                                            placeholder="ФИО"
                                            className={commonInputClasses}
                                            value={member.name}
                                            onChange={(e) => onUpdateRiskGroupMember!(member.id, 'name', e.target.value)}
                                            disabled={isReadonly}
                                        />
                                        <input
                                            type="text"
                                            placeholder="Должность"
                                            className={commonInputClasses}
                                            value={member.position}
                                            onChange={(e) => onUpdateRiskGroupMember!(member.id, 'position', e.target.value)}
                                            disabled={isReadonly}
                                        />
                                    </div>
                                    {!isReadonly && (
                                        <button onClick={() => onRemoveRiskGroupMember!(member.id)} className="mt-3 text-gray-300 hover:text-red-500 transition-colors">
                                            <Trash2 size={20} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Risk Table */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-900 uppercase text-base tracking-wider flex items-center gap-2">
                        <AlertTriangle size={24} className="text-orange-500" />
                        Таблица анализа рисков
                    </h3>
                    {!isReadonly && (
                        <button onClick={onAddRiskRow} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm">
                            <Plus size={18} /> Добавить строку
                        </button>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="p-3 font-bold text-gray-600 text-sm uppercase w-[25%]">Последовательность этапов работы</th>
                                <th className="p-3 font-bold text-gray-600 text-sm uppercase w-[25%]">Опасности и риски / Возможные происшествия</th>
                                <th className="p-3 font-bold text-gray-600 text-sm uppercase w-[30%]">Меры контроля</th>
                                <th className="p-3 font-bold text-gray-600 text-sm uppercase w-[15%] text-center">Меры имеются?</th>
                                <th className="p-3 w-[5%]"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {riskTable.map((row) => (
                                <tr key={row.id} className="group hover:bg-gray-50/30">
                                    <td className="p-2 align-top">
                                        <textarea
                                            rows={4}
                                            className={`${commonInputClasses} text-base min-h-[100px]`}
                                            placeholder="Опишите этап..."
                                            value={row.step}
                                            onChange={(e) => onUpdateRiskRow(row.id, 'step', e.target.value)}
                                            disabled={isReadonly}
                                        />
                                    </td>
                                    <td className="p-2 align-top">
                                        <textarea
                                            rows={4}
                                            className={`${commonInputClasses} text-base min-h-[100px]`}
                                            placeholder="Опишите риски..."
                                            value={row.hazards}
                                            onChange={(e) => onUpdateRiskRow(row.id, 'hazards', e.target.value)}
                                            disabled={isReadonly}
                                        />
                                    </td>
                                    <td className="p-2 align-top">
                                        <textarea
                                            rows={4}
                                            className={`${commonInputClasses} text-base min-h-[100px]`}
                                            placeholder="Опишите меры..."
                                            value={row.measures}
                                            onChange={(e) => onUpdateRiskRow(row.id, 'measures', e.target.value)}
                                            disabled={isReadonly}
                                        />
                                    </td>
                                    <td className="p-2 align-top text-center">
                                        <select
                                            className={`${commonInputClasses} text-base text-center`}
                                            value={row.isControlled}
                                            onChange={(e) => onUpdateRiskRow(row.id, 'isControlled', e.target.value)}
                                            disabled={isReadonly}
                                        >
                                            <option value="">-</option>
                                            <option value="Да">Да</option>
                                            <option value="Нет">Нет</option>
                                        </select>
                                    </td>
                                    <td className="p-2 align-middle text-center">
                                        {!isReadonly && (
                                            <button onClick={() => onRemoveRiskRow(row.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                                                <Trash2 size={20} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {riskTable.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-400 italic">
                                        Нажмите "Добавить строку" чтобы начать заполнение таблицы рисков
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
