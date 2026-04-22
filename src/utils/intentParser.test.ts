import { describe, expect, it } from 'vitest';
import { parseIntent } from './intentParser';

describe('parseIntent', () => {
  it('parses quick habit capture', () => {
    expect(parseIntent('* Meditar')).toEqual({
      type: 'habit',
      cleanText: 'Meditar',
    });
  });

  it('parses objective aliases', () => {
    expect(parseIntent('Meta: correr 10k')).toEqual({
      type: 'goal',
      cleanText: 'correr 10k',
    });
    expect(parseIntent('objetivo: leer 12 libros')).toEqual({
      type: 'goal',
      cleanText: 'leer 12 libros',
    });
  });

  it('parses journal capture and task fallback', () => {
    expect(parseIntent('> Hoy estuvo pesado')).toEqual({
      type: 'journal',
      cleanText: 'Hoy estuvo pesado',
    });
    expect(parseIntent('Comprar café')).toEqual({
      type: 'task',
      cleanText: 'Comprar café',
    });
  });
});
