import { useUserStore } from '../store/useUserStore';

interface UseGamificationProps {
  onLevelUp?: (level: number) => void;
}

export function useGamification({ onLevelUp }: UseGamificationProps = {}) {
  const { stats, addExp, completeOnboarding, setStats } = useUserStore();

  const handleAddExp = (amount: number, type: 'discipline' | 'consistency') => {
    addExp(amount, type, onLevelUp);
  };

  return { stats, addExp: handleAddExp, completeOnboarding, setStats };
}
