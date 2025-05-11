const bodyParser = require('body-parser');
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv/config');


const app = express();
const environment = process.env;
const api = environment.API_PREFIX || '/api/v1';
const hostname = environment.HOST || '0.0.0.0';
const port = environment.PORT || 3000;

app.use(bodyParser.json());
app.use(morgan('tiny'));
app.use(cors());
app.options(api, cors());

const authRoutes = require('./routes/auth');
app.use(`${api}`, authRoutes);


mongoose.connect(environment.MONGO_URI).then(() => {
  console.log('Connected to MongoDB successfully');
}).catch((err) => {
  console.error(err);
});


app.listen(port, hostname, () => {
  console.log(`Server is running on http://${hostname}:${port}`);
});
