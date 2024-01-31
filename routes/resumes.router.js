import express from 'express';
import { prisma } from '../modules/index.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/resumes', authMiddleware, async (req,res,next) => {
    const {userId} = req.user;
    const {title, content, author} = req.body;

    const resume = await prisma.resumes.create({
        data : {
            userId : +userId,
            title,
            content,
            author
        }
    });

    return res.status(201).json({data : resume});
})

export default router;