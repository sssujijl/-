import express from "express";
import { prisma } from "../modules/index.js";
import bcrypt from "bcrypt";
import {
  VerificationToken,
  newCreateToken,
  validateToken,
  CreateTokens
} from "../middlewares/middleware.js";

const router = express.Router();

// 회원가입 API
router.post("/sign-up", async (req, res, next) => {
  const { email, password, confirmpassword, name } = req.body;

  if (email.length === 0) {
    return res
      .status(400)
      .json({ errorMessage: "이메일을 입력하세요." });
  } else if (name.length === 0) {
    return res
      .status(400)
      .json({ errorMessage: "이름을 입력하세요." });
  }

  let emailFormat = email.indexOf('.com') !== -1 || email.indexOf('.kr') !== -1;

  if (emailFormat === false) {
    return res.status(400).json({message : "이메일 형식이 틀립니다."});
  }

  const isExistUser = await prisma.users.findFirst({
    where: { email },
  });

  if (isExistUser) {
    return res.status(409).json({ message: "이미 존재하는 이메일입니다." });
  }

  if (password.length < 6) {
    return res
      .status(400)
      .json({ message: "비밀번호는 최소 6글자 이상 입력하세요." });
  }

  if (password !== confirmpassword) {
    return res.status(400).json({ message: "비밀번호가 일치하지 않습니다." });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.users.create({
    data: {
      email,
      password: hashedPassword,
      name,
    },
  });

  return res.status(201).json({ email, name });
});

// 로그인 API
router.post("/log-in", async (req, res, next) => {
  const { email, password } = req.body;
  const user = await prisma.users.findFirst({ where: { email } });

  if (!user) {
    return res.status(401).json({ message: "존재하지 않는 이메일입니다." });
  } else if (!(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: "비밀번호가 일치하지 않습니다." });
  }

  if(await CreateTokens(res, user.userId)) {
    return;
  }

  return res.status(200).json({ message: "로그인하였습니다." });
});

// Access Token 재발급 API
router.get("/tokens", async (req, res) => {
  await newCreateToken(req, res);
});

// 내 정보 조회 API
router.get("/users", async (req, res, next) => {
  if (await VerificationToken(req, res)) {
    return;
  }

  const accessToken = req.cookies.accessToken;
  const userId = validateToken(
    accessToken,
    process.env.ACCESS_TOKEN_SECRET_KEY,
  );

  const user = await prisma.users.findFirst({
    where: { userId: +userId.id },
    select: {
      userId: true,
      email: true,
      name: true,
    },
  });

  return res.status(200).json({ data: user });
});

export default router;
