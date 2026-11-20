export interface IAudit {
    input: any;
    output: any;
    createdAt: Date;
}

export interface IRadar {
    createdAt?: Date;
    updatedAt?: Date;
    protocols: TProtocol[];
    scan: IScan[];
}
export interface IScan {
    coordinates: ICoordinate;
    enemies: IEnemies;
    allies?: number;
}
export interface ICoordinate {
    x: number;
    y: number;
}
export interface IEnemies {
    type: string;
    number: number;
}
export type TProtocol =
    'closest-enemies' | 'furthest-enemies' | 'assist-allies' | 'avoid-crossfire' | 'prioritize-mech' | 'avoid-mech';
