const path = require('path');
const dotenv = require('dotenv');

// Load test environment variables
dotenv.config({
  path: path.resolve(__dirname, '.env.test')
}); 