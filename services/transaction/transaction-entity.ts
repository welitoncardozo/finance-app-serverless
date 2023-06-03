import { TransactionType } from './transaction-type';

export default interface TransactionEntity {
  id?: string;
  userId: string;
  value: number;
  type: TransactionType;
}