
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const flash = require('express-flash');
const crypto = require('crypto');
const db = require('./models/db');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
require('dotenv').config();
const app = express();
const port = 3000;

// Secret key for JWT
const jwtSecretKey = process.env.JWTSECRETKEY;
console.log(process.env.USER_NAME);
// Insert the user into the database with hashed password
/*
    // Hash the password
    var password = process.env.PASSWORD;
    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
            console.error('Error hashing password:', err);
            res.redirect('/');
        } else {
            db.query('INSERT INTO users (First_Name, Last_Name, Gender, Mobile_No, Email_ID, Role, User_Name, Password) VALUES (?,?,?,?,?,?,?,?) ',
                [process.env.FIRST_NAME, process.env.LAST_NAME, process.env.GENDER, process.env.MOBILE_NO, process.env.EMAIL, process.env.ROLE, process.env.USER_NAME, hashedPassword],
                (err, result) => {
                    if (err) {
                        console.error('Error inserting data into the database:', err);
                        
                    } else {
                        console.log('Data inserted into the database:', result);
                        console.log(process.env.USER_NAME);
                    }
                });
        }
    });
*/
const generateRandomSecret = () => {
        return crypto.randomBytes(64).toString('hex');
    };
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(express.json());
    app.use(express.static('images'));
    app.use(express.static('views'));
    app.use(session({
        secret: generateRandomSecret(), 
        resave: true, 
        saveUninitialized: true 
    }));
app.use(flash());

// Route to handle the root URL and redirect to the login page
app.get('/', (req, res) => {
    res.redirect('/login');
});


// Home Page route
app.get('/home', (req, res) => {
    res.sendFile(__dirname + '/views/homepage.html');
});

// About us Page route
app.get('/aboutus', (req, res) => {
    res.sendFile(__dirname + '/views/aboutus.html');
});

// Contact us Page route
app.get('/contactus', (req, res) => {
    res.sendFile(__dirname + '/views/contactus.html');
});

// Login route
app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/views/login.html');
});

// Login route
app.post('/login1', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    console.log('\nServer received login request');
    console.log('\nUsername:', username);
    console.log('Password:', password);

    // Check if the provided credentials are valid
    db.query('SELECT * FROM users WHERE User_Name = ?', [username], (err, results) => {
        if (err) {
            console.error('\nError querying database:', err);
            res.redirect('/');
        } else {
            if (results.length > 0) {
                const user = results[0];
                // Check if the password is hashed in the database
                if (user.Password.startsWith('$2b$')) {
                    // Password is already hashed, compare directly
                    console.log('Password is already hashed, compare directly');
                    bcrypt.compare(password, user.Password, (err, bcryptResult) => {
                        if (err) {
                            console.error('Error comparing passwords:', err);
                            res.redirect('/');
                        } else {
                            if (bcryptResult) {
                                // Passwords match, create JWT token
                                console.log('Passwords match, create JWT token');
                                const token = jwt.sign({ username: username }, jwtSecretKey, { expiresIn: '1h' });
                                req.session.token = token;
                                req.session.user = user; // Set the session user object
                                res.redirect('/user');
                            } else {
                                // Passwords don't match
                                req.flash('error', 'Invalid username or password');
                                res.redirect('/login');
                            }
                        }
                    });
                } else {

                    // Password is not hashed, hash it and compare
                    console.log('Password is not hashed, hash it and compare');
                    bcrypt.compare(password, user.Password, (err, bcryptResult) => {
                        if (err) {
                            console.error('Error comparing passwords:', err);
                            res.redirect('/');
                        } else {
                            if (bcryptResult) {
                                // Passwords match, create JWT token
                                console.log('Passwords match, create JWT token');
                                const token = jwt.sign({ username: username }, jwtSecretKey, { expiresIn: '1h' });
                                req.session.token = token;
                                req.session.user = user; // Set the session user object
                                res.redirect('/user');
                            } else {
                                // Passwords don't match
                                req.flash('error', 'Invalid username or password');
                                res.redirect('/login');
                            }
                        }
                    });
                }
            } else {
                req.flash('error', 'Invalid username or password');
                res.redirect('/login');
            }
        }
    });
});

