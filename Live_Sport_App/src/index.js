import express from 'express';
import { attachWebSocketServer } from  './ws/server.js';
import { matchRouter } from './routes/matches.js';
import http from 'http';

const PORT = Number(process.env.PORT) || 8000;
const HOST = process.env.HOST || "0.0.0.0";
const app = express();
const server = http.createServer(app);

app.use(express.json()); // Middleware to parse JSON bodies

app.get('/', (req, res) => {
  res.send('Hello, World!');
});



app.use('/matches', matchRouter)

// eplicitly import and attach the WebSocket server
const { broadcastMatchCreated } = attachWebSocketServer(server);
app.locals.broadcastMatchCreated = broadcastMatchCreated; //  app.locals is a convenient place to store global variables or functions that can be accessed in routes and middleware.


server.listen(PORT, HOST, (error) => {
  if (error) {
    return console.error('Error starting server:', error);
  }
  const baseUrl = HOST === '0.0.0.0' ? `http://localhost:${PORT}` : `http://${HOST}:${PORT}`;
  console.log(`Server is running on ${baseUrl}`);
  console.log(`WeSocket Server is running on ${baseUrl.replace('http', 'ws')}/ws`);
});

// async function main() {
//   try {
//     console.log('Performing CRUD operations...');

//     // CREATE: Insert a new user
//     const [newUser] = await db
//       .insert(demoUsers)
//       .values({ name: 'Admin User', email: 'admin@example.com' })
//       .returning();

//     if (!newUser) {
//       throw new Error('Failed to create user');
//     }
    
//     console.log('✅ CREATE: New user created:', newUser);

//     // READ: Select the user
//     const foundUser = await db.select().from(demoUsers).where(eq(demoUsers.id, newUser.id));
//     console.log('✅ READ: Found user:', foundUser[0]);

//     // UPDATE: Change the user's name
//     const [updatedUser] = await db
//       .update(demoUsers)
//       .set({ name: 'Super Admin' })
//       .where(eq(demoUsers.id, newUser.id))
//       .returning();
    
//     if (!updatedUser) {
//       throw new Error('Failed to update user');
//     }
    
//     console.log('✅ UPDATE: User updated:', updatedUser);

//     // DELETE: Remove the user
//     await db.delete(demoUsers).where(eq(demoUsers.id, newUser.id));
//     console.log('✅ DELETE: User deleted.');

//     console.log('\nCRUD operations completed successfully.');
//   } catch (error) {
//     console.error('❌ Error performing CRUD operations:', error);
//     process.exit(1);
//   }
// }

// main();