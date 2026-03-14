import { validate, ValidationError } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { AddWordDto } from './add-word.dto';

const validCoord = { pageIndex: 0, left: 10, top: 20, width: 30, height: 5 };

function make(overrides: object = {}): AddWordDto {
  return plainToInstance(AddWordDto, {
    roomId: 'room-abc',
    term: 'photosynthesis',
    page: 0,
    coords: [validCoord],
    ...overrides,
  });
}

// Recursively collects all constraint messages, including from ValidateNested children
function collectErrors(errs: ValidationError[]): string[] {
  return errs.flatMap((e) => [
    ...Object.values(e.constraints ?? {}),
    ...collectErrors(e.children ?? []),
  ]);
}

async function errors(dto: AddWordDto) {
  return collectErrors(await validate(dto));
}

describe('AddWordDto', () => {
  it('passes validation with a valid payload', async () => {
    expect(await errors(make())).toHaveLength(0);
  });

  it('fails when roomId is missing', async () => {
    const e = await errors(make({ roomId: undefined }));
    expect(e.length).toBeGreaterThan(0);
  });

  it('fails when term is missing', async () => {
    const e = await errors(make({ term: undefined }));
    expect(e.length).toBeGreaterThan(0);
  });

  it('fails when term exceeds 100 characters', async () => {
    const e = await errors(make({ term: 'a'.repeat(101) }));
    expect(e.length).toBeGreaterThan(0);
  });

  it('passes when term is exactly 100 characters', async () => {
    expect(await errors(make({ term: 'a'.repeat(100) }))).toHaveLength(0);
  });

  it('fails when page is missing', async () => {
    const e = await errors(make({ page: undefined }));
    expect(e.length).toBeGreaterThan(0);
  });

  it('fails when coords array is empty', async () => {
    const e = await errors(make({ coords: [] }));
    expect(e.length).toBeGreaterThan(0);
  });

  it('fails when coords is missing', async () => {
    const e = await errors(make({ coords: undefined }));
    expect(e.length).toBeGreaterThan(0);
  });

  it('fails when a coord has a negative left value', async () => {
    const e = await errors(make({ coords: [{ ...validCoord, left: -0.1 }] }));
    expect(e.length).toBeGreaterThan(0);
  });

  it('fails when a coord has a negative top value', async () => {
    const e = await errors(make({ coords: [{ ...validCoord, top: -10 }] }));
    expect(e.length).toBeGreaterThan(0);
  });

  it('fails when a coord has width over 100', async () => {
    const e = await errors(make({ coords: [{ ...validCoord, width: 101 }] }));
    expect(e.length).toBeGreaterThan(0);
  });

  it('fails when a coord has height over 100', async () => {
    const e = await errors(make({ coords: [{ ...validCoord, height: 200 }] }));
    expect(e.length).toBeGreaterThan(0);
  });
});
