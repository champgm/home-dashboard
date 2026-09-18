import type { SafeLogger } from '../ports/contracts';
import type { EventTransport, ObservationTarget, CharacteristicEvent } from '../core/events/observation';
import { parseCharacteristicReadResponse } from '../core/accessories/enumeration';
import { HapHttpSession, type HapEvent } from './httpSession';

/** Maps HAP's protected event stream to the observation port. */
export class HapSessionEventTransport implements EventTransport {
  private readonly listeners = new Set<(event: CharacteristicEvent) => void>();
  private subscribedTargets: readonly ObservationTarget[] = [];

  constructor(private readonly session: HapHttpSession, private readonly logger?: SafeLogger) {
    session.setEventListener((event) => this.accept(event));
  }

  async subscribe(targets: readonly ObservationTarget[]): Promise<void> {
    const body = encodeSubscription(targets, true);
    const response = await this.session.request('PUT', '/characteristics', body, 'application/hap+json');
    assertSubscriptionResponse(response.statusCode, response.body);
    this.subscribedTargets = [...targets];
  }

  async unsubscribe(targets: readonly ObservationTarget[]): Promise<void> {
    if (targets.length === 0) return;
    const body = encodeSubscription(targets, false);
    const response = await this.session.request('PUT', '/characteristics', body, 'application/hap+json');
    assertSubscriptionResponse(response.statusCode, response.body);
    this.subscribedTargets = [];
  }

  onEvent(listener: (event: CharacteristicEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private accept(event: HapEvent): void {
    try {
      const parsed = parseCharacteristicReadResponse(JSON.parse(new TextDecoder().decode(event.body)));
      parsed.characteristics.forEach((characteristic) => {
        if (!this.subscribedTargets.some((target) => target.aid === characteristic.aid && target.iid === characteristic.iid)) return;
        const value = characteristic.value;
        if (value === undefined) return;
        const observation: CharacteristicEvent = {
          aid: characteristic.aid,
          iid: characteristic.iid,
          value,
          generation: this.session.generation
        };
        this.listeners.forEach((listener) => listener(observation));
      });
    } catch {
      this.logger?.error('observation.event-rejected', { operation: 'event-subscription', result: 'failure', errorCategory: 'malformed-event' });
    }
  }
}

function encodeSubscription(targets: readonly ObservationTarget[], enabled: boolean): Uint8Array {
  return new TextEncoder().encode(JSON.stringify({
    characteristics: targets.map((target) => ({ aid: target.aid, iid: target.iid, ev: enabled }))
  }));
}

function assertSubscriptionResponse(statusCode: number, body: Uint8Array): void {
  if (statusCode === 204 || statusCode === 200) return;
  if (statusCode !== 207) throw new Error(`event subscription rejected with status ${statusCode}`);
  const parsed = parseCharacteristicReadResponse(JSON.parse(new TextDecoder().decode(body)));
  if (parsed.characteristics.some((characteristic) => characteristic.status !== undefined && characteristic.status !== 0)) {
    throw new Error('event subscription was rejected for at least one characteristic');
  }
}
