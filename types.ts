
export enum UserRole {
  ADMIN = 'ADMIN',
  SALES = 'SALES'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface AcademyObservation {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: string;
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
  observations?: AcademyObservation[];
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
  salespersonId?: string;
  academiesIds: string[];
  date: string; // Maintain for legacy if needed/sorting
  startDate: string;
  endDate: string;
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

export interface Visit {
  id: string;
  eventId: string;
  academyId: string;
  salespersonId: string;
  status: VisitStatus;
  startedAt?: string;
  finishedAt?: string;
  notes?: string;
  temperature?: AcademyTemperature;
  vouchersGenerated: string[]; // Codes
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
}

export interface SystemLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: string;
}
