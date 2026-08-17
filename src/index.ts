import app from "./app.ts";
import { connectToDatabase } from "./config/db.ts";

const PORT = process.env.PORT || 3000;
const startServer = async () => {
  // confirm DB works first
  await connectToDatabase();

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

startServer();
