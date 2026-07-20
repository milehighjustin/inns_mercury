import jwt from "jsonwebtoken";

export default function validateToken(token: string): any {
    try {
        const decoded = jwt.verify(token, process.env.jwtSecret || "");
        return decoded;
    } catch (err) {
        console.error("Token validation error:", err);
        return null;
    }
}