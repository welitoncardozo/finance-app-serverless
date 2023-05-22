import { TransactionType } from './transaction-type';

export default class TransactionEntity {
  id?: string;
  userId: string;
  value: number;
  type: TransactionType;
}