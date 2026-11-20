import { TProtocol } from '../../common/types/index.ts';

export interface CreateRadarDTO {
    protocols: TProtocol[];
    scan: {
        coordinates: {
            x: number;
            y: number;
        };
        enemies: {
            type: string;
            number: number;
        };
    }[];
}
