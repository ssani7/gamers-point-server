const express = require('express');
const cors = require('cors');
require('dotenv').config();
var jwt = require('jsonwebtoken');
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

// middleware
app.use(cors());
app.use(express.json())

const verifyJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'Unauthorized access' })
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden Access' })
        }
        req.decoded = decoded;
        next();
    });
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qhrjd.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const run = async () => {
    try {
        await client.connect();
        const gpuCollection = client.db("gpuInventory").collection("gpu");

        app.get('/gpu', async (req, res) => {
            const cursor = gpuCollection.find({});
            const result = await cursor.toArray();
            res.send(result)
        })

        app.post('/login', (req, res) => {
            const user = req.body;
            const email = user.user.email;
            const accessToken = jwt.sign({ email: email },
                process.env.ACCESS_TOKEN,
                { expiresIn: '1h' }
            )
            res.send({ accessToken })
        })

        app.get('/gpu/:id', async (req, res) => {
            const id = req.params.id;
            const result = await gpuCollection.findOne({ _id: ObjectId(id) });
            res.send(result);
        })
        app.get('/mygpu/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;
            const cursor = gpuCollection.find({ email: email });
            const result = await cursor.toArray();
            res.send(result);
        })

        app.post('/gpu', verifyJWT, async (req, res) => {
            const product = req.body;
            const result = await gpuCollection.insertOne(product);
            res.send(result);
        })

        app.delete('/gpu/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const result = await gpuCollection.deleteOne({ _id: ObjectId(id) });
            res.send(result);
        })

        app.put('/restock/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const updatedGpu = req.body;
            const newGpu = {
                $set: {
                    quantity: updatedGpu.quantity
                }
            }
            const result = await gpuCollection.updateOne({ _id: ObjectId(id) }, newGpu, { upsert: true });
            res.send(result);

        })

        app.put('/deliver/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const updatedGpu = req.body;
            const newGpu = {
                $set: {
                    quantity: updatedGpu.quantity,
                    sold: updatedGpu.sold
                }
            }
            const result = await gpuCollection.updateOne({ _id: ObjectId(id) }, newGpu, { upsert: true });
            res.send(result);

        })
    }
    finally {

    }
}
run().catch(console.dir)

app.get('/', (req, res) => {
    res.send("server is running")
})

app.listen(port, () => {
    console.log("listening to port", port)
})