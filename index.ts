import { createApp } from './src/app.ts';
import { PORT } from './src/config/database.ts';

const app = createApp();

app.listen(PORT, () => {
    console.log('Listening on port ', PORT);
});
