### 1. Instalação das Ferramentas

```bash
# Sequelize e Driver MySQL
npm install sequelize mysql2

# Segurança (Criptografia de senha e Tokens JWT)
npm install bcryptjs jsonwebtoken

# Tipagens (Desenvolvimento)
npm install --save-dev @types/sequelize @types/bcryptjs @types/jsonwebtoken
```

---

### 2. O Banco de Dados (Docker)
Crie o arquivo `docker-compose.yml` na raiz para subir o MySQL:

```yaml
version: '3.8'
services:
  db:
    image: mysql:8.0
    container_name: mysql_protocolo
    environment:
      MYSQL_ROOT_PASSWORD: root_password
      MYSQL_DATABASE: db_protocolo
      MYSQL_USER: ads_user
      MYSQL_PASSWORD: ads_password
    ports:
      - "3306:3306"
```
> Com o Docker Desktop aberto, rode: `docker-compose up -d` no terminal.

---

### 3. Configuração do Sequelize
Crie `src/config/database.ts`:

```typescript
import { Sequelize } from 'sequelize';

const sequelize = new Sequelize('db_protocolo', 'ads_user', 'ads_password', {
  host: 'localhost',
  dialect: 'mysql',
  logging: false,
});

export default sequelize;
```

---

### 4. O Modelo de Usuário (`User.ts`)
Aqui definimos a tabela de usuários com proteção de senha. Crie `src/models/User.ts`:

```typescript
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import bcrypt from 'bcryptjs';

export class User extends Model {
  public id!: number;
  public email!: string;
  public password!: string;

  // Método para validar a senha no login
  public checkPassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }
}

User.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
}, { 
  sequelize,
  hooks: {
    // Criptografa a senha antes de salvar no banco
    beforeSave: async (user: User) => {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 8);
      }
    }
  }
});
```

---

### 5. Configurando as Rotas (`api.routes.ts`)
Vamos criar os endpoints de **Registro** e **Login**.

```typescript
import { Router, Request, Response } from 'express';
import { User } from '../models/User';
import jwt from 'jsonwebtoken';

const router = Router();
const JWT_SECRET = 'sua_chave_secreta_aqui'; // Em produção, use .env

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
```

---

### 6. Ligando tudo no `index.ts`
Substitua o trecho final do seu `index.ts` para garantir que o banco sincronize:

```typescript
import sequelize from './config/database';

// ... (seus middlewares)

const bootstrap = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync(); // Cria as tabelas automaticamente
    console.log('✅ Conectado ao MySQL via Docker!');

    app.listen(port, () => {
      console.log(`[server]: Rodando em http://localhost:${port}`);
    });
  } catch (err) {
    console.error('❌ Falha ao iniciar:', err);
  }
};

bootstrap();
```

---

### Passo a Passo Detalhado (Para Alunos Leigos)

1.  **Instalação**: Rode os comandos `npm install` citados no item 1. Sem eles, o código não reconhecerá o JWT ou o Banco.
2.  **Docker**: Certifique-se que o Docker está rodando e execute `docker-compose up -d`. Isso cria seu servidor de banco de dados virtual.
3.  **Configurações**: Crie os arquivos conforme a estrutura. O arquivo `database.ts` é o "porteiro" da sua aplicação.
4.  **O Hook do Modelo**: Note que no arquivo `User.ts` usamos um `hook` chamado `beforeSave`. Isso garante que a senha nunca seja salva em texto limpo no banco (regra de ouro de segurança!).
5.  **Teste no Postman/Insomnia**:
    * **Registro**: `POST http://localhost:3001/api/register` com JSON `{ "email": "aluno@fatec.com", "password": "123" }`.
    * **Login**: `POST http://localhost:3001/api/login` com o mesmo JSON. Você receberá um **Token JWT**. Guarde esse token, ele é o seu "crachá" para as próximas rotas!

**Quer que eu crie agora um middleware de proteção para que apenas usuários logados (com o token) consigam acessar certas rotas?**