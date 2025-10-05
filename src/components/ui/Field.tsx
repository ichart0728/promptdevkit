import { ReactNode } from "react";

type FieldProps = {
  label: string;
  htmlFor?: string;
  description?: ReactNode;
  error?: string | null;
  children: ReactNode;
};

export function Field({ label, htmlFor, description, error, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={htmlFor} className="text-sm font-medium text-gray-900">
        {label}
      </label>
      {children}
      {description ? <p className="text-xs text-gray-500">{description}</p> : null}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
