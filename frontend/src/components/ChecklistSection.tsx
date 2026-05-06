import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp, AlertTriangle, ClipboardCheck, MessageSquare } from 'lucide-react';

// ============================================================
// ДАННЫЕ ЧЕК-ЛИСТА (9 таблиц из Excel)
// ============================================================

export interface ChecklistAnswer {
  answer: 'YES' | 'NO' | 'NA' | '';
  comment: string;
}

export interface ChecklistQuestion {
  number: number;
  question: string;
  questionKk: string;
  hint: string;
  hintKk: string;
}

export interface ChecklistTable {
  id: string;
  title: string;
  titleKk: string;
  subtitle?: string;
  required: boolean;
  questions: ChecklistQuestion[];
}

// Тип данных для хранения в permit.data.checklist
export interface ChecklistData {
  [tableId: string]: {
    [questionNumber: number]: ChecklistAnswer;
  };
}

import { CHECKLIST_TABLES } from '../data/checklistData';
export { CHECKLIST_TABLES } from '../data/checklistData';


// ============================================================
// КОМПОНЕНТ ЧЕК-ЛИСТА (аккордеон)
// ============================================================

/**
 * Проверяет, заполнены ли все 3 обязательных чек-листа (все вопросы имеют ответ).
 * Возвращает { valid: true } или { valid: false, missing: ['название таблицы', ...] }
 */
export function validateRequiredChecklists(checklist: ChecklistData): { valid: boolean; missing: string[] } {
  const missing: string[] = [];
  for (const table of CHECKLIST_TABLES) {
    if (!table.required) continue;
    const answers = checklist[table.id] || {};
    const answeredCount = Object.values(answers).filter((a: any) => a.answer !== '').length;
    if (answeredCount < table.questions.length) {
      missing.push(table.title);
    }
  }
  return { valid: missing.length === 0, missing };
}

interface ChecklistSectionProps {
  checklist: ChecklistData;
  onChange: (data: ChecklistData) => void;
  readOnly?: boolean;
}

