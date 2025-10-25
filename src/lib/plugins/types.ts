// Plugin system base types and interfaces

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export type FieldType = 'text' | 'textarea' | 'number' | 'select' | 'checkbox' | 'password';

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface FieldValidation {
  required?: boolean;
  pattern?: string;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
}

export interface FormField {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  description?: string;
  required?: boolean;
  validation?: FieldValidation;
  options?: SelectOption[]; // For select fields
  default?: any;
}

export interface FormSchema {
  fields: FormField[];
}

export interface PluginMetadata {
  type: string;
  name: string;
  description: string;
  icon?: string;
}

export interface TriggerDefinition<TConfig = any> {
  type: string;
  name: string;
  description: string;
  icon: string;
  validateConfig(config: TConfig): ValidationResult;
  getConfigSchema(): FormSchema;
}

export interface ActionDefinition<TConfig = any> {
  type: string;
  name: string;
  description: string;
  icon: string;
  validateConfig(config: TConfig): ValidationResult;
  getConfigSchema(): FormSchema;
}