// Middleware to check JWT token
const checkToken = (req, res, next) => {
    const token = req.session.token;
    if (token) {
        jwt.verify(token, jwtSecretKey, (err, decoded) => {
            if (err) {
                console.error('Error verifying JWT token:', err);
                res.redirect('/login');
            } else {
                req.decoded = decoded;
                next();
            }
        });
    } else {
        res.redirect('/login');
    }
};

// Admin dashboard route
app.get('/admin', (req, res) => {
    // Check if the user is authenticated (check session)
    if (req.session.user && req.session.user.Role === 'admin') {
        // Render admin dashboard with user list
        console.log(" User is authenticated as an admin!");
        res.sendFile(__dirname + '/views/admin-dashboard1.html');
    } else {
        // User is not authenticated or not an admin, redirect to login page
        console.log("\n User is not authenticated or not an admin!");
        res.redirect('/login');
    }
});

// User dashboard route
app.get('/user', (req, res) => {
    // Check if the user is authenticated (check session)
    if (req.session.user && req.session.user.Role !== 'admin') {
        console.log(req.session.user.First_Name);
        console.log(req.session.user.Last_Name);
        console.log(" User is authenticated as an user!");
        res.sendFile(__dirname + '/views/user-dashboard.html');
    } 
    else if (req.session.user && req.session.user.Role === 'admin') {
        console.log(req.session.user.First_Name);
        console.log(req.session.user.Last_Name);
        console.log(" User is authenticated as an admin!");
        res.sendFile(__dirname + '/views/admin-dashboard1.html');
    }
    else {
        // User is not authenticated or is an admin, redirect to login page
        console.log("\n User is not authenticated or not an admin!");
        res.redirect('/');
    }
});

app.get('/getuser',(req,res) =>{

    if(req.session.user){

        res.json({
            firstname : req.session.user.First_Name,
            lastname : req.session.user.Last_Name,
            gender : req.session.user.Gender,
            mobile : req.session.user.Mobile_No,
            email : req.session.user.Email_ID

        });
    }
    else {
        // User is not authenticated
        res.status(401).json({ error: 'Not authenticated' });
    }
});

// Logout route
app.post('/logout', (req, res) => {
    // Clear the session
    req.session.destroy(err => {
        if (err) {
            console.error('Logout error:', err);
        } else {
            console.log('\n User logged out');
        }
        // Send a response to the client
        res.send();
    });
});




// Admin Dashboard - Handle Create User form submission
app.post('/createUser', (req, res) => {
    const userData = req.body;
    console.log('\n Recently Created User Information : ',userData);
    // Hash the password
    bcrypt.hash(userData.password, 10, (err, hashedPassword) => {
        if (err) {
            console.error('Error hashing password:', err);
            res.redirect('/');
        } else {
            db.query('INSERT INTO users (First_Name, Last_Name, Gender, Mobile_No, Email_ID, Role, User_Name, Password) VALUES (?,?,?,?,?,?,?,?) ',
                [userData.firstName, userData.lastName, userData.gender, userData.mobile, userData.email, userData.role, userData.username, hashedPassword],
                (err, result) => {
                    if (err) {
                        console.error('Error inserting data into the database:', err);
                        res.redirect('/');
                    } else {
                        console.log('Data inserted into the database:', result);
                        res.redirect('/admin');
                    }
                });
        }
    });
});


// Add New Bus Route API
app.post('/addBusRoute', (req, res)=>{
    const routeData = req.body;
    console.log("\n New Route Data : ", routeData);
    db.query('INSERT INTO bus_route (Source_city, Source_state, Destination_city, Destination_state, Fare_adult, Fare_child, Journey_duration, Departure_time) VALUES (?,?,?,?,?,?,?,?)',
    [routeData.sourceCity, routeData.sourceState, routeData.destinationCity, routeData.destinationState, routeData.adultPersonFare, routeData.childPersonFare, routeData.journeyDuration, routeData.departureTime],
    (err, result) => {
        if (err) {
            console.error('Error inserting New Route data into the database:', err);
            res.redirect('/');
        } else {
            console.log('New Route Data inserted into the database:', result);
            res.redirect('/admin');
        }
    });
});

