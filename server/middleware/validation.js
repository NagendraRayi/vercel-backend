/**
 * Middleware to validate login request body
 */
export const validateLogin = (req, res, next) => {
  const { email, password, role } = req.body;

  // 1. Check if both fields are present
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const trimmedEmail = email.trim();
  
  // 2. Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    return res.status(400).json({ message: 'Please enter a valid email address.' });
  }

  // 3. Validate password length (min 6 characters)
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
  }

  // 4. Validate role if provided
  if (role && role !== 'admin' && role !== 'employee') {
    return res.status(400).json({ message: 'Invalid role selection.' });
  }

  // Sanitize the email on the request body for downstream database lookup
  req.body.email = trimmedEmail.toLowerCase();

  next();
};
