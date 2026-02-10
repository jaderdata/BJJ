
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



export interface Academy {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  responsible: string;
  phone: string;
  createdAt: string;
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
  photoUrl?: string;
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
