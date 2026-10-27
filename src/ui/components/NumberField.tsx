import { TextField, type TextFieldProps } from './TextField'

/** Textfält för tal. Värdet är text så att både decimalkomma och decimalpunkt fungerar. */
export function NumberField(props: Omit<TextFieldProps, 'inputMode'>) {
  return <TextField {...props} inputMode="decimal" />
}
