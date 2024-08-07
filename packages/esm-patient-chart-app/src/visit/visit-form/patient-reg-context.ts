import { createContext } from 'react';

export interface PatientRegistrationContextProps {
  currentPhoto: string;
  identifierTypes: Array<any>;
  inEditMode: boolean;
  isOffline: boolean;
  setFieldValue(field: string, value: any, shouldValidate?: boolean): void;
  validationSchema: any;
}

export const PatientRegistrationContexts = createContext<PatientRegistrationContextProps | undefined>(undefined);
