const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

// middleware
app.use(cors());
app.use(express.json())


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

        app.get('/gpu/:id', async (req, res) => {
            const id = req.params.id;
            const result = await gpuCollection.findOne({ _id: ObjectId(id) });
            res.send(result);
        })

        app.delete('/gpu/:id', async (req, res) => {
            const id = req.params.id;
            const result = await gpuCollection.deleteOne({ _id: ObjectId(id) });
            res.send(result)
        })

        app.put('/restock/:id', async (req, res) => {
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

        app.put('/deliver/:id', async (req, res) => {
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