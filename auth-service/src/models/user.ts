// User document shape stored in the `users` collection.
export interface User {
  email: string;
  password: string;
  role: 'user' | 'admin';
  createdAt?: string;
  // Self-editable profile fields.
  name?: string;
  phone?: string;
  address?: string;
}

export default User;
