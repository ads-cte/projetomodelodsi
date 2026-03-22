import { Router, Request, Response } from 'express';
import { User } from '../models/User';
import jwt from 'jsonwebtoken';

const router = Router();
const JWT_SECRET = '123456'; // Em produção, use .env

/**
 * GET /api/health
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'OK',
    message: 'Backend is running',
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /api/hello
 */
router.get('/hello', (req: Request, res: Response) => {
  res.json({
    message: 'Hello from Express Backend!'
  });
});

// ROTA DE REGISTRO
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await User.create({ email, password });
    res.status(201).json({ id: user.id, email: user.email });
  } catch (error) {
    res.status(400).json({ error: 'Usuário já existe ou dados inválidos' });
  }
});

// ROTA DE LOGIN
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await User.findOne({ where: { email } });

  if (!user || !(await user.checkPassword(password))) {
    return res.status(401).json({ error: 'E-mail ou senha incorretos' });
  }

  // Gera o Token JWT válido por 1 dia
  const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '1d' });

  res.json({ user: { id: user.id, email: user.email }, token });
});

export default router;

