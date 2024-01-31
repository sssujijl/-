import express from 'express';
import { prisma } from '../modules/index.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

// 회원가입 API
router.post('/sign-up', async (req,res,next) => {
    const {email, password, confirmpassword, name} = req.body;
    const isExistUser = await prisma.users.findFirst({
        where : { email}
    });

    if (isExistUser) {
        return res.status(409).json({message : "이미 존재하는 이메일입니다."});
    }

    if (password.length !== 6) {
        return res.status(400).json({message : "비밀번호는 최소 6글자 이상 입력하세요."})
    }

    if (password !== confirmpassword) {
        return res.status(400).json({message : "비밀번호가 일치하지 않습니다."})
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const hashedCPassword = await bcrypt.hash(confirmpassword, 10);

    const user = await prisma.users.create({
        data: {email, 
            password : hashedPassword, 
            confirmpassword : hashedCPassword, name},
    });

    return res.status(201).json({email, name})
})

// 로그인 API
router.post('/log-in', async (req,res,next) => {
    const {email, password} = req.body;
    const user = await prisma.users.findFirst({where : {email}});

    if (!user) {
        return res.status(401).json({message : "존재하지 않는 이메일입니다."})
    } else if (!(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({message : "비밀번호가 일치하지 않습니다."})
    };

    const token = jwt.sign(
        {userId : user.userId},'custom-secret-key'
    );

    res.cookie('authorization', `Bearer ${token}`);
    return res.status(200).json({message : "로그인하였습니다."})
})

// 내 정보 조회 API
router.get('/users', authMiddleware, async (req,res,next) => {
    const {userId} = req.user;

    const user = await prisma.users.findFirst({
        where : {userId : +userId},
        select : {
            userId : true,
            email : true,
            name : true
        }
    });

    return res.status(200).json({data : user});
})

export default router;