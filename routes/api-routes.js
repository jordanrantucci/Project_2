// Requiring our models and passport as we've configured it
var db = require("../models");
var passport = require("../config/passport");
var _ = require('lodash');

module.exports = function(app) {
  // Using the passport.authenticate middleware with our local strategy.
  // If the user has valid login credentials, send them to the members page.
  // Otherwise the user will be sent an error
  app.post("/api/login", passport.authenticate("local"), function(req, res) {
    res.json(req.user);
  });

  // Route for signing up a user. The user's password is automatically hashed and stored securely thanks to
  // how we configured our Sequelize User Model. If the user is created successfully, proceed to log the user in,
  // otherwise send back an error
  // Added name 
  app.post("/api/signup", function(req, res) {
    

      db.User.create({
        email: req.body.email,
        password: req.body.password,
      })
        .then(function(createdUser) {
          res.redirect(307, "/api/login");
        })
        .catch(function(err) {
          res.status(401).json(err);
        });
    })


  // Route for logging user out
  app.get("/logout", function(req, res) {
    req.logout();
    res.redirect("/");
  });

  // Route for getting some data about our user to be used client side
  app.get("/api/user_data", function(req, res) {
    if (!req.user) {
      // The user is not logged in, send back an empty object
      res.json({});
    } else {
      // Otherwise send back the user's email and id
      // Sending back a password, even a hashed password, isn't a good idea
      res.json({
        email: req.user.email,
        id: req.user.id,
        trips_id: req.user.trips_id //this is a foreign key referencing the 'people' table
      });
    }
  });

  app.get("/api/trip", function(req, res) {
    db.trips.findOne({
      where: {id: req.user.trips_id}
    }).then(function(result) {
      res.json(result)
    }) 
  })

  app.post("/api/trip", function(req, res) {
    db.trips.create({
      trip_name: req.body.trip_name,
      attendees: req.body.attendeesBox,
      trip_info: req.body.tripInfoBox,
      route_name: req.body.trip_name.replace(/\s+/g, "").toLowerCase()
    }).then(function(createdTrip) {
      db.User.update({
        trips_id: createdTrip.id
      },
      {
        where: {id: req.user.id}
      })
      .then(function() {
        res.redirect("/mytrips");
      })
    })
  })

  app.put("/api/trip/:id", function(req, res) {
    db.trips.update(req.body,
      {
        where: {
          id: req.params.id
        }
      }
   ).then(function(data) {
     res.send("Updated trip!")
   }).catch((err) => {
     console.log(err)
   })
  })

  app.get("/api/trip/:trip", function (req, res) {
    db.trips.findOne({
      where: {
        id: req.params.trip.id
      }
    }).then(function() {
      res.json({
      id: req.params.trip.id,
      trip_name: req.trip.trip_name,
      route_name: req.trip.route_name,
      attendees: req.trip.attendees,
      trip_info: req.trip.trip_info
    })
  })
})

  app.delete('/api/trip/:id', (req, res) => {
    db.trips.destroy({
      where: {
        id: req.params.id,
      }
    }).then(function(){
      res.send("Trip deleted!")
    })
  })
  

  //----MESSAGEBOARD POSTS----
  app.get('/api/posts/:trips_id', (req, res) => {
    db.posts.findAll({
      where: {
        trips_id: req.params.trips_id
      }
    }).then(function(result) {
      const post = _.map(result,"dataValues")
      const postObj = { posts: post }
      res.json(postObj)
    })
  })

  app.get('/api/posts', (req, res) => {
    db.posts.findAll({
    }).then(function(result) {
      const post = _.map(result,"dataValues")
      const postObj = { posts: post }
      res.json(postObj)
    })
  })

  app.post("/api/posts/:id", (req, res) => {
    db.posts.create({
      body: req.body.body,
      trips_id: req.body.trips_id
    })
  })
}