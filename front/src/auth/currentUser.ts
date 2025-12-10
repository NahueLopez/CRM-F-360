import type { UserRole } from "../types/user";

export interface CurrentUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

export const currentUser: CurrentUser = {
  id: 1,
  name: "Nahuel",
  email: "nahuel@example.com",
  role: "Admin", 
};
