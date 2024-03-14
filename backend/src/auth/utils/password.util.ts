import { compareSync, hashSync } from "bcrypt"

export const passwordEncoder: (password: string) => string = (password) => {
    return hashSync(password, 10);
}

export const passwordsMatch: (plainPassword: string, hashedPassword: string) => boolean = (plainPassword, hashedPassword) => {
    return compareSync(plainPassword, hashedPassword);
}