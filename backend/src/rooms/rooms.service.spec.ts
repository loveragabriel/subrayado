import { Test, TestingModule } from '@nestjs/testing';
import { RoomsService, generatePin } from './rooms.service';
import { PrismaService } from 'src/prisma/prisma.service';

describe('RoomsService', () => {
  let service: RoomsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RoomsService, { provide: PrismaService, useValue: {} }],
    }).compile();

    service = module.get<RoomsService>(RoomsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

describe('generatePin', () => {
  it('produces a PIN that is exactly 8 characters long', () => {
    const pin = generatePin();
    expect(pin).toHaveLength(8);
  });

  it('produces a PIN containing only uppercase alphanumeric characters (A-Z, 0-9)', () => {
    const pin = generatePin();
    expect(pin).toMatch(/^[A-Z0-9]{8}$/);
  });

  it('produces different PINs on consecutive calls (randomness check)', () => {
    const pin1 = generatePin();
    const pin2 = generatePin();
    expect(pin1).not.toBe(pin2);
  });

  it('all characters come from the allowed alphabet across many samples', () => {
    const allowed = /^[A-Z0-9]+$/;
    for (let i = 0; i < 200; i++) {
      expect(generatePin()).toMatch(allowed);
    }
  });
});
