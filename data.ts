
import { User, UserRole, Academy, Event, EventStatus, FinanceRecord, FinanceStatus } from './types';


export const INITIAL_ACADEMIES: Academy[] = [
  { id: 'a1', name: 'Gracie Barra Centro', address: 'Rua Principal, 123', city: 'São Paulo', state: 'SP', responsible: 'Carlos Gracie', phone: '11999998888', createdAt: new Date().toISOString() },
  { id: 'a2', name: 'Alliance SP', address: 'Av Paulista, 450', city: 'São Paulo', state: 'SP', responsible: 'Fábio Gurgel', phone: '11988887777', createdAt: new Date().toISOString() },
  { id: 'a3', name: 'Checkmat Rio', address: 'Copacabana, 99', city: 'Rio de Janeiro', state: 'RJ', responsible: 'Leo Vieira', phone: '21977776666', createdAt: new Date().toISOString() },
];

export const INITIAL_EVENTS: Event[] = [
  { id: 'e1', name: 'Open SP 2024', city: 'São Paulo', state: 'SP', address: 'Ginásio do Ibirapuera', status: EventStatus.IN_PROGRESS, salespersonId: '2', academiesIds: ['a1', 'a2'], date: '2024-05-15', startDate: '2024-05-15', endDate: '2024-05-17' },
  { id: 'e2', name: 'Rio Fall 2024', city: 'Rio de Janeiro', state: 'RJ', address: 'Arena Carioca 1', status: EventStatus.UPCOMING, salespersonId: '3', academiesIds: ['a3'], date: '2024-10-20', startDate: '2024-10-20', endDate: '2024-10-22' },
];

export const INITIAL_FINANCE: FinanceRecord[] = [
  { id: 'f1', eventId: 'e1', salespersonId: '2', amount: 500.00, status: FinanceStatus.PENDING, updatedAt: new Date().toISOString() },
];


// Helper to generate voucher code: 3 letters + 3 numbers
export const generateVoucherCode = () => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  let code = '';
  for (let i = 0; i < 3; i++) code += letters.charAt(Math.floor(Math.random() * letters.length));
  for (let i = 0; i < 3; i++) code += numbers.charAt(Math.floor(Math.random() * numbers.length));
  return code;
};