const ChecklistSection: React.FC<ChecklistSectionProps> = ({ checklist, onChange, readOnly = false }) => {
  const { t, i18n } = useTranslation();
  const isKk = i18n.language === 'kk';
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());
  const [expandedHints, setExpandedHints] = useState<Set<string>>(new Set());

  const toggleTable = (tableId: string) => {
    setExpandedTables(prev => {
      const next = new Set(prev);
      if (next.has(tableId)) next.delete(tableId);
      else next.add(tableId);
      return next;
    });
  };

  const toggleHint = (key: string) => {
    setExpandedHints(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const updateAnswer = (tableId: string, questionNumber: number, field: 'answer' | 'comment', value: string) => {
    if (readOnly) return;
    const updated = { ...checklist };
    if (!updated[tableId]) updated[tableId] = {};
    if (!updated[tableId][questionNumber]) updated[tableId][questionNumber] = { answer: '', comment: '' };
    (updated[tableId][questionNumber] as any)[field] = value;
    onChange(updated);
  };

  const getTableProgress = (tableId: string): { answered: number; total: number } => {
    const table = CHECKLIST_TABLES.find(t => t.id === tableId);
    if (!table) return { answered: 0, total: 0 };
    const answers = checklist[tableId] || {};
    const answered = Object.values(answers).filter((a: any) => a.answer !== '').length;
    return { answered, total: table.questions.length };
  };

  const getAnswerColor = (answer: string): string => {
    switch (answer) {
      case 'YES': return 'bg-green-100 text-green-800 border-green-300';
      case 'NO': return 'bg-red-100 text-red-800 border-red-300';
      case 'NA': return 'bg-gray-100 text-gray-600 border-gray-300';
      default: return '';
    }
  };

  const getAnswerLabel = (answer: string): string => {
    switch (answer) {
      case 'YES': return isKk ? 'ИӘ' : 'ДА';
      case 'NO': return isKk ? 'ЖОҚ' : 'НЕТ';
      case 'NA': return isKk ? 'Қ/Е' : 'Н/П';
      default: return '—';
    }
  };

  return (
    <div className="space-y-3">
      {CHECKLIST_TABLES.map((table) => {
        const isExpanded = expandedTables.has(table.id);
        const progress = getTableProgress(table.id);
        const isComplete = progress.answered === progress.total && progress.total > 0;

        return (
          <div
            key={table.id}
            className={`rounded-xl border overflow-hidden transition-all duration-200 ${
              table.required
                ? 'border-orange-200 bg-orange-50/30'
                : 'border-gray-200 bg-white'
            }`}
          >
            {/* Header */}
            <button
              onClick={() => toggleTable(table.id)}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                {isComplete ? (
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <ClipboardCheck size={18} className="text-green-600" />
                  </div>
                ) : table.required ? (
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle size={18} className="text-orange-600" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <ClipboardCheck size={18} className="text-gray-400" />
                  </div>
                )}

                <div className="text-left min-w-0">
                  <div className="font-semibold text-gray-900 text-sm md:text-base truncate">
                    {isKk ? table.titleKk : table.title}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {table.required && (
                      <span className="text-[11px] font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {isKk ? 'Міндетті' : 'Обязательно'}
                      </span>
                    )}
                    <span className="text-xs text-gray-500">
                      {progress.answered}/{progress.total} {isKk ? 'сұрақ' : 'вопросов'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                {/* Progress bar */}
                <div className="hidden sm:block w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isComplete ? 'bg-green-500' : progress.answered > 0 ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                    style={{ width: `${progress.total > 0 ? (progress.answered / progress.total) * 100 : 0}%` }}
                  />
                </div>
                {isExpanded ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
              </div>
            </button>

            {/* Content (accordion body) */}
            {isExpanded && (
              <div className="border-t border-gray-200 bg-white">
                <div className="divide-y divide-gray-100">
                  {table.questions.map((q) => {
                    const answer = checklist[table.id]?.[q.number] || { answer: '', comment: '' };
                    const hintKey = `${table.id}-${q.number}`;
                    const isHintExpanded = expandedHints.has(hintKey);

                    return (
                      <div key={q.number} className="px-5 py-4">
                        {/* Question */}
                        <div className="flex items-start gap-3 mb-3">
                          <span className="text-sm font-bold text-gray-400 w-6 text-right flex-shrink-0 pt-0.5">
                            {q.number}.
                          </span>
                          <div className="flex-1">
                            <p className="text-sm md:text-base text-gray-800 leading-relaxed">
                              {isKk ? q.questionKk : q.question}
                            </p>
                            {/* Hint toggle */}
                            <button
                              onClick={() => toggleHint(hintKey)}
                              className="mt-1 text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1"
                            >
                              <MessageSquare size={12} />
                              {isHintExpanded ? (isKk ? 'Кеңесті жасыру' : 'Скрыть подсказку') : (isKk ? 'Кеңесті көрсету' : 'Показать подсказку')}
                            </button>
                            {isHintExpanded && (
                              <div className="mt-2 text-xs text-gray-500 bg-blue-50 rounded-lg p-3 leading-relaxed border border-blue-100">
                                {isKk ? q.hintKk : q.hint}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Answer options */}
                        <div className="ml-9 flex flex-wrap items-center gap-2">
                          {readOnly ? (
                            // Read-only mode - show badge
                            <div className={`px-4 py-1.5 rounded-full text-sm font-medium border ${getAnswerColor(answer.answer)}`}>
                              {getAnswerLabel(answer.answer)}
                            </div>
                          ) : (
                            // Editable mode - radio buttons
                            <>
                              {[
                                { value: 'YES', label: isKk ? 'ИӘ' : 'ДА', color: 'hover:bg-green-50 peer-checked:bg-green-100 peer-checked:border-green-500 peer-checked:text-green-800' },
                                { value: 'NO', label: isKk ? 'ЖОҚ' : 'НЕТ', color: 'hover:bg-red-50 peer-checked:bg-red-100 peer-checked:border-red-500 peer-checked:text-red-800' },
                                { value: 'NA', label: isKk ? 'Қ/Е' : 'Н/П', color: 'hover:bg-gray-100 peer-checked:bg-gray-200 peer-checked:border-gray-500 peer-checked:text-gray-800' },
                              ].map(opt => (
                                <label key={opt.value} className="relative cursor-pointer">
                                  <input
                                    type="radio"
                                    name={`${table.id}-q${q.number}`}
                                    value={opt.value}
                                    checked={answer.answer === opt.value}
                                    onChange={() => updateAnswer(table.id, q.number, 'answer', opt.value)}
                                    className="peer sr-only"
                                  />
                                  <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-medium border border-gray-300 transition-all ${opt.color}`}>
                                    {opt.label}
                                  </span>
                                </label>
                              ))}
                            </>
                          )}

                          {/* Comment */}
                          {readOnly ? (
                            answer.comment && (
                              <span className="text-sm text-gray-500 italic ml-2">
                                {answer.comment}
                              </span>
                            )
                          ) : (
                            <input
                              type="text"
                              placeholder={isKk ? 'Түсініктеме...' : 'Комментарий...'}
                              value={answer.comment}
                              onChange={(e) => updateAnswer(table.id, q.number, 'comment', e.target.value)}
                              className="flex-1 min-w-[200px] text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder-gray-400"
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ChecklistSection;
