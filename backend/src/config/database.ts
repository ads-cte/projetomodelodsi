import { Sequelize } from 'sequelize';

const sequelize = new Sequelize('db_protocolo', 'ads_user', 'ads_password', {
  // Se existir a variável DB_HOST (vinda do Docker), usa ela. 
  // Se não (rodando local), usa 'localhost'.
  host: process.env.DB_HOST || 'localhost', 
  dialect: 'mysql',
  logging: false,
});

export default sequelize;