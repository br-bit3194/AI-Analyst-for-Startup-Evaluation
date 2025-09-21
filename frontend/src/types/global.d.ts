// This file helps TypeScript understand our module paths
declare module '@/hooks/useNavigation' {
  import { NextRouter } from 'next/router';
  
  export const useNavigation: () => {
    navigate: (path: string) => void;
  };
}
