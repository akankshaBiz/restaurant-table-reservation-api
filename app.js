var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose =  require('mongoose');
var methodOverride = require('method-override');
var Schema = mongoose.Schema;
var app = express();
mongoose.connect('mongodb://akku:akkujiggu@jello.modulusmongo.net:27017/vEtixy8r');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(methodOverride());

var restaurantSchema = new mongoose.Schema({
        name: String,
        address: {
            locality: String,
            city: String,
            zipCode: String
        },
    location: String,
        tableCount: Number,
        availableSeat: Number,
        openTime: Date,
        closeTime: Date,
    reviews : [{ type: String}],
    bookings : [{ type: String}],
    cuisines : [{ type: String}],
    tables: [{ type: String}]
});
restaurantSchema.methods.setCuisines = function(list){
    console.log( "rest id is >> ", list);
    this.cuisines.push(list);
    this.save(function (error) {
        if (error)
            console.log( "Could not create cuisines");
    })
};

restaurantSchema.methods.setReview = function(review){
    console.log( "review id is >> ", review);
    this.reviews.push(review);
    this.save(function (error) {
        if (error)
            console.log( "Could not create reviews");
    })
};
restaurantSchema.methods.setBookings = function(booking){
    console.log( "booking id is >> ", booking);
    this.bookings.push(booking);
    this.save(function (error) {
        if (error)
            console.log( "Could not create booking");
    })
};
restaurantSchema.methods.setTable = function(table){
    console.log( "table id is >> ", table);
    this.tables.push(table);
    this.save(function (error) {
        if (error)
            console.log( "Could not create table");
    })
};
var reviewSchema = new mongoose.Schema({
    userId: String,
    username: String,
    restId: String,
    review: String,
    rating: Number
});
var bookingsSchema = new mongoose.Schema({
    userId: String,
    username: String,
    restId: String,
    tableID: String,
    Status: String,
    timeIn: Date,
    timeOut: Date
});
bookingsSchema.methods.confirmBooking = function(restId, tableID, status){
    console.log( "confirm booking ");
    this.restId = restId;
    this.status = status;
    this.tableID = tableID;
    this.save(function (error) {
        if (error)
            console.log( "Could not update booking");
    })
};
var tableSchema = new mongoose.Schema({
    capacity: Number,
    availability: Boolean,
    restId: String,
    tableStatus: String
});
tableSchema.methods.setCapacity = function(capacity){
    console.log( "capacity is >> ", capacity);
    this.capacity = capacity;
    this.save(function (error) {
        if (error)
            console.log( "Could not update capacity");
    })
};
tableSchema.methods.setAvailability = function(availability){
    console.log( "availability is >> ", availability);
    this.availability = availability;
    this.save(function (error) {
        if (error)
            console.log( "Could not update availability");
    })
};
tableSchema.methods.changeStatus = function(status){
    console.log( "change status ");
    this.tableStatus = status;
    this.save(function (error) {
        if (error)
            console.log( "Could not update status");
    })
};
var cuisineSchema = new mongoose.Schema({
    label: String,
    restId: [{type: String}]
});
cuisineSchema.methods.setCuisineRestID = function(restID){
    this.restId.push(restID);
    this.save(function (error) {
        if (error)
            console.log( "Could not add rest id");
    })
};
var restaurant = mongoose.model('restaurantCollection', restaurantSchema);
var review = mongoose.model('reviewCollection', reviewSchema);
var booking = mongoose.model('bookingCollection', bookingsSchema);
var cuisine = mongoose.model('cuisineCollection', cuisineSchema);
var tables = mongoose.model('tableCollection', tableSchema);


var searchByCuisine = function(keyword, loc){
    console.log( "keyword is >> ", keyword);
    var resultArr = [];
    cuisine.findOne({label: keyword}, function (err, result) {
       // console.log("rest ids : ",result);
        if(result==null)
            return undefined;
        else{
            result.restId.forEach(function (obj) {
                if(loc == undefined)
                    restaurant.findOne({_id: obj}, function (err, out) {
                        resultArr.push(out);
                    });
                else
                    restaurant.findOne({$and: [{"_id": obj},{"location": loc}]}, function (err, out) {
                        resultArr.push(out);
                    });
            });
        }

    });
    return resultArr;
};

var searchByName = function(keyword, loc, res){
    console.log( "keyword is >> ", keyword);
    var resultArr = [];
    if(loc == undefined) {
        //console.log("hii");
        restaurant.findOne({name: keyword}, function (err, out) {
            if(err)
                console.log(err);
            console.log(out);
            // return out.toJSON();
            res.end(JSON.stringify(out));
        });
    }
    else {
        restaurant.findOne({$and: [{"name": keyword},{"location": loc}]}, function (err, out) {
            if(err)
                console.log(err);
            console.log("output>> ", out);
            // resultArr.push(out);
            return out.toJSON();
        });
    }
};
app.post('/fudo/newRestaurant', function (req, res) {
    console.log("new entry");
    var entry = {
        name: req.body.name,
        address:{
            locality: req.body.address.locality,
            city: req.body.address.city,
            zipCode: req.body.address.zipCode
        },
        location: req.body.address.locality,
        tableCount: req.body.tableCount,
        availableSeat: req.body.availableSeat,
        openTime: req.body.openTime,
        closeTime: req.body.closeTime,
    };
    //console.log("params: ", req.body);
    restaurant.create(entry, function (err, result) {
        if(err) {
            console.log("error creating entry", err);
            return "";
        }
        console.log('the restaurant is: ', result);

        res.json(result);
    });
});
app.post('/fudo/addCuisines', function (req, res) {
    var entry={
        label: req.body.name
    };
    restaurant.findOne({_id: req.body.restaurantID}, function (err, result) {
        cuisine.findOne({label: req.body.name}, function (err, food) {
            if(err){
                // res.json({data: '', status: 'not found'});
                console.log(err);
            }
            console.log(food);
            if (food== null) {
                console.log("adding new cuisine ",food);
                cuisine.create(entry, function (err, out) {
                    if(err) {
                        console.log("error saving new cuisine");
                        return "";
                    }
                    result.setCuisines(out._id);
                    out.setCuisineRestID(result._id);
                    console.log('the food is: ', out);
                    res.json(out);
                });
            }
            else if (food.label== req.body.name){
                console.log(">>>>>>"+food.label);
                result.setCuisines(food._id);
                food.setCuisineRestID(result._id);
                console.log('the food is: ', food);
                res.json(food);
            }
        });
    });
});

