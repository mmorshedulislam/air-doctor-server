const express = require("express");
const cors = require("cors");
const app = express();
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();
const port = process.env.PORT || 5000;

// middle ware

app.use(cors());
app.use(express.json());

async function run() {
  const uri = `mongodb+srv://airDoctorDbUser:${process.env.DB_PASSWORD}@cluster0.bwn02l7.mongodb.net/?retryWrites=true&w=majority`;
  //   console.log(uri);
  const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverApi: ServerApiVersion.v1,
  });

  try {
    const serviceCollection = client.db("airDoctor").collection("services");

    // insert service
    app.post("/services", async (req, res) => {
      const service = req.body;
      const result = await serviceCollection.insertOne(service);
      console.log({
        status: true,
        result,
      });
    });

    // find all service
    app.get("/services", async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query);
      const services = await cursor.toArray();
      const count = await serviceCollection.estimatedDocumentCount();
      res.send({
        count,
        services,
      });
    });

    // try ends
  } catch (error) {
    console.log(error);
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Server Running");
});

app.listen(port, () => {
  console.log("Server running on", port);
});