function sendAcknowledgmentEmail(email, firstName, lastName, username, password) {
    return new Promise((resolve, reject) => {

        // here i am Creating an Nodemailer transporter
        const transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            service: 'gmail',
            auth: {
                user: 'adelbert.jaskolski9@ethereal.email', // sender's mail id 
                pass: 'u7QJj7bq2ck84vu1ca' 
            }
        });

        // Email content with HTML template
        const mailOptions = {
            from: 'adelbert.jaskolski9@ethereal.email', // Replace with your Gmail email
            to: email,
            subject: 'Invite to the Gradious LMS Platform',
            html: `
            <html>
            <head>
                <link href='https://fonts.googleapis.com/css?family=DM Sans' rel='stylesheet'>
                <link rel="preconnect" href="https://fonts.googleapis.com">
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                <link href="https://fonts.googleapis.com/css2?family=Source+Sans+3&display=swap" rel="stylesheet">
                <style>
                    body {
                        
                        font-family: 'Source Sans 3', sans-serif;
                    }
                    hr{
                        width : 106.6%;
                        margin : -20 -21px;
                        border : 1.6px solid #FA7B00;
                    }
                    .container {
                        max-width: 600px;
                        margin: auto;
                        padding: 20px;
                        background-color: white;
                        border-radius: 0px;
                        border : 2px solid #F1F4F7;;
                    }
                    img {
                        max-width: 7%;
                        max-height: 7%;
                        cursor: pointer;
                        margin-top : 70px;
                    }
        
                    h3{
                        margin-top: -39px;
                        margin-right: -40px; 
                        margin-left: 50px;
                        font-size: 22.5px;
                        font-family: 'DM Sans', sans-serif;
                    }
        
                    #hi{
                        color : #262728;
                        margin-top :40px;
                        font-size: 17px; 
                    }
        
                    #kindly, #note , #wishes{
                        color : #757779;
                        font-size: 16px; 
                    }
        
                    p{
                        color : #262728;
                        font-size: 17px; 
                    }
        
                    button{
                        background-color: #FA7B00;
                        color: white;
                        border: none;
                        padding: 10px;
                        margin-bottom: 10px;
                        cursor: pointer;
                        text-align: center;
                        width: 20%;
                        border-radius: 7px;
                        font-size: 17px;
                        font-weight: bold;
                    }
        
                    #footer{
                        background-color: #F1F4F7;
                        text-align: center;
                        width : 105.7%;
                        margin-left : -20px;
                        margin-bottom : -20px;
                        padding: 3px;
                    }
        
                    #copyrights{
                        font-size: 15px;
                        color : #757779;
                    }
                    
                    a{
                        color : white;
                        text-decoration : none;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <hr>
                    <img src="../images/Gradious-logo1.png" alt="Gradious ">
                    <h3>Gradious</h3>
                    <p id="hi">Hi ${firstName} ${lastName},</p>
                    <p>
                       <b>Congratulations!</b> We are thrilled to inform you that your user account has been successfully created on the <b>Gradious Learning Management System (LMS) Platform</b> and 
                       We are very glad to invite you to share the joy of learning and educating with Gradious.
                    </p>
                    <p>
                        This email contains your login credentials, as well as an important note regarding your account's privacy and security.
                    </p>
                    <p>
                        Please find below your login credentials:
                    </p>
                    <p>
                        <strong>Username : ${username} </strong>
                        <br>
                        <strong>Password : ${password} </strong>
                    </p>
                    <p id ="kindly"> Kindly click on the button below to access LMS platform. </p>
        
                    <button><a href="https://localhost:3000/login">Login</a></button>
                    <p id="note"> 
                        Note - Kindly do not share your login credentials with anyone. Doing so will leave your account vulnerable to unauthorized access and will compromise its security. 
                        Your privacy is our top priority, and we have taken all measures to ensure the confidentiality of your account and the information you share on the platform.
                    </p>
                    <p><span id="wishes">Best wishes,</span><br><b> Gradious Technologies</b></p>
        
                    <div id="footer">
                        <p id="copyrights"> &copy; 2023, Gradious Technologies Pvt.Ltd.<br> All rights reserved</p>
                    </div>
                </div>
            </body>
        
        </html>
            `
        };

        // Sending an email
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error:', error);
            } else {
                console.log('Email sent:', info.response);
            }
        });
    });
}


app.get('/getUsers', (req, res) => {
    db.query('SELECT * FROM users WHERE Role != "admin"', (err, result) => {
        if (err) {
            console.error('Error fetching users from the database:', err);
            res.status(500).json({ error: 'Internal Server Error' });
        } else {
            res.json(result);
            console.log(result);
        }
    });
});