app.post('/fudo/deleteRestaurant', function (req, res) {
    restaurant.deleteOne({_id: req.params.restaurantID}, function (err, result) {
        if(err){
            return "error deleting";
        }
        else
            res.json(result);
    });
});

app.get('/fudo/findRestaurant', function (req, res) {
    console.log("searching..");
    restaurant.find({name: req.name}, function (err, result) {
        if(err){
            res.json({data: '', status: 'not found'});
        }
        if (result) {
            console.log("search result>> ",result);
            res.json(result);
        }
    });
});
app.post('/fudo/addTable', function (req, res) {
    console.log("new entry");
    var entry = {
        capacity: req.body.capacity,
        availability: req.body.availability,
        restId: req.body.restaurantID,
        tableStatus: req.body.tableStatus
    };
    tables.create(entry, function (err, result) {
        if(err) {
            console.log("error creating entry");
            return "";
        }
        console.log('the tables is: ', result);
        restaurant.findOne({_id: req.body.restaurantID}, function (err, out) {
            out.setTable(out._id);
        });
        res.json(result);
    });
});
app.post('/fudo/modifyTableCapacity', function (req, res) {
    console.log("new entry");
    var entry = req.body;
    tables.findOne({_id: entry.tableId}, function (err, result) {
        if(err) {
            console.log("error searching for entry");
            return "";
        }
        console.log('the table is: ', result);
        result.setCapacity(entry.capacity);
        res.json(result);
    });
});
app.post('/fudo/modifyTableAvailability', function (req, res) {
    console.log("new entry");
    var entry = req.body;
    tables.findOne({_id: entry.tableId}, function (err, result) {
        if(err) {
            console.log("error searching for entry");
            return "";
        }
        console.log('the tables is: ', result);
        result.setAvailability(entry.available);
        res.json(result);
    });
});
app.post('/fudo/deleteTable', function (req, res) {
    console.log("table to delete");
    tables.findOne(req.body.tableID, function (err, result) {
        if(err) {
            console.log("error deleting entry");
            return "";
        }
        console.log('the table deleted  is: ', result);
        res.json(result);
    });
});
app.post('/fudo/bookTable', function (req, res) {
    console.log("booking table ");
    var entry = {
        userId: req.body.userId,
        username: req.body.username,
        restId: req.body.restaurantID,
        startTime: req.body.startTime,
        endTime: req.body.endTime
    };
    tables.findOne({"capacity": {$gte: req.body.capacity}, "tableStatus": "open", "restId": req.body.restaurantID}, function (err, result) {
        if (err)
            console.log("error searching table", err);
        console.log("result searching table", result);
        if(result != null){
            booking.create(entry, function (err, out) {
                if (err)
                    console.log("error creating booking", err);
                restaurant.findOne({_id: req.body.restaurantID}, function (err, rest) {
                    if (err)
                        console.log("error searching restaurant name", err);
                    rest.setBookings(out._id);

                });
                out.confirmBooking(req.body.restaurantID, result._id, "booked");
                result.changeStatus("booked");
                res.json(out);
            });
        }
       else
           res.json("all tables already booked");
    });
});
app.post('/fudo/cancelBooking', function (req, res) {
        console.log("canceling booking for table ");
        var book = req.params.bookingID;
        booking.deleteOne({_id: book}, function (err, result) {
            if(err)
                console.log("error searching table");
            tables.findOne({_id: result.tableID}, function (err, out) {
                out.changeStatus("open");
            });
            res.json(result);
        });
});
app.get('/fudo/searchRestaurant', function (req, res) {
   var loc = req.query.location;
   var keyword = req.query.search;
   console.log("location >", req.query.location);
   var rest;
   var cuis;
   if(loc == undefined){
       console.log("location undefined");
       rest = searchByName(keyword, undefined, res);
       if(rest == undefined) {
           cuis = searchByCuisine(keyword, undefined);
       }
       console.log("rest >"+rest+" cuis> "+cuis);
   }
   else{
       rest = searchByName(keyword, loc);
       if(rest == undefined)
           cuis = searchByCuisine(keyword, loc);
   }
   if(rest != undefined)
       res.json(rest);
   else if(cuis != undefined)
       res.json(cuis);
   else
       res.json("no result found");
});
app.post('/fudo/newReview', function (req, res) {
    console.log("new entry");
    var entry = {
        username: req.body.username,
        userId: req.body.userId,
        restId: req.body.restaurantID,
        review: req.body.review,
        rating: req.body.rating
    };

    restaurant.findOne({_id: req.body.restaurantID}, function (err, result) {
        review.create(entry, function (err, out) {
            if(err) {
                console.log("error creating entry");
                return "";
            }
            console.log('the review is: ', out);
            result.setReview(out._id);
            res.json(out);
        });
    });
});
app.get('*',function (req, res) {
    console.log("landing page");

});
app.listen(8080);
console.log("listening on port 8080");