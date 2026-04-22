import { Router } from 'express'

import { authMiddleware } from '../../shared/infrastructure/http/auth.middleware'
import { prisma } from '../../shared/infrastructure/prisma/prisma-client'
import { updateUserInfoSchema } from '../application/update-user-info/update-user-info.dto'
import { UpdateUserInfoUseCase } from '../application/update-user-info/update-user-info.use-case'
import { GetUserBalanceUseCase } from '../application/get-user-balance/get-user-balance.use-case'

import { PrismaUserRepository } from './prisma-user.repository'

const router = Router()
const repo = new PrismaUserRepository(prisma)
const updateUserInfo = new UpdateUserInfoUseCase(repo)
const getUserBalance = new GetUserBalanceUseCase(prisma)

/**
 * @openapi
 * /users/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const user = await repo.findById(req.user.id)
    res.json(user)
  } catch (err) {
    next(err)
  }
})

/**
 * @openapi
 * /users/me:
 *   patch:
 *     summary: Update current user personal information
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *                 example: "Lucas Martínez"
 *               phone:
 *                 type: string
 *                 nullable: true
 *                 example: "+56912345678"
 *     responses:
 *       200:
 *         description: Updated user profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *       422:
 *         description: Validation error
 */
router.patch('/me', authMiddleware, async (req, res, next) => {
  try {
    const dto = updateUserInfoSchema.parse(req.body)
    const user = await updateUserInfo.execute(req.user.id, dto)
    res.json(user)
  } catch (err) {
    next(err)
  }
})

/**
 * @openapi
 * /users/me/balance:
 *   get:
 *     summary: Get the user's available wallet balance
 *     description: available_balance = Σ(DEPOSIT) - Σ(WITHDRAWAL) - Σ(BUY) + Σ(SELL)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Available balance
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 available_balance:
 *                   type: string
 *                   example: "8250.000000"
 */
router.get('/me/balance', authMiddleware, async (req, res, next) => {
  try {
    const result = await getUserBalance.execute(req.user.id)
    res.json(result)
  } catch (err) {
    next(err)
  }
})

export { router as usersRouter }
