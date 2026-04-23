"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
exports.adminMiddleware = adminMiddleware;
exports.corsMiddleware = corsMiddleware;
exports.sanitizeInputMiddleware = sanitizeInputMiddleware;
exports.errorHandler = errorHandler;
const auth_1 = require("../utils/auth");
const types_1 = require("../../../src/types");
/**
 * Middleware to authenticate user via JWT
 */
function authMiddleware(req, res, next) {
    const token = (0, auth_1.extractTokenFromRequest)(req);
    if (!token) {
        res.status(401).json({ message: 'Unauthorized: No token provided' });
        return;
    }
    const payload = (0, auth_1.verifyToken)(token);
    if (!payload) {
        res.status(401).json({ message: 'Unauthorized: Invalid or expired token' });
        return;
    }
    req.user = payload;
    next();
}
/**
 * Middleware to check if user is admin
 */
function adminMiddleware(req, res, next) {
    if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }
    if (req.user.role !== types_1.Role.ADMIN) {
        res.status(403).json({ message: 'Forbidden: Admin access required' });
        return;
    }
    next();
}
/**
 * Middleware for CORS
 */
function corsMiddleware(req, res, next) {
    const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',');
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
        return;
    }
    next();
}
/**
 * Input sanitization middleware
 */
function sanitizeInputMiddleware(req, _res, next) {
    const sanitize = (value) => {
        if (typeof value === 'string') {
            return value.trim().replace(/[<>]/g, '');
        }
        if (Array.isArray(value)) {
            return value.map(sanitize);
        }
        if (typeof value === 'object' && value !== null) {
            const sanitized = {};
            for (const key in value) {
                sanitized[key] = sanitize(value[key]);
            }
            return sanitized;
        }
        return value;
    };
    req.body = sanitize(req.body);
    req.query = sanitize(req.query);
    next();
}
/**
 * Error handling middleware
 */
function errorHandler(error, _req, res, next) {
    console.error('Error:', error);
    if (res.headersSent) {
        return next(error);
    }
    if (error.status && error.message) {
        res.status(error.status).json({ message: error.message, code: error.code });
    }
    else {
        res.status(500).json({ message: 'Internal Server Error' });
    }
}
//# sourceMappingURL=index.js.map