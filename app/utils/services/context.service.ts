import { createContext } from 'react-router';
import type { UserContextType } from '../types/user.types';

export const userContext = createContext<UserContextType | null>(null);
