export const WS_ERRORS = {
  ROOM_NOT_FOUND: { code: 'ROOM_NOT_FOUND', message: 'Sala no encontrada' },
  ROOM_FULL: {
    code: 'ROOM_FULL',
    message: 'La sala alcanzó el límite de usuarios',
  },
  HIGHLIGHT_ERROR: {
    code: 'HIGHLIGHT_ERROR',
    message: 'Error al crear el subrayado',
  },
  ADD_WORD_ERROR: {
    code: 'ADD_WORD_ERROR',
    message: 'Error al agregar palabra al glosario',
  },
  RATE_LIMIT_EXCEEDED: {
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Has superado el límite de requests permitidos',
  },
  INTERNAL_ERROR: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
};
