
export enum UserRole {
  ADMIN = 'ADMIN',
  SALES = 'SALES',
  CALL_CENTER = 'CALL_CENTER'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  city?: string;
  uf?: string;
  photoUrl?: string;
}



export interface Academy {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  responsible: string;
  phone: string;
  createdAt: string;
  createdBy?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export enum EventStatus {
  UPCOMING = 'A acontecer',
  IN_PROGRESS = 'Em andamento',
  CANCELLED = 'Cancelado',
  COMPLETED = 'Concluído'
}

export interface Event {
  id: string;
  name: string;
  city: string;
  state: string;
  address: string;
  status: EventStatus;
  salespersonIds?: string[];
  academiesIds: string[];
  date: string; // Maintain for legacy if needed/sorting
  startDate: string;
  endDate: string;
  photoUrl?: string;
  isTest?: boolean;
}

export enum VisitStatus {
  PENDING = 'Pendente',
  VISITED = 'Visitada'
}

export enum AcademyTemperature {
  COLD = 'Frio',
  WARM = 'Morno',
  HOT = 'Quente'
}

export enum ContactPerson {
  OWNER = 'Dono',
  TEACHER = 'Professor',
  STAFF = 'Funcionário',
  NOBODY = 'Ninguém disponível'
}


export interface Visit {
  id: string;
  eventId: string;
  academyId: string;
  salespersonId: string;
  status: VisitStatus;
  startedAt?: string;
  finishedAt?: string;
  notes?: string;
  summary?: string;
  temperature?: AcademyTemperature;
  contactPerson?: ContactPerson;
  vouchersGenerated: string[]; // Codes
  photos?: string[];
  leftBanner?: boolean;
  leftFlyers?: boolean;
  updatedAt?: string;
}

export interface Voucher {
  code: string;
  eventId: string;
  academyId: string;
  visitId: string;
  createdAt: string;
}

export enum FinanceStatus {
  PENDING = 'Pendente',
  PAID = 'Pago',
  RECEIVED = 'Recebido'
}

export interface FinanceRecord {
  id: string;
  eventId: string;
  salespersonId: string;
  amount: number;
  status: FinanceStatus;
  updatedAt: string;
  createdAt?: string;
  observation?: string;
}


export interface SystemSetting {
  key: string;
  value: any;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  read: boolean;
  timestamp: string;
}

export interface VendorDetails {
  userId: string;
  admissionDate?: string;
  pixKey?: string;
  bankName?: string;
  bankAgency?: string;
  bankAccount?: string;
  notes?: string;
  updatedAt?: string;
}

export enum FollowUpStatus {
  WAITING = 'AGUARDANDO',
  HIGH = 'INTERESSE_ALTO',
  MEDIUM = 'INTERESSE_MEDIO',
  LOW = 'INTERESSE_BAIXO',
  NO_INTEREST = 'SEM_INTERESSE',
  CLOSED = 'FECHADO'
}

export enum ContactChannel {
  CALL = 'CALL',
  WHATSAPP = 'WHATSAPP',
  PRESENCIAL = 'PRESENCIAL'
}

export interface FollowUp {
  id: string;
  academyId: string;
  visitId?: string;
  createdBy: string;
  status: FollowUpStatus;
  notes?: string;
  nextContactAt?: string;
  contactPerson?: string;
  contactChannel: ContactChannel;
  createdAt: string;
  updatedAt: string;
}

export type FollowUpLogAction = 'CRIADO' | 'STATUS_ALTERADO' | 'ATUALIZADO';

export interface FollowUpLog {
  id: string;
  followUpId: string;
  userId: string;
  userName: string;
  action: FollowUpLogAction;
  fromStatus?: FollowUpStatus;
  toStatus?: FollowUpStatus;
  note?: string;
  createdAt: string;
}
