import { summarizeReception } from '../../src/returns/inventory-return.gateway';

describe('HU-07: clasificación de recepción en Inventario', () => {
  it('devuelve pendiente cuando Inventario aún no registra movimientos', () => {
    expect(summarizeReception([])).toEqual({
      status: 'Pendiente de recepción',
      warehouseId: null,
      warehouseName: null,
      quantity: null,
      recordedAt: null,
      movements: [],
    });
  });

  it('devuelve recibida apta cuando existe solo movimiento DEVOLUCION', () => {
    const movements = [{
      operationType: 'DEVOLUCION',
      recordedAt: '2026-11-24T15:00:00.000Z',
      warehouseId: 1,
      warehouseName: 'Bodega Central',
      quantity: 2,
    }];
    expect(summarizeReception(movements)).toEqual({
      status: 'Recibida apta',
      warehouseId: 1,
      warehouseName: 'Bodega Central',
      quantity: 2,
      recordedAt: '2026-11-24T15:00:00.000Z',
      movements,
    });
  });

  it('devuelve recibida con daño cuando existe DEVOLUCION junto a AJUSTE', () => {
    const movements = [
      {
        operationType: 'DEVOLUCION',
        recordedAt: '2026-11-24T15:00:00.000Z',
        warehouseId: 1,
        warehouseName: 'Bodega Central',
        quantity: 1,
      },
      {
        operationType: 'AJUSTE',
        recordedAt: '2026-11-24T15:00:00.000Z',
        warehouseId: 1,
        warehouseName: 'Bodega Central',
        quantity: -1,
      },
    ];
    expect(summarizeReception(movements)).toMatchObject({
      status: 'Recibida con daño',
      warehouseId: 1,
      warehouseName: 'Bodega Central',
      quantity: 1,
      movements,
    });
  });
});
