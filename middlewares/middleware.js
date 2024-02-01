import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

let tokenStorage = {};

function createAccessToken(id) {
    const accessToken = jwt.sign(
        { id: id },
        process.env.ACCESS_TOKEN_SECRET_KEY,
        { expiresIn: '12h' }
    );

    return accessToken;
};

function createRefreshToken(id) {
    const refreshToken = jwt.sign(
        { id: id },
        process.env.REFRESH_TOKEN_SECRET_KEY,
        { expiresIn: '7d' }
    );

    return refreshToken;
};

function validateToken(token, secretKey) {
    try {
        const payload = jwt.verify(token, secretKey);
        return payload;
    } catch (error) {
        return null;
    }
}

function createTokens(req, res, id) {
    const accessToken = createAccessToken(id);
    const refreshToken = createRefreshToken(id);

    tokenStorage[refreshToken] = {
        id: id,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
    };

    res.cookie('accessToken', accessToken);
    res.cookie('refreshToken', refreshToken);
}

function VerificationToken(req, res) {
    const accessToken = req.cookies.accessToken;
    if (!accessToken) {
        return res.status(400).json({ message: "Access Token이 존재하지 않습니다." });
    }

    const payload = validateToken(accessToken, process.env.ACCESS_TOKEN_SECRET_KEY);
    if (!payload) {
        return res.status(401).json({ message: "Access Token이 유효하지 않습니다." });
    }
}

function newCreateToken(req, res) {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        return res.status(400).json({ message: "Refresh Token이 존재하지 않습니다." });
    }

    const payload = validateToken(refreshToken, process.env.REFRESH_TOKEN_SECRET_KEY);
    if (!payload) {
        return res.status(401).json({ message: "Refresh Token이 유효하지않습니다." });
    }

    const userInfo = tokenStorage[refreshToken];
    if (!userInfo) {
        return res.status(419).json({ message: "Refresh Token의 정보가 서버에 존재하지 않습니다." });
    }

    const newAccessToken = createAccessToken(userInfo.id);

    res.cookie('accessToken', newAccessToken);
    return res.json({ message: "Access Token을 새롭게 발급하였습니다." });
}



export { createTokens, VerificationToken, newCreateToken, validateToken };