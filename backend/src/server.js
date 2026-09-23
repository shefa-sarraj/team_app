const env = require('./config/env');
const app = require('./app');

const port = env.PORT;

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
