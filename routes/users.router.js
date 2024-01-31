import express from 'express';
import { prisma } from '../modules/index.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

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

router.post('/log-in', async (req,res,next))

export default router;