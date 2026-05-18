import express from 'express';
import cors from 'cors';
import productRoutes from './routes/product.routes';
import correlationId from '../../libs/common/middleware/correlation-id';
import requestLogger from '../../libs/common/middleware/request-logger';

const app = express();
// Allow frontend dev server to access APIs
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
// ensure request id is present
app.use(correlationId);
// request logging (sends summaries to notification-service inspector)
app.use(requestLogger);
// Disable ETag generation so clients won't receive 304 Not Modified from ETag checks
app.disable('etag');

// Ensure API responses are not cached by the browser (development-friendly)
app.use('/api', (req, res, next) => {
	res.setHeader('Cache-Control', 'no-store');
	next();
}, productRoutes);
app.get('/', (req, res) => res.json({ status: 'ok' }));

// Centralized error handler: map AppError subclasses to HTTP responses
import { AppError } from './errors/app-errors';

app.use((err: any, req: any, res: any, next: any) => {
	console.error('Unhandled error:', err?.message || err);
	if (err && typeof err.status === 'number') {
		return res.status(err.status).json({ message: err.message });
	}
	return res.status(500).json({ message: 'Internal server error' });
});

export default app;