app.delete('/deleteUser/:id', (req, res) => {
    const userId = req.params.id;
    console.log("\n req.params.id: ", req.params.id);
    console.log("\n user id : ", userId);

    db.query('DELETE FROM users WHERE ID = ?', [userId], (err, result) => {
        if (err) {
            console.error('Error deleting user:', err);
            res.status(500).send('Error deleting user');
        } else {
            console.log('User deleted successfully');
            res.status(200).send('User deleted successfully');
        }
    });
});

// Update the updateUser route to handle the PUT request for updating users
app.put('/updateUser/:id', (req, res) => {
    console.log("\n admin-dashboard user information for updating : ",req.body);
    console.log("\n req.pramas.id : ",req.params.id);
    console.log("\n Type : ",typeof(req.params.id));
    const userId = parseInt(req.params.id,10);
    console.log("userId : ",userId);
    console.log("\n Type : ",userId);
    const updatedUserData = req.body;

    console.log("\n Mobile number : ",updatedUserData.Mobile_No);
    db.query('UPDATE users SET First_Name = ?, Last_Name = ?, Gender = ?, Mobile_No = ?, Email_ID = ?, User_Name = ?, Password = ? WHERE ID =?',
    [updatedUserData.First_Name,updatedUserData.Last_Name, updatedUserData.Gender, updatedUserData.Mobile_No,updatedUserData.Email_ID, updatedUserData.User_Name,updatedUserData.Password, userId],
    (err, result) =>{

        if (err) {
            console.error('Error updating user in the database:', err);
            res.status(500).json({ error: 'Internal Server Error' });
        } else {
            res.json({ success: true });
        }
    });
});

app.put('/updateTicketBookingDetails/:id', (req , res)=>{

    const bookingId = req.params.id;
    const updatedbookingdetails = req.body;

    db.query('UPDATE ticket_booking SET Customer_Name = ?, Booking_Date = ?, Booking_Time = ?, Duration_Minutes = ? WHERE ID =?',
    [updatedbookingdetails.Customer_Name,updatedbookingdetails.Booking_Date, updatedbookingdetails.Booking_Time, updatedbookingdetails.Duration_Minutes, bookingId],
    (err, result) =>{

        if (err) {
            console.error('Error updating book in the database:', err);
            res.status(500).json({ error: 'Internal Server Error' });
        } else {
            res.json({ success: true });
        }
    });
});
// routes for User Dashbaords
// User Dashboard - Handle Book Ticket form submission

app.post("/bookTicket", (req,res)=>{


    const bookingData = req.body;
    const defaultstatus = 'pending';
    console.log("\n Req.body of ticket booking -  ",req.body);
    parsed_duration_minutes = parseInt(bookingData.duration_minutes, 10)
    console.log("\n parsed_duration_minutes : ",parsed_duration_minutes);

    db.query('INSERT INTO ticket_booking ( Full_Name, Gender, Mobile_No, Email_ID, Customer_Name, Booking_Date, Booking_Time, Total_Amount, Status, Payment_Method, Duration_Minutes, Source_City, Destination_City, Passenger_Age, Passenger_Gender, Passenger_Email) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ',
    [req.session.user.First_Name +" "+req.session.user.Last_Name, req.session.user.Gender, req.session.user.Mobile_No, req.session.user.Email_ID,
      bookingData.customer_name,bookingData.booking_date,bookingData.booking_time,bookingData.total_amount,defaultstatus, bookingData.payment_method, parsed_duration_minutes, 
      bookingData.source_city, bookingData.destination_city, bookingData.age, bookingData.gender, bookingData.email],
    (err, result) => {
        if (err) {
            console.error('Error inserting data into the database:', err);
            res.redirect('/'); 
        } else {
            console.log('Data inserted into the database:', result);
            
            // Also redirecting to an admin page after an the data is successfully stored into an database and user is created 
            res.redirect('/user');
                    
        }
    });
});

