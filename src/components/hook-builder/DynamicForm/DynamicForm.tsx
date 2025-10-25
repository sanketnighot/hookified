"use client";

import { FormSchema } from "@/lib/plugins/types";
import { DynamicField } from "./DynamicField";

interface DynamicFormProps {
  schema: FormSchema;
  values: any;
  onChange: (values: any) => void;
  errors?: string[];
  actionType?: string;
}

export function DynamicForm({
  schema,
  values,
  onChange,
  errors = [],
  actionType,
}: DynamicFormProps) {
  const handleFieldChange = (fieldName: string, value: any) => {
    // Special handling for cronExpression field - it returns an object with both cronExpression and timezone
    if (fieldName === 'cronExpression' && typeof value === 'object' && value.cronExpression !== undefined) {
      onChange({
        ...values,
        cronExpression: value.cronExpression,
        timezone: value.timezone,
      });
    } else {
      onChange({
        ...values,
        [fieldName]: value,
      });
    }
  };

  const getFieldError = (fieldName: string): string | undefined => {
    return errors.find((error) =>
      error.toLowerCase().includes(fieldName.toLowerCase())
    );
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
          actionType={actionType}
        />
      ))}
    </div>
  );
}
