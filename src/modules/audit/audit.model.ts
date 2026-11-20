import mongoose, { Schema } from 'mongoose';
import type { IAudit } from '../../common/types/index.ts';

const auditSchema = new Schema<IAudit>({
    input: {
        type: Schema.Types.Mixed,
        required: true,
    },
    output: {
        type: Schema.Types.Mixed,
        required: true,
    },
    createdAt: {
        type: Date,
        required: true,
    },
});

export const Audit = mongoose.model<IAudit>('Audit', auditSchema);
