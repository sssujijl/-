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

router.get('/resumes', async (req,res,next) => {
    const resumes = await prisma.resumes.findMany({
        select : {
            resumeId : true,
            userId : true,
            title : true,
            content : true,
            author : true,
            createdAt : true,
            updatedAt : true
        },
        orderBy : {
            createdAt : 'desc'
        }
    });

    return res.status(200).json({data : resumes});
})

router.get('/resumes/:resumeId', async (req,res,next) => {
    const {resumeId} = req.params;
    const resume = await prisma.resumes.findFirst({
        where : {resumeId : +resumeId},
        select : {
            resumeId : true,
            userId : true,
            title : true,
            content : true,
            author : true,
            createdAt : true,
            updatedAt : true
        }
    });

    return res.status(200).json({data : resume});
})

export default router;