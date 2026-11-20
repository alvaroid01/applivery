import { createApp } from './src/app.ts';
import { PORT } from './src/config/database.ts';

const app = createApp();

app.listen(Number(PORT), '0.0.0.0', () => {
    console.log('Listening on port ', PORT);
});
