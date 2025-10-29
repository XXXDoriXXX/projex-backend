import jwt from 'jsonwebtoken';

export const generateToken = (id: string, username: string) => {
    let JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
        return;
    }
    return jwt.sign(
        {
            userId: id,
            username: username,
        },
        JWT_SECRET,
        { expiresIn: '24h' },
    );
};
