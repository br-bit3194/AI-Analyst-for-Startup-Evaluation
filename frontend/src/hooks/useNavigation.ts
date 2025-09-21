import { useRouter as useNextRouter } from 'next/router';

interface UseNavigationReturn {
  navigate: (path: string) => Promise<boolean>;
}

export const useNavigation = (): UseNavigationReturn => {
  const router = useNextRouter();
  
  const navigate = async (path: string): Promise<boolean> => {
    try {
      await router.push(path);
      return true;
    } catch (err) {
      console.error('Navigation error:', err);
      return false;
    }
  };
  
  return { navigate };
};
