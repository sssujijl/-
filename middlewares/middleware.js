import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { prisma } from "../modules/index.js";
dotenv.config();

async function createTokens(res, id) {
  const accessToken = createAccessToken(id);
  const refreshToken = createRefreshToken(id);

  if (!accessToken || !refreshToken) {
    return res.json({errormessage : "안됌"});
  }

  await prisma.RefreshToken.create({
    data: { refreshtoken: refreshToken },
  });

  res.cookie("accessToken", accessToken);
  res.cookie("refreshToken", refreshToken);
}

async function newCreateToken(req, res) {
  const RefreshToken = req.cookies.refreshToken;

  const refreshToken = await prisma.RefreshToken.findFirst({
    where: { refreshtoken: RefreshToken },
  });

  if (!RefreshToken) {
    return res
      .status(400)
      .json({ message: "Refresh Token이 존재하지 않습니다." });
  }

  const payload = validateToken(
    refreshToken.refreshtoken,
    process.env.REFRESH_TOKEN_SECRET_KEY,
  );
  if (!payload) {
    return res
      .status(401)
      .json({ message: "Refresh Token이 유효하지않습니다." });
  }

  if (!refreshToken.refreshtoken) {
    return res
      .status(419)
      .json({ message: "Refresh Token의 정보가 서버에 존재하지 않습니다." });
  }

  const newAccessToken = createAccessToken(payload.id);

  res.cookie("accessToken", newAccessToken);
  return res.json({ message: "Access Token을 새롭게 발급하였습니다." });
}

function createAccessToken(id) {
  const accessToken = jwt.sign(
    { id: id },
    process.env.ACCESS_TOKEN_SECRET_KEY,
    { expiresIn: "12h" },
  );

  return accessToken;
}

function createRefreshToken(id) {
  const refreshToken = jwt.sign(
    { id: id },
    process.env.REFRESH_TOKEN_SECRET_KEY,
    { expiresIn: "7d" },
  );

  return refreshToken;
}

function validateToken(token, secretKey, res) {
  try {
    const payload = jwt.verify(token, secretKey);
    return payload;

  } catch (error) {
    res.clearCookie('accessToken');

    switch (error.name) {
      case 'TokenExpiredError':
        return res.status(401).json({message : '토큰이 만료되었습니다.'});
      case 'JsonWebTokenError':
        return res.status(401).json({ message: '토큰이 조작되었습니다.' });
      default:
        return res.status(401).json({ message: error.message ?? '비정상적인 요청입니다.' });
    }
  }
}

async function verificationToken(req, res, next) {
  const accessToken = req.cookies.accessToken;
  if (!accessToken) {
    return res
      .status(400)
      .json({ message: "Access Token이 존재하지 않습니다." });
  }

  const payload = validateToken(
    accessToken,
    process.env.ACCESS_TOKEN_SECRET_KEY,
    res
  );
  if (!payload) {
    return res
      .status(401)
      .json({ message: "Access Token이 유효하지 않습니다." });
  }

  const userId = payload.id;
  const user = await prisma.users.findFirst({where : {userId : +userId}});

  if (!user) {
    res.status(401).json({message : "토큰 사용자가 존재하지 않습니다."});
  }

  req.user = user;

  next();
}

export {
  verificationToken,
  newCreateToken,
  createTokens
};
