import type { IScan, TProtocol } from './types/index.ts';
//Center posotion in a radar is 0,0
export const origin = { x: 0, y: 0 };

export const protocolFilters: Record<string, (scans: IScan[]) => IScan[]> = {
    'closest-enemies': scans => [...scans].sort((a, b) => getDistance(a.coordinates) - getDistance(b.coordinates)),

    'furthest-enemies': scans => [...scans].sort((a, b) => getDistance(b.coordinates) - getDistance(a.coordinates)),

    'assist-allies': scans => {
        const withAllies = scans.filter(scan => (scan.allies ?? 0) > 0);
        return withAllies.length > 0 ? withAllies : scans;
    },

    'avoid-crossfire': scans => scans.filter(scan => !scan.allies || scan.allies === 0),

    'prioritize-mech': scans => {
        const mechs = scans.filter(scan => scan.enemies.type === 'mech');
        return mechs.length > 0 ? mechs : scans;
    },

    'avoid-mech': scans => scans.filter(scan => scan.enemies.type !== 'mech'),
};

export const proccessProtocol = (protocols: TProtocol[], scans: IScan[]) => {
    if (!scans && !protocols) return;

    const filteredScans: IScan[] = applyContraints(scans, protocols);

    let response: IScan[] = filteredScans;

    for (let i = 0; i < protocols.length; i++) {
        const protocol = protocols[i];
        if (!protocol) continue;
        const filterFunction = protocolFilters[protocol];
        if (filterFunction) {
            response = filterFunction(response);
        }
    }

    const target = response[0];
    if (!target) return;

    return {
        x: target.coordinates.x,
        y: target.coordinates.y,
    };
};

export const getDistance = (a: any): number => Math.hypot(a.x, a.y);
export const applyContraints = (coordinates: IScan[], protocol: string[]): IScan[] => {
    const filteredCoordinates = [...coordinates].filter((el: IScan) => {
        const calc = el.enemies.number > 0 && getDistance(el.coordinates) <= 100;
        return calc;
    });

    return filteredCoordinates;
};
/* 
closest-enemies : Se deberá priorizar el punto más cercano en el que haya
enemigos.
● furthest-enemies : Se deberá priorizar el punto más lejano en el que haya
enemigos.


● assist-allies : Deberán priorizarse los puntos en los que exista algún aliado.
● avoid-crossfire : No debe atacarse ningún punto en el que haya algún aliado.
● prioritize-mech : Debe atacarse un mech si se encuentra. En caso negativo,
cualquier otro tipo de objetivo será válido.
● avoid-mech : No debe de atacarse ningún enemigo del tipo mech
*/

/* 
Two types of protocols

1.Sorting protocols => order the array without removing elements
    closest-enemies => Distance 
    furthest-enemies => Distance 
    prioritize-mech => Type
    assist-allies => Type

2.Filtering protocols => Filter out elements 
    avoid-crossfire
    avoid-mech


*/
