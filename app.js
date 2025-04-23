const express = require('express');
require('dotenv/config');

const app = express();
const environment = process.env;

const hostname = environment.HOST || '0.0.0.0';
const port = environment.PORT || 3000;

app.listen(port, hostname, () => {
  console.log(`Server is running on http://${hostname}:${port}`);
});
