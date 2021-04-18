const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const admin = require('firebase-admin');
require("dotenv").config();
const MongoClient = require("mongodb").MongoClient;

const uri = `mongodb+srv://${process.env.DB_User}:${process.env.DB_Pass}@cluster0.j3ujg.mongodb.net/${process.env.DB_Name}?retryWrites=true&w=majority`;

const app = express();
app.use(bodyParser.json());
app.use(cors());
app.use(express.static("stylist"));
app.use(fileUpload());

const serviceAccount = require("./barber-7fda9-firebase-adminsdk-pbppi-f2f63161cb.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const port = 5000;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
client.connect((err) => {
  const serviceCollection = client.db("barbers").collection("addService");
  const adminCollection = client.db("barbers").collection("addAdmin");
  const stylistsCollection = client.db("barbers").collection("addStylists");
  const checkOutCollection = client.db("barbers").collection("checkOut");
  const reviewCollection = client.db("barbers").collection("addReview");
  const paymentCollection = client.db("barbers").collection("addPayment");

  //Add Admin
  app.post("/addAdmin", (req, res) => {
    const newAdmin = req.body;
    adminCollection.insertOne(newAdmin).then((result) => {
      res.send(result.insertedCount > 0);
    });
  });


  //Check Admin or not
  app.post('/isAdmin', (req, res) => {
    const email = req.body.email;
    adminCollection.find({ email: email })
      .toArray((err, doctors) => {
        res.send(doctors.length > 0);
      })
  })

  //Add Service
  app.post("/addAService", (req, res) => {
    const file = req.files.file;
    const name = req.body.name;
    const price = req.body.price;
    const newImg = file.data;
    const encImg = newImg.toString("base64");

    var image = {
      contentType: file.mimetype,
      size: file.size,
      img: Buffer.from(encImg, "base64"),
    };

    serviceCollection.insertOne({ name, price, image }).then((result) => {
      res.send(result.insertedCount > 0);
    });
  });

  //Get Service
  app.get("/service", (req, res) => {
    serviceCollection.find({}).toArray((err, documents) => {
      res.send(documents);
    });
  });

  //Add Bookings
  app.post("/addBooking", (req, res) => {
    const newBooking = req.body;
    checkOutCollection.insertOne(newBooking).then((result) => {
      res.send(result.insertedCount > 0);
    });
  });

  //Get All Booking (For Admin)
  app.get("/allBookings", (req, res) => {
    checkOutCollection.find({}).toArray((err, documents) => {
      res.send(documents);
    });
  });

  //Get specific user bookings
  app.get('/bookings', (req, res) => {
    const bearer = req.headers.authorization;
    if (bearer && bearer.startsWith('Bearer ')) {
      const idToken = bearer.split(' ')[1];

      admin
        .auth()
        .verifyIdToken(idToken)
        .then((decodedToken) => {
          const tokenEmail = decodedToken.email;
          const queryEmail = req.query.email;
          if (tokenEmail == queryEmail) {
            checkOutCollection.find({ email: queryEmail })
              .toArray((err, documents) => {
                res.status(200).send(documents);
              })
          }
          else {
            res.status(401).send("unauthorized access");
          }
        })
        .catch((error) => {
          res.status(401).send("unauthorized access");
        });
    }
    else {
      res.status(401).send("unauthorized access");
    }
  })

  //Add Stylists
  app.post("/addAStylist", (req, res) => {
    const file = req.files.file;
    const name = req.body.name;
    const role = req.body.role;
    const email = req.body.email;
    const newImg = file.data;
    const encImg = newImg.toString("base64");

    var image = {
      contentType: file.mimetype,
      size: file.size,
      img: Buffer.from(encImg, "base64"),
    };

    stylistsCollection
      .insertOne({ name, role, email, image })
      .then((result) => {
        res.send(result.insertedCount > 0);
      });
  });



  //Get Stylists
  app.get("/stylists", (req, res) => {
    stylistsCollection.find({}).toArray((err, documents) => {
      res.send(documents);
    });
  });


  // //Add Review
  app.post("/addReview", (req, res) => {
    const newAdmin = req.body;
    reviewCollection.insertOne(newAdmin).then((result) => {
      res.send(result.insertedCount > 0);
    });
  });

  //Get Review (Display in UI)
  app.get("/allReview", (req, res) => {
    reviewCollection.find().toArray((err, documents) => {
      res.send(documents);
    });
  });

   // //Add Payment
   app.post("/addPayment", (req, res) => {
    const newPayment = req.body;
    paymentCollection.insertOne(newPayment).then((result) => {
      res.send(result.insertedCount > 0);
    });
  });


});


app.listen(process.env.PORT || port);
