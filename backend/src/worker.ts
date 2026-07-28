import dotenv from 'dotenv';
dotenv.config();

import './config/redis.js';
import './workers/email.workers.js'
