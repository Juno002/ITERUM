import { useObjectiveStore } from '../store/useObjectiveStore';

export function useObjectives() {
  const {
    objectives,
    addObjective,
    updateObjective,
    deleteObjective,
    setObjectives,
  } = useObjectiveStore();
  return {
    objectives,
    addObjective,
    updateObjective,
    deleteObjective,
    setObjectives,
  };
}
