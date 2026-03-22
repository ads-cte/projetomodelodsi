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