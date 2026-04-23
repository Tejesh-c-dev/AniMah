"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const middleware_1 = require("./middleware");
const auth_1 = __importDefault(require("./routes/auth"));
const titles_1 = __importDefault(require("./routes/titles"));
const reviews_1 = __importDefault(require("./routes/reviews"));
const watchlist_1 = __importDefault(require("./routes/watchlist"));
const favorites_1 = __importDefault(require("./routes/favorites"));
const admin_1 = __importDefault(require("./routes/admin"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
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
app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});
exports.default = app;
//# sourceMappingURL=index.js.map