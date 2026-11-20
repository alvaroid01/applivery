import mongoose, { Schema } from 'mongoose';
import type { IRadar } from '../../common/types/index.ts';

const radarSchema = new Schema<IRadar>({
    protocols: {
        type: [String],
        enum: [
            'closest-enemies',
            'furthest-enemies',
            'assist-allies',
            'avoid-crossfire',
            'prioritize-mech',
            'avoid-mech',
        ],
        required: true,
    },

    scan: {
        type: [
            {
                coordinates: {
                    x: {
                        type: Number,
                        required: true,
                    },
                    y: {
                        type: Number,
                        required: true,
                    },
                },

                enemies: {
                    type: {
                        type: String,
                        required: true,
                    },
                    number: {
                        type: Number,
                        required: true,
                    },
                },
            },
        ],
        required: true,
    },
});

export const Radar = mongoose.model<IRadar>('Radar', radarSchema);
