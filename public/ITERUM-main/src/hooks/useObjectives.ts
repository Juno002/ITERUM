import { useState, useEffect } from 'react';
import { Objective } from '../types';

export function useObjectives() {
  const [objectives, setObjectives] = useState<Objective[]>(() => {
    const saved = localStorage.getItem('iterum_objectives');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((o: any) => ({
          ...o,
          createdAt: new Date(o.createdAt),
          deadline: o.deadline ? new Date(o.deadline) : undefined,
        }));
      } catch (e) {
        console.error('Failed to parse objectives', e);
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('iterum_objectives', JSON.stringify(objectives));
  }, [objectives]);

  const addObjective = (objectiveData: Omit<Objective, 'id' | 'isActive' | 'createdAt'>) => {
    const newObjective: Objective = {
      ...objectiveData,
      id: crypto.randomUUID(),
      isActive: true,
      createdAt: new Date(),
    };
    setObjectives((prev) => [...prev, newObjective]);
  };

  const updateObjective = (id: string, updates: Partial<Objective>) => {
    setObjectives((prev) =>
      prev.map((o) => (o.id === id ? { ...o, ...updates } : o))
    );
  };

  const deleteObjective = (id: string) => {
    setObjectives((prev) => prev.filter((o) => o.id !== id));
  };

  return { objectives, addObjective, updateObjective, deleteObjective, setObjectives };
}
