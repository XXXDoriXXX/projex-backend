//route -> controller -> service -> prisma
import 'dotenv/config';
import 'reflect-metadata';
import app from './app';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
