require("dotenv").config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { PORT } = require('./config/env');
const routes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');
const path = require('path');

const app = express();
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));

app.use('/api', routes);
app.use('/uploads', express.static(path.join(__dirname, '..' , 'uploads')));

// global error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
