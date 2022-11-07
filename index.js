const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;

//middle ware
app.use(cors());
app.use(express.json());

//primary step
app.get('/', (req, res) => {
    res.send('server is running')
});

app.listen(port, (req, res) =>{
    console.log(`server is running on port ${port}`);
})