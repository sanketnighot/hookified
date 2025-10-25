"use client";

import { FormSchema } from "@/lib/plugins/types";
import { DynamicField } from "./DynamicField";

interface DynamicFormProps {
  schema: FormSchema;
  values: any;
  onChange: (values: any) => void;
  errors?: string[];
}

export function DynamicForm({ schema, values, onChange, errors = [] }: DynamicFormProps) {
  const handleFieldChange = (fieldName: string, value: any) => {
    onChange({
      ...values,
      [fieldName]: value,
    });
  };

  const getFieldError = (fieldName: string): string | undefined => {
    return errors.find(error => error.toLowerCase().includes(fieldName.toLowerCase()));
  };

  if (schema.fields.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p>No configuration required.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {schema.fields.map((field) => (
        <DynamicField
          key={field.name}
          field={field}
          value={values?.[field.name]}
          onChange={(value) => handleFieldChange(field.name, value)}
          error={getFieldError(field.name)}
        />
      ))}
    </div>
  );
}
