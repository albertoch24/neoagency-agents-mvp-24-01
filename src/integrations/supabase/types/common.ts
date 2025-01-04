import { Tables } from './tables';
import { Functions } from './functions';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type DatabaseSchema = {
  public: {
    Tables: Tables;
    Views: {
      [_ in never]: never;
    };
    Functions: Functions;
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};