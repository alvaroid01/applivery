import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { proccessProtocol } from '../src/common/protocols.ts';
import type { IScan } from '../src/common/types/index.ts';

const soldier = (x: number, y: number, allies?: number): IScan => ({
    coordinates: { x, y },
    enemies: { type: 'soldier', number: 10 },
    ...(allies === undefined ? {} : { allies }),
});

const mech = (x: number, y: number): IScan => ({
    coordinates: { x, y },
    enemies: { type: 'mech', number: 1 },
});

describe('assist-allies', () => {
    it('keeps only points with allies when there is at least one', () => {
        const result = proccessProtocol(
            ['assist-allies'],
            [soldier(0, 40), soldier(5, 35, 3)],
        );

        assert.deepEqual(result, { x: 5, y: 35 });
    });

    it('keeps the original list when no point has allies', () => {
        const result = proccessProtocol(['assist-allies'], [soldier(0, 40), soldier(0, 10)]);

        assert.deepEqual(result, { x: 0, y: 40 });
    });
});

describe('empty candidate list', () => {
    it('returns no target when a filter removes every point', () => {
        const result = proccessProtocol(['avoid-mech'], [mech(0, 40), mech(10, 10)]);

        assert.equal(result, undefined);
    });

    it('returns no target when every point is out of range', () => {
        const result = proccessProtocol(['closest-enemies'], [soldier(0, 140)]);

        assert.equal(result, undefined);
    });
});
