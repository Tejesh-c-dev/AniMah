"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const middleware_1 = require("./middleware");
const auth_1 = __importDefault(require("./routes/auth"));
const titles_1 = __importDefault(require("./routes/titles"));
const reviews_1 = __importDefault(require("./routes/reviews"));
const watchlist_1 = __importDefault(require("./routes/watchlist"));
const favorites_1 = __importDefault(require("./routes/favorites"));
const admin_1 = __importDefault(require("./routes/admin"));
const validateEnvironment = () => {
    const requiredVars = ['DATABASE_URL', 'JWT_SECRET', 'ADMIN_SETUP_KEY', 'CORS_ORIGIN'];
    const missingVars = requiredVars.filter((key) => !process.env[key] || !process.env[key]?.trim());
    if (missingVars.length > 0) {
        throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
    if (process.env.JWT_SECRET.trim().length < 32) {
        throw new Error('JWT_SECRET must be at least 32 characters.');
    }
    if (process.env.ADMIN_SETUP_KEY.trim().length < 32) {
        throw new Error('ADMIN_SETUP_KEY must be at least 32 characters.');
    }
};
validateEnvironment();
process.on('unhandledRejection', (reason) => {
    process.stderr.write(`❌ Unhandled Promise Rejection: ${String(reason)}\n`);
});
process.on('uncaughtException', (error) => {
    process.stderr.write(`❌ Uncaught Exception: ${error.message}\n`);
});
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
app.disable('x-powered-by');
app.set('trust proxy', 1);
// Middleware
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ limit: '10mb', extended: true }));
app.use((0, cookie_parser_1.default)());
app.use(middleware_1.corsMiddleware);
app.use(middleware_1.sanitizeInputMiddleware);
// Routes
app.get('/api/health', (_req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});
app.use('/api/auth', auth_1.default);
app.use('/api/titles', titles_1.default);
app.use('/api/reviews', reviews_1.default);
app.use('/api/watchlist', watchlist_1.default);
app.use('/api/favorites', favorites_1.default);
app.use('/api/admin', admin_1.default);
// 404 handler
app.use((_req, res) => {
    res.status(404).json({ message: 'Not Found' });
});
// Error handler
app.use(middleware_1.errorHandler);
// Start server
const server = app.listen(PORT, () => {
    const address = server.address();
    const activePort = address?.port || PORT;
    process.stdout.write(`✅ Server running on http://localhost:${activePort}\n`);
    process.stdout.write(`📊 Health check: http://localhost:${activePort}/api/health\n`);
});
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        process.stderr.write(`❌ Port ${PORT} is already in use. Set a different PORT and retry.\n`);
        process.exit(1);
    }
    process.stderr.write(`❌ Server failed to start: ${error.message}\n`);
    process.exit(1);
});
exports.default = app;
//# sourceMappingURL=index.js.map