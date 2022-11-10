const express = require('express');
const cors = require('cors');
const app = express();
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const port = process.env.PORT || 5000;

//middle ware
app.use(cors());
app.use(express.json());

// console.log(process.env.DB_USER);
// console.log(process.env.DB_PASSWORD);


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.qlhnchw.mongodb.net/?retryWrites=true&w=majority`;
// console.log(uri);
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        const serviceCollection = client.db('TheMoments').collection('services');
        const reviewCollection = client.db('TheMoments').collection('reviews')

        // jwt token function
        function verifyJWT(req, res, next) {
            // console.log(req.headers.authorization);
            const authHeader = req.headers.authorization;

            if (!authHeader) {
                return res.status(401).send({ message: 'unauthorize access' })
            }

            const token = authHeader.split(' ')[1];

            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
                if (err) {
                    return res.status(403).send({ message: 'Forbidden access' })
                }
                req.decoded = decoded;
                next()
            })
        }

        //7. Get JWT Token
        app.post('/jwt', (req, res) => {
            const user = req.body;
            // console.log(user);
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '10h' });
            res.send({ token })
        })

        // 1.
        app.get('/home', async (req, res) => {
            const query = {};
            const cursor = serviceCollection.find(query);
            const services = await cursor.limit(3).toArray();
            res.send(services)
        })

        //2.
        app.get('/services', async (req, res) => {
            const query = {};
            const cursor = serviceCollection.find(query);
            const services = await cursor.toArray();
            res.send(services)
        })

        //3.specific id API
        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const service = await serviceCollection.findOne(query);
            res.send(service)
        })

        //4. review API
        app.post('/reviews', async (req, res) => {
            const review = req.body;
            const result = await reviewCollection.insertOne(review);
            res.send(result)
        })

        //5 get reviews
        app.get('/reviews', async (req, res) => {
            const name = req.query.email;
            let query = { name }
            const cursor = reviewCollection.find(query);
            const review = await cursor.toArray();
            res.send(review)
        })
        app.get('/review/:id', async (req, res) => {
            const id = req.params.id;
            let query = { _id: ObjectId(id) }
            const cursor = await reviewCollection.findOne(query);
            console.log(cursor);
            console.log(id);
            console.log(req.query);
            // const review = await cursor.toArray();
            res.send(cursor)
        })

        // my Reviews api
        app.get('/myReviews', verifyJWT, async (req, res) => {
            const decoded = req.decoded;
            console.log(decoded);

            if (decoded.email !== req.query.email) {
                res.status(403).send({ message: 'unauthorize access' })
            }
            let query = {}
            if (req.query.email) {
                query = {
                    email: req.query.email
                }
            }
            const cursor = reviewCollection.find(query);
            const review = await cursor.toArray();
            res.send(review)
        })

        app.put("/update/:id", verifyJWT, async (req, res) => {
            const id = req.params.id;
            const update = req.body.edt;
            const query = { _id: ObjectId(id) };
            const updatedDoc = {
                $set: {
                    message: update,
                },
            };
            const result = await reviewCollection.updateOne(query, updatedDoc);
            res.send(result);
        });

        //5. delete myReviews API
        app.delete('/myReviews/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await reviewCollection.deleteOne(query);
            res.send(result)
        })
        // add service api
        app.post("/myservice", async (req, res) => {
            const query = req.body;
            const result = await serviceCollection.insertOne(query);
            res.send(result);
        });

    } finally {

    }
}
run().catch(err => console.error(err));


//primary step
app.get('/', (req, res) => {
    res.send('server is running')
});

app.listen(port, (req, res) => {
    console.log(`server is running on port ${port}`);
})