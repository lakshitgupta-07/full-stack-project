/**
 * @swagger
 *
 * /api/v1/auth/login:
 *   post:
 *     summary: Login User
 *     tags:
 *       - Authentication
 *
 *     requestBody:
 *       required: true
 *
 *       content:
 *         application/json:
 *
 *           schema:
 *
 *             type: object
 *
 *             required:
 *               - email
 *               - password
 *
 *             properties:
 *
 *               email:
 *                 type: string
 *
 *               password:
 *                 type: string
 *
 *     responses:
 *
 *       200:
 *         description: Login Successful
 *
 *       401:
 *         description: Invalid Credentials
 *
 */