const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const cors = require('cors');
const typeDefs = require('./graphql/typeDefs');
const resolvers = require('./graphql/resolvers');
const connectDB = require('./config/db');
require('dotenv').config(); // ✅ Load dotenv only once

async function startServer() {
    const app = express();

    // ✅ Connect to MongoDB before starting the server
    try {
        await connectDB();
        console.log("✅ MongoDB connected successfully.");
    } catch (error) {
        console.error("❌ MongoDB connection error:", error.message);
        process.exit(1); // Exit if DB connection fails
    }

    // ✅ Correctly configure middleware
    app.use(express.json());
    app.use(cors());

    // ✅ Define Apollo Server
    const server = new ApolloServer({
        typeDefs,
        resolvers,
        context: ({ req }) => ({ req })
    });

    await server.start();
    server.applyMiddleware({ app });

    // ✅ Start the server after everything is ready
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`🚀 Server running at http://localhost:${PORT}${server.graphqlPath}`);
    });
}

startServer().catch(err => console.error("❌ Error starting server:", err.message));
