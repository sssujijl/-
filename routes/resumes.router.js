import express from "express";
import { prisma } from "../modules/index.js";
import { VerificationToken, validateToken } from "../middlewares/middleware.js";

const router = express.Router();

// 이력서 생성 API
router.post("/resumes",VerificationToken, async (req, res, next) => {
  const id = req.user;

  const user = await prisma.users.findFirst({ where: { userId: id } });

  const { title, content } = req.body;

  if (title.length === 0) {
    return res
      .status(400)
      .json({ errorMessage: "제목을 입력하세요." });
  } else if (content.length === 0) {
    return res
      .status(400)
      .json({ errorMessage: "자기소개를 입력하세요." });
  }

  const resume = await prisma.resumes.create({
    data: {
      userId: +user.userId,
      title,
      content,
      author: user.name,
    },
  });

  return res.status(201).json({ data: resume });
});

// 모든 이력서 조회 API
router.get("/resumes", async (req, res, next) => {
  const orderKey = req.query.orderKey;
  const orderValue = req.query.orderValue;

  const resumes = await prisma.resumes.findMany({
    orderBy: {
      [orderKey] : orderValue.toLowerCase()
    },
  });

  if(!resumes) {
    return res.status(404).json({ message: "이력서 조회에 실패하였습니다." });
  }

  return res.status(200).json({ data: resumes });
});

// 이력서 상세 조회 API
router.get("/resume/:resumeId", async (req, res, next) => {
  const { resumeId } = req.params;

  const resume = await prisma.resumes.findFirst({
    where: { resumeId: +resumeId },
    select: {
      resumeId: true,
      userId: true,
      title: true,
      content: true,
      author: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!resume) {
    return res.status(404).json({ message: "이력서 조회에 실패하였습니다." });
  }

  return res.status(200).json({ data: resume });
});

// 이력서 수정 API
router.put("/resumes/:resumeId", VerificationToken, async (req, res, next) => {
  const { resumeId } = req.params;
  const { title, content, status } = req.body;

  const Id = await prisma.resumes.findFirst({ where: { resumeId: +resumeId } });

  if (!Id) {
    return res.status(404).json({ message: "이력서 조회에 실패하였습니다." });
  }

  const resume = await prisma.resumes.update({
    where: Id,
    select: {
      resumeId: true,
      userId: true,
      title: true,
      content: true,
      author: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
    data: {
      title: title,
      content: content,
      status: status,
    },
  });

  return res.status(200).json({ data: resume });
});

// 이력서 삭제 API
router.delete("/resumes/:resumeId", VerificationToken, async (req, res, next) => {
  const { resumeId } = req.params;
  const Id = await prisma.resumes.findFirst({ where: { resumeId: +resumeId } });

  if (!Id) {
    return res.status(404).json({ message: "이력서 조회에 실패하였습니다." });
  }

  await prisma.resumes.delete({ where: Id });

  return res.status(200).json({ message: "해당 이력서를 삭제하였습니다." });
});

export default router;
