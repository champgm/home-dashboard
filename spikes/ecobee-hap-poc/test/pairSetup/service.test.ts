import { PairSetupService } from '../../src/hap/core/pairSetup/pairSetupService';

describe('Pair Setup service preflight', () => {
  it('sends no Pair Setup message and closes transport for a locally rejected setup code', async () => {
    const transport = {
      post: jest.fn(),
      close: jest.fn(async () => undefined)
    };
    const service = new PairSetupService(
      () => { throw new Error('protocol must not be created'); },
      {} as never
    );

    const result = await service.run(transport, {
      advertisedPairing: 'available',
      existingAssociation: 'none-known',
      removalApproved: false,
      restorationProcedureRecorded: false
    }, '24680135', true);

    expect(result).toEqual({ ok: false, error: expect.objectContaining({ code: 'invalid_input', category: 'setup-code-rejected', possibleSend: false }) });
    expect(transport.post).not.toHaveBeenCalled();
    expect(transport.close).toHaveBeenCalledTimes(1);
  });
});
