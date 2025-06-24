import { query } from './db';
import bcrypt from 'bcrypt';

async function checkAdminPassword() {
  try {
    // Get admin user with password hash
    const result = await query(
      'SELECT id, username, email, password_hash FROM users WHERE email = $1',
      ['admin@stacrm.com']
    );

    if (result.rows.length === 0) {
      console.log('Admin user not found');
      return;
    }

    const user = result.rows[0];
    console.log('Admin user found:', {
      id: user.id,
      username: user.username,
      email: user.email,
      password_hash_length: user.password_hash?.length || 0
    });

    // Test password
    const testPassword = 'admin123';
    const isMatch = await bcrypt.compare(testPassword, user.password_hash);
    console.log(`Password '${testPassword}' matches:`, isMatch);

    // Create new password hash for verification
    const newHash = await bcrypt.hash(testPassword, 12);
    console.log('New hash for same password:', newHash);

    // Update password if needed
    if (!isMatch) {
      console.log('Updating password...');
      await query(
        'UPDATE users SET password_hash = $1 WHERE id = $2',
        [newHash, user.id]
      );
      console.log('Password updated');
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

checkAdminPassword(); 