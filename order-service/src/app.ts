import cors from 'cors';
import express from 'express';
import correlationId from '../../libs/common/middleware/correlation-id';
import { orderService } from './di';
import createOrderRoutes from './routes/order.routes';
import errorMiddleware from './middleware/error.middleware';

const app = express();

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

app.use(correlationId);

app.use('/api', createOrderRoutes(orderService));

app.get('/', (_req, res) => res.json({ status: 'ok' }));

app.use(errorMiddleware);

export default app;
