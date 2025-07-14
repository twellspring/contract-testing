import express from 'express';
import bodyParser from 'body-parser';
import { Request, Response } from 'express';

// Create an Express server for our mock shipping service
const app = express();
// Use port 9001 as specified
const PORT = 9001;

app.use(bodyParser.json());

// Implement the getquote endpoint according to our contract
app.post('/getquote', (req: Request, res: Response) => {
  const { numberOfItems } = req.body;
  
  // Validate input
  if (numberOfItems === undefined || numberOfItems === null) {
    return res.status(400).json({
      error: 'Missing numberOfItems'
    });
  }
  
  // Handle negative items case
  if (numberOfItems < 0) {
    return res.status(400).json({
      error: 'Invalid number of items'
    });
  }
  
  // Calculate shipping cost based on number of items
  // For bulk orders (>10 items), use a different price
  const units = numberOfItems > 10 ? 15 : 10;
  
  // Return the response in the format specified by our contract
  res.json({
    cost_usd: {
      currency_code: 'USD',
      units,
      nanos: 0
    }
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Mock shipping service running at http://localhost:${PORT}`);
});
