import type { ICoordinate, IScan, TProtocol } from '../../common/types/index.ts';

export interface AuditDTO {
    id: string;
    input: {
        protocols: TProtocol[];
        scan: IScan[];
    };
    output: ICoordinate;
    createdAt: Date;
}