// route for displaying the booking history of respective particualr user
app.get('/bookingHistory', (req, res) => {
    const id = req.session.user.ID;
    const firstName = req.session.user.First_Name; 
    const lastName = req.session.user.Last_Name; 
    const fullName  = firstName +" "+ lastName;
    const gender = req.session.user.Gender;
    const mobile_no = req.session.user.Mobile_No;
    const email_id = req.session.user.Email_ID;

    // Assuming your user object has an 'id' property
    // Replace the query with the appropriate query to retrieve booking history for the user
    db.query('SELECT ID,Customer_Name, Booking_Date, Booking_Time, Total_Amount, Status, Payment_Method, Duration_Minutes, Source_City, Destination_City, Passenger_Age, Passenger_Gender  FROM ticket_booking WHERE Full_Name = ? and Gender = ? and Mobile_No = ? and Email_ID = ? and Status != "pending" ORDER BY ID DESC ', [fullName,gender,mobile_no,email_id], (err, results) => {
        if (err) {
            console.error('Error fetching booking history:', err);
            res.status(500).json({ error: 'Internal Server Error' });
        } else {
            res.json(results);
        }
    });
});

// route for displaying the pending bookings of respective particualr user
app.get('/getPendingBookings', (req, res) => {
    const firstName = req.session.user.First_Name; 
    const lastName = req.session.user.Last_Name; 
    const fullName  = firstName +" "+ lastName;
    const gender = req.session.user.Gender;
    const mobile_no = req.session.user.Mobile_No;
    const email_id = req.session.user.Email_ID;

    // Assuming your user object has an 'id' property
    // Replace the query with the appropriate query to retrieve booking history for the user
    db.query('SELECT ID, Customer_Name, Booking_Date, Booking_Time, Total_Amount, Status, Payment_Method, Duration_Minutes, Source_City, Destination_City FROM ticket_booking WHERE Full_Name = ? and Gender = ? and Mobile_No = ? and Email_ID = ? and Status = "pending" ', [fullName,gender,mobile_no,email_id], (err, results) => {
        if (err) {
            console.error('Error fetching booking history:', err);
            res.status(500).json({ error: 'Internal Server Error' });
        } else {
            res.json(results);
            console.log(results);
        }
    });
});


// route for displaying the pending bookings of respective particualr user
app.get('/getBookingRequest', (req, res) => {


    // Assuming your user object has an 'id' property
    // Replace the query with the appropriate query to retrieve booking history for the user
    db.query('SELECT Full_Name, ID, Customer_Name, Booking_Date, Booking_Time, Total_Amount, Status, Payment_Method, Duration_Minutes, Source_City, Destination_City  FROM ticket_booking WHERE Status = "pending" ', (err, results) => {
        if (err) {
            console.error('Error fetching booking history:', err);
            res.status(500).json({ error: 'Internal Server Error' });
        } else {
            res.json(results);
            console.log(results);
        }
    });
});

// route for displaying the pending bookings grouped by Full_Name
app.get('/getBookingRequestGrouped', (req, res) => {
    // Assuming your user object has an 'id' property
    // Replace the query with the appropriate query to retrieve booking history for the user
    db.query('SELECT Full_Name, ID, Customer_Name, Booking_Date, Booking_Time, Total_Amount, Status, Payment_Method, Duration_Minutes, Source_City, Destination_City FROM ticket_booking WHERE Status = "pending" ', (err, results) => {
        if (err) {
            console.error('Error fetching booking history:', err);
            res.status(500).json({ error: 'Internal Server Error' });
        } else {
            // Group the results by Full_Name
            const groupedResults = results.reduce((acc, booking) => {
                const fullName = booking.Full_Name;
                if (!acc[fullName]) {
                    acc[fullName] = [];
                }
                acc[fullName].push(booking);
                return acc;
            }, {});

            res.json(groupedResults);
            console.log(groupedResults);
        }
    });
});

// route for displaying the Confirmed/Rejected bookings grouped by Full_Name
app.get('/getRequestsHistoryGrouped', (req, res) => {
    // Assuming your user object has an 'id' property
    // Replace the query with the appropriate query to retrieve booking history for the user
    db.query('SELECT Full_Name, ID, Customer_Name, Booking_Date, Booking_Time, Total_Amount, Status, Payment_Method, Duration_Minutes, Source_City, Destination_City FROM ticket_booking WHERE Status = "confirmed" or Status = "rejected" ', (err, results) => {
        if (err) {
            console.error('Error fetching booking history:', err);
            res.status(500).json({ error: 'Internal Server Error' });
        } else {
            // Group the results by Full_Name
            const groupedResults = results.reduce((acc, booking) => {
                const fullName = booking.Full_Name;
                if (!acc[fullName]) {
                    acc[fullName] = [];
                }
                acc[fullName].push(booking);
                return acc;
            }, {});

            res.json(groupedResults);
            console.log(groupedResults);
        }
    });
});


