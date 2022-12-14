const express = require("express");
const cors = require("cors");
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const port = process.env.PORT || 5000;

// middle ware
app.use(cors());
app.use(express.json());

const verifyJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "UnAuthorization access" });
  }
  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send("Forbidden access");
    }
    req.decoded = decoded;
    next();
  });
};

async function run() {
  const uri = `mongodb+srv://airDoctorDbUser:${process.env.DB_PASSWORD}@cluster0.bwn02l7.mongodb.net/?retryWrites=true&w=majority`;
  const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverApi: ServerApiVersion.v1,
  });

  try {
    const serviceCollection = client.db("airDoctor").collection("services");
    const reviewCollection = client.db("airDoctor").collection("reviews");
    const blogCollection = client.db("airDoctor").collection("blogs");
    const timeCollection = client.db("airDoctor").collection("time");

    // jwt sign
    app.post("/jwt", (req, res) => {
      const email = req.body.email;
      const token = jwt.sign(email, process.env.ACCESS_TOKEN_SECRET);
      res.send({ token });
    });

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
      const size = parseInt(req.query.perPage);
      const page = parseInt(req.query.currentPage);
      const query = {};
      const cursor = serviceCollection.find(query).sort({ dateField: -1 });
      const services = await cursor
        .skip(size * page)
        .limit(size)
        .toArray();
      const count = await serviceCollection.estimatedDocumentCount();
      res.send({
        count,
        services,
      });
    });

    // find limit 3 service
    app.get("/service3", async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query).sort({ dateField: -1 });
      const service = await cursor.limit(3).toArray();
      res.send(service);
    });
    // find a service by id
    app.get("/service/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const service = await serviceCollection.findOne(query);
      res.send({
        status: true,
        service,
      });
    });

    // find service by query id
    app.get("/serviceId", async (req, res) => {
      const search = req.query.serviceId;
      const query = { _id: ObjectId(search) };
      const service = await serviceCollection.findOne(query);
      // const service = await cursor.toArray();
      res.send(service);
    });

    // insert a review
    app.post("/reviews", verifyJWT, async (req, res) => {
      const review = req.body;
      const result = await reviewCollection.insertOne(review);
      res.send(result);
    });

    // find review by service id
    app.get("/reviewServiceId", async (req, res) => {
      const search = req.query.serviceId;
      const query = { serviceId: search };
      const cursor = reviewCollection.find(query).sort({ dateField: -1 });
      const reviews = await cursor.toArray();
      const count = await reviewCollection.estimatedDocumentCount();
      res.send({
        count,
        reviews,
      });
    });

    // delete review
    app.delete("/review/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await reviewCollection.deleteOne(query);
      res.send(result);
    });

    // find review by email
    app.get("/reviewsEmail", verifyJWT, async (req, res) => {
      const decoded = req.decoded;
      if (decoded !== req.query.email) {
        return res.send({ message: "Your not valid User" });
      }

      let query = {};
      if (req.query.email) {
        query = {
          email: req.query.email,
        };
      }
      const cursor = reviewCollection.find(query).sort({ dateField: -1 });
      const reviews = await cursor.toArray();
      const count = await reviewCollection.estimatedDocumentCount();
      res.send({
        count,
        reviews,
      });
    });

    // find review by id
    app.get("/reviewById/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await reviewCollection.findOne(query);
      res.send(result);
    });

    // update review by id
    app.put("/updateReview/:id", async (req, res) => {
      const id = req.params.id;
      const review = req.body;
      const query = { _id: ObjectId(id) };
      const updateDoc = {
        $set: {
          name: review.name,
          title: review.title,
          description: review.description,
          rating: review.rating,
        },
      };
      const options = { upsert: true };
      const result = await reviewCollection.updateOne(
        query,
        updateDoc,
        options
      );
      res.send(result);
    });

    // insert a blog
    app.post("/blogs", async (req, res) => {
      const blog = req.body;
      const result = await blogCollection.insertOne(blog);
      res.send(result);
    });

    // find all blogs
    app.get("/blogs", async (req, res) => {
      const query = {};
      const cursor = blogCollection.find(query).sort({ dateField: -1 });
      const blogs = await cursor.toArray();
      res.send(blogs);
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
