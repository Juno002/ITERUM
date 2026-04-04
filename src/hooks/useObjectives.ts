import { useObjectiveStore } from '../store/useObjectiveStore';

export function useObjectives() {
  const {
    objectives,
    addObjective,
    updateObjective,
    deleteObjective,
    setObjectives,
    loadObjectives,
  } = useObjectiveStore();
  return {
    objectives,
    addObjective,
    updateObjective,
    deleteObjective,
    setObjectives,
    loadObjectives,
  };
}
