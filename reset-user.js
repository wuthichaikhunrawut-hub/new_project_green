const bcrypt = require('bcrypt');
const { createConnection } = require('typeorm');

(async () => {
  try {
    const connection = await createConnection(); // reads ormconfig from project
    const userRepo = connection.getRepository('User');
    const email = 'User@testmail.com';
    const newPassword = 'admin123'; // desired password
    const hash = await bcrypt.hash(newPassword, 10);
    const user = await userRepo.findOne({ where: { email } });
    if (!user) {
      console.error(`❌ User with email ${email} not found`);
      process.exit(1);
    }
    user.password_hash = hash;
    await userRepo.save(user);
    console.log(`✅ Password for ${email} updated to "${newPassword}"`);
    await connection.close();
  } catch (err) {
    console.error('Error updating password:', err);
    process.exit(1);
  }
})();
