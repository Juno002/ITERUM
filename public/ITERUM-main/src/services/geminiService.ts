import { GoogleGenAI, Type } from '@google/genai';
import { Task } from '../types';

export async function suggestTasks(prompt: string): Promise<Omit<Task, 'id' | 'completed'>[]> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('No API key found for Gemini Service');
      return [];
    }
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Actúa como el Asistente Contextual de Iterum, un ecosistema de productividad minimalista y profesional.
El usuario te pide: "${prompt}". 
Genera una lista de sugerencias que pueden ser Tareas, Hábitos, Objetivos o Notas (Journal).
Iterum se enfoca en un flujo cerrado: las acciones deben ser concretas y realistas.
Las fechas deben ser a partir de hoy (${new Date().toISOString()}) o en el futuro cercano.
Devuelve un JSON con un array de objetos, cada uno con:
- title: string (título corto y claro)
- description: string (descripción breve)
- date: string (fecha y hora en formato ISO 8601)
- color: string (un color hexadecimal de esta lista: [#C9935A, #A0522D, #ef4444, #22c55e, #3b82f6, #a855f7])
- type: string (uno de: 'task', 'habit', 'objective', 'journal')`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              date: { type: Type.STRING },
              color: { type: Type.STRING },
              type: { type: Type.STRING },
            },
            required: ['title', 'description', 'date', 'color', 'type'],
          },
        },
      },
    });

    const text = response.text;
    if (!text) return [];

    const data = JSON.parse(text);
    return data.map((item: any) => ({
      title: item.title,
      description: item.description,
      date: new Date(item.date),
      color: item.color,
      type: item.type,
    }));
  } catch (error: any) {
    // Fallback for network/adblocker errors
    const errorStr = String(error?.message || error);
    if (errorStr.includes('xhr error') || errorStr.includes('fetch')) {
      console.warn('Gemini Service network error (fallback applied):', errorStr);
      return [
        {
          title: "Revisar objetivos",
          description: "Sugerencia automática por error de conexión.",
          date: new Date(),
          color: "#C9935A",
          type: "task" as any
        }
      ];
    } else {
      console.error('Error generating tasks:', error);
    }
    return [];
  }
}