// Route for approving a booking request
app.post('/approveBooking/:bookingId', (req, res) => {
    const bookingId = req.params.bookingId;

    // Perform an update query to set the status to 'confirmed' for the specified bookingId
    db.query('UPDATE ticket_booking SET Status = "confirmed" WHERE ID = ?', [bookingId], (err, result) => {
        if (err) {
            console.error('Error approving booking:', err);
            res.status(500).json({ error: 'Internal Server Error' });
        } else {
            res.json({ success: true });
        }
    });
});

// Route for rejecting a booking request
app.post('/rejectBooking/:bookingId', (req, res) => {
    const bookingId = req.params.bookingId;

    // Perform an update query to set the status to 'rejected' for the specified bookingId
    db.query('UPDATE ticket_booking SET Status = "rejected" WHERE ID = ?', [bookingId], (err, result) => {
        if (err) {
            console.error('Error rejecting booking:', err);
            res.status(500).json({ error: 'Internal Server Error' });
        } else {
            res.json({ success: true });
        }
    });
});

// route to cancel the ticket booking 

app.delete('/cancelTicketBooking/:id', (req , res)=> {

    const bookingId = req.params.id;
    console.log("\n Server side booking_id : ",bookingId);

    db.query('DELETE FROM ticket_booking WHERE ID = ?', [bookingId], (err,result)=>{

        if (err) {
            console.error('Error deleting book from the database:', err);
            res.status(500).json({ error: 'Internal Server Error' });
        } else {
            console.log('User deleted successfully');
            res.status(200).send('User deleted successfully');
        }
    });
});


// route to update the ticket booking details 
app.put('/updateTicketBookingDetails/:id', (req , res)=>{

    const bookingId = req.params.id;
    const updatedbookingdetails = req.body;

    db.query('UPDATE ticket_booking SET Customer_Name = ?, Booking_Date = ?, Booking_Time = ?, Duration_Minutes = ? WHERE ID =?',
    [updatedbookingdetails.Customer_Name,updatedbookingdetails.Booking_Date, updatedbookingdetails.Booking_Time, updatedbookingdetails.Duration_Minutes, bookingId],
    (err, result) =>{

        if (err) {
            console.error('Error updating book in the database:', err);
            res.status(500).json({ error: 'Internal Server Error' });
        } else {
            res.json({ success: true });
        }
    });
});

// Endpoint to fetch source cities
app.get('/getSourceCities', (req, res) => {
    db.query('SELECT DISTINCT Source_city FROM bus_route ORDER BY Source_city ASC', (err, results) => {
        if (err) {
            console.error('Error fetching source cities:', err);
            res.status(500).json({ error: 'Error fetching source cities' });
            return;
        }
        const sourceCities = results.map(result => ({ label: result.Source_city, value: result.Source_city }));
        res.json(sourceCities);
    });
});

// Endpoint to fetch destination cities
app.get('/getDestinationCities', (req, res) => {
    db.query('SELECT DISTINCT Destination_city FROM bus_route ORDER BY Destination_city ASC', (err, results) => {
        if (err) {
            console.error('Error fetching destination cities:', err);
            res.status(500).json({ error: 'Error fetching destination cities' });
            return;
        }
        const destinationCities = results.map(result => ({ label: result.Destination_city, value: result.Destination_city }));
        res.json(destinationCities);
    });
});

// Endpoint to fetch route data based on source and destination cities
app.get('/getRouteData', (req, res) => {
    const sourceCity = req.query.source;
    const destinationCity = req.query.destination;
    db.query('SELECT * FROM bus_route WHERE Source_city = ? AND Destination_city = ?', [sourceCity, destinationCity], (err, results) => {
        if (err) {
            console.error('Error fetching route data:', err);
            res.status(500).json({ error: 'Error fetching route data' });
            return;
        }
        if (results.length === 0) {
            res.status(404).json({ error: 'Route not found' });
            return;
        }
        const routeData = results[0]; // Assuming there's only one route between source and destination
        res.json({
            duration: routeData.Journey_duration,
            adultFare: routeData.Fare_adult,
            childFare: routeData.Fare_child,
            departureTime: routeData.Departure_time
        });
    });
});
app.listen(port , () =>{
    console.log(`\n Server is running on port ${port}`);
})