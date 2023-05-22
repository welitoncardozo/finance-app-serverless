import {UUID} from 'crypto';

export default class UserEntity {
  id?: UUID;
  name: string;
  cpf?: number;
}