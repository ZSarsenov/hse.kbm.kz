
export type Permission = 'CREATE_PERMIT' | 'VIEW_LOTO_LOGS' | 'APPROVE_PERMIT' | 'ADMIN_ACCESS';

export enum PermitStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  ACTIVE = 'ACTIVE', // Work in progress
  REJECTED = 'REJECTED',
  CLOSED = 'CLOSED',
}

export enum PermitCategory {
  DANGEROUS = 'DANGEROUS',
  ELECTRICAL = 'ELECTRICAL',
}

export enum UserRole {
  ADMIN = 'ADMIN',
  ISSUER = 'ISSUER', // Выдающий наряд
  WORK_MANAGER = 'WORK_MANAGER', // Руководитель работ
  ADMITTING_AUTHORITY = 'ADMITTING_AUTHORITY', // Допускающий
  WORK_PRODUCER = 'WORK_PRODUCER', // Производитель работ
  OBSERVER = 'OBSERVER', // Наблюдающий
  WORKER = 'WORKER', // Член бригады
  RESPONSIBLE_MANAGER = 'RESPONSIBLE_MANAGER', // Ответственный руководитель
  SHIFT_SUPERVISOR = 'SHIFT_SUPERVISOR', // Начальник смены
}

export interface Location {
  name: string;
  latitude: number;
  longitude: number;
}

// --- PART 1: ELECTRICAL CREATION DATA ---

export interface ElectricalSafetyMeasure {
  id: string;
  installationName: string; // Наименование электроустановок
  actionRequired: string; // Что должно быть отключено и где заземлено
}

export interface ElectricalFormData {
  organization: string;
  department: string;
  workManagerId: string; // Руководитель работ
  admittingAuthorityId: string; // Допускающий
  workProducerId: string; // Производитель работ
  observerId?: string; // Наблюдающий (опционально)
  brigadeMembers: string[]; // Члены бригады
  workCategory: string; // Категория работ
  assignment: string; // Поручается
  startDate: string;
  endDate: string;
  emergencyReadinessTime: string; // Время аварийной готовности
  safetyMeasures: ElectricalSafetyMeasure[];
  separateInstructions?: string; // Отдельные указания
  issuerId: string; // Наряд выдал
  issuerIdDate?: string;
  issuerDate: string;
  voltageRemainsAt?: string; // Кернеу бар жері / Под напряжением остались
}

// --- PART 2: ELECTRICAL LIFECYCLE DATA (The "Backside") ---

export interface DailyAdmission {
  id: string;
  workPlace: string;
  admissionDateTime: string;
  admittingSignature: string; // Signature of the Admitting Authority
  producerSignature: string; // Signature of the Work Producer
  finishDateTime: string;
  producerFinishSignature: string;
}

export interface BrigadeChange {
  id: string;
  introducedMember: string;
  removedMember: string;
  dateTime: string;
  authorizedBy: string;
}

export interface TargetBriefingLog {
  id: string;
  personRole: string; // Role label (Issuer, Manager, Admitting, Producer, Members)
  personName: string;
  signature: string;
  timestamp: string;
}

export interface ElectricalLifecycle {
  dailyAdmissions: DailyAdmission[];
  brigadeChanges: BrigadeChange[];
  briefingLogs: TargetBriefingLog[];
  completionDateTime?: string;
  notifiedTo?: string; // Кому сообщено об окончании
}

// --- PART 3: DANGEROUS WORK (Order 344) & LOTO ---

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  instructedAt: string;
  instructedBy: string;
}

export interface PermitExtension {
  id: string;
  dateTime: string;
  producerHandOverName: string;
  incomingTeamCount: number;
  producerTakeOverName: string;
  admittingName: string;
}

export interface RiskGroupMember {
  id: string;
  name: string;
  position: string;
}

export interface RiskTableRow {
  id: string;
  step: string;
  hazards: string;
  measures: string;
  isControlled: string;
}

export interface IsolationMatrix {
  department: string;
  site: string;
  dateDeveloped: string;
  dateRevised: string;
  equipmentName: string;
  techNumber: string;
  energySourceCount: number;
  energyType: string;
  lockType: string;
  installLocation: string;
  checkResidualEnergy: boolean;
  checkLockDevice: boolean;
  checkPadlock: boolean;
  checkTag: boolean;
  photo?: any;
}

export interface RegulationFormData {
  organization: string;
  contractor?: string;
  department: string;
  workName: string;
  workPlace: string;
  equipment: string;
  content: string;
  m5_1_stop: string;
  m5_2_disconnect: string;
  m5_3_install: string;
  m5_4_analysis: string;
  m5_5_fence: string;
  m5_6_height: string;
  m5_7_warn: string;
  m5_8_railway: string;
  m5_9_routes: string;
  m5_10_additional: string;
  riskIdentifiedBy: string;
  riskGroup: RiskGroupMember[];
  riskTable: RiskTableRow[];
  riskApprovedBy: string;
  lotoEnabled: boolean;
  isolationMatrix: IsolationMatrix;
  dateStart: string;
  dateEnd: string;
  extensions: PermitExtension[];
  completionDateTime: string;
  completionHandOverName: string;
  completionTakeOverName: string;
}

export enum LotoStatus {
  LOCKED = 'LOCKED',
  UNLOCKED = 'UNLOCKED',
  PARTIAL = 'PARTIAL',
}

export interface LOTOReport {
  id: string;
  permitId: string;
  equipmentTag: string;
  isolationPoint: string;
  status: LotoStatus;
  lockedBy: string;
  lockedAt: string;
  unlockedBy?: string;
  unlockedAt?: string;
  signatureStatus: 'VALID' | 'PENDING';
  matrixData: IsolationMatrix;
}

export interface WorkPermit {
  id: string | number;
  permitId: string;
  location: Partial<Location> & { name: string };
  createdAt: string;
  status: PermitStatus | string;
  category?: PermitCategory;
  templateType: string;
  initiator: {
    id?: string | number;
    name: string;
    position?: string;
    iin?: string;
    bin?: string;
  };
  dangerousWorks?: Array<{ id: string; name: string }>;
  teamMembers?: TeamMember[];
  approvalSteps?: any[];
  formData?: any;
  data?: any;
  validFrom?: string;
  validTo?: string;
  lifecycle?: Partial<ElectricalLifecycle>;
}

export type PageView = 'DASHBOARD' | 'CREATE' | 'MY_TASKS' | 'LOTO_REPORTS' | 'LOGIN' | 'ARCHIVE' | 'DETAIL';

export const ELECTRICAL_WORK_CATEGORIES = [
  "Со снятием напряжения",
  "Без снятия напряжения на токоведущих частях и вблизи них",
  "Без снятия напряжения вдали от токоведущих частей, находящихся под напряжением"
];

export const WORK_TYPES_LIST = [
  "Земляные работы",
  "Работы на высоте",
  "Огневые работы",
  "Газоопасные работы",
  "Работы в замкнутом пространстве",
  "Грузоподъемные работы"
];
