import type { Database } from '../database.types';

export type Tables = Database['public']['Tables'];
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type DatabaseSchema = Database;