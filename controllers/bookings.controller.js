const mongoose = require('mongoose');
const Booking = require('../models/booking');
const Car = require('../models/car');
const { parse, format, differenceInHours } = require('date-fns');
const nodemailer = require("nodemailer");

 

const addBooking = async (req, res) => {
    try {
        const {
            carId,
            clientId,
            startDate,
            endDate,
            firstName,
            lastName,
            dateOfBirth,
            email,
            phone,
            drivingLicense,
            address,
            city,
            zipCode,
            country,
            extras
        } = req.body;


        const pipeline = [
            {
              $lookup: {
                from: "bookings",
                let: { carId: "$_id" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ["$carId", "$$carId"] },
                          { $lte: ["$startDate", new Date(new Date(endDate).setHours(new Date(endDate).getHours() + 1))] },
                          { $gte: ["$endDate", new Date(new Date(startDate).setHours(new Date(startDate).getHours() + 1))] },
                          { $in: ["$status", ["confirmed", "waiting"]] } 
                        ]
                      }
                    }
                  }
                ],
                as: "bookings"
              }
            },
            {
              $match: {
                active: true
              }
            },
            {
              $group: {
                _id: "$_id",
                count: { $sum: { $size: "$bookings" } },
                car_info: { $first: "$$ROOT" }
              }
            },
            {
              $lookup: {
                from: "makes",
                localField: "car_info.make_id",
                foreignField: "_id",
                as: "make_info"
              }
            },
            {
              $unwind: "$make_info"
            },
            {
              $project: {
                _id: "$car_info._id",
                title: "$car_info.title",
                price: "$car_info.price",
                reservationCount: "$count",
                quantity: "$car_info.quantity"
              }
            },
            {
              $match: {
                $expr: {
                  $gt: ["$quantity", "$reservationCount"]
                }
              }
            },
            {
              $match: {
                _id: new mongoose.Types.ObjectId(carId)
              }
            }
          ]

        const car = await Car.aggregate(pipeline);

        if(car.length > 0) {

            const startDateTime = parse(`${startDate}`, 'yyyy-MM-dd HH:mm', new Date());
            const endDateTime = parse(`${endDate}`, 'yyyy-MM-dd HH:mm', new Date());
            const hoursDifference = differenceInHours(endDateTime, startDateTime);
            const daysDifference = Math.ceil(hoursDifference / 24);
            let extrasPrice = 0;

            if(extras.extraDriver) extrasPrice += 100
            if(extras.insurance) extrasPrice += 50
            if(extras.assistance) extrasPrice += 50
            if(extras.navigation) extrasPrice += 10
            if(extras.wifi) extrasPrice += 20
            if(extras.childSeat) extrasPrice += 20

            const rentalPrice = daysDifference * car[0].price;
            const totalPrice = rentalPrice + extrasPrice;

            const newBooking = new Booking({
                carId,
                clientId,
                totalPrice,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                firstName,
                lastName,
                dateOfBirth,
                email,
                phone,
                drivingLicense,
                address,
                city,
                zipCode,
                country,
                rentalPrice,
                extrasPrice,
                extras,
            });

            const savedBooking = await newBooking.save();

            const transporter = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: "rentalcarbusinesscontact@gmail.com",
                    pass: "fuujddkbargfivkk",
                },
            });

            const mailOptions = {
                from: "rentalcarbusinesscontact@gmail.com",
                to: email,
                subject: `Rezerwacja: ${savedBooking._id}`,
                html: `<!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Rezerwacja</title>
                </head>
                <body>
                
                    <h2>Rezerwacja ${savedBooking._id}</h2>
                
                    <p>Witaj ${firstName}!</p>
                    <p>Dziękujemy za rezerwację.</p>

                    <p>Twoja rezerwacja ma status: oczekujący.</p>
                    <p>Prosimy o wpłatę zaliczki, która ma wynośić połowę kwoty rezerwacji.</p>
                    <p>Czas na wpłate to 24h, w przypadku braku wpłaty rezerwacja zostanie anulowna</p>
                    <br/>
                    <p>Tytuł przelewu: ${savedBooking._id}</p>

                    <p>Numer konta: PL222979824782467335332333</p>

                    <p>Dane kontaktowe:</p>
                    <ul>
                        <li>Imię i nazwisko: ${firstName} ${lastName}</li>
                        <li>Data urodzenia: ${dateOfBirth}</li>
                        <li>Ulica: ${address}</li>
                        <li>Miasto: ${city} ${zipCode}</li>
                        <li>Kraj: ${country}</li>
                        <li>Prawo jazdy: ${drivingLicense}</li>
                        <li>Telefon: ${phone}</li>
                    </ul>
                
                    <p>Oferta:</p>
                    <ul>
                        <li>Samochód: ${car[0].title}</li>
                        <li>Dodatki:
                            <ul>
                                ${extras.extraDriver ? '<li>Dodatkowy kierowca</li>' : ''}
                                ${extras.insurance ? '<li>Ubezpieczenie</li>' : ''}
                                ${extras.assistance ? '<li>Pomoc Drogowa 24/7</li>' : ''}
                                ${extras.navigation ? '<li>Nawigacja</li>' : ''}
                                ${extras.wifi ? '<li>Wi-Fi</li>' : ''}
                                ${extras.childSeat ? '<li>Fotelik dziecięcy</li>' : ''}
                            </ul>
                        </li>
                    </ul>
                
                    <p>Cena wynajmu auta: ${rentalPrice} zł</p>
                    <p>Cena za dodatki: ${extrasPrice} zł</p>
                    <p>Cena za wszystko: ${totalPrice} zł</p>
                
                </body>
                </html>`
            };

            transporter.sendMail(mailOptions, async (error, data) => {
                if (error) {
                    console.error("Błąd podczas wysyłania e-maila:", error);
                    return res.status(500).send("Błąd podczas wysyłania e-maila.");
                } else {
                    return res.status(201).json({ message: 'Rezerwacja została dodana', bookingId: savedBooking._id });
                }
            });

        } else {
            return res.status(400).send({ message: 'Brak samochodu', code: 400 });
        }

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Wewnętrzny błąd serwera' });
    }
};

const addReview = async (req, res) => {
    try {
        const {bookingId, text} = req.body;

        await Booking.findById(bookingId)
        .then(booking => {
              booking.review.text = text;
              booking.review.added = true;

              booking.save()
              .then(() => res.json("Review added"))
              .catch(err => res.status(400).json("Error: " + err));
        })
    } catch (error) {
        console.error(error);
        res.status(400).send({ message: 'Wystąpił błąd aplikacji', code: 400 });
    }
};

const deleteReview = async (req, res) => {
    try {
        const {bookingId} = req.body;

        await Booking.findById(bookingId)
        .then(booking => {
              booking.review.text = "";
              booking.review.added = false;

              booking.save()
              .then(() => res.json("Review deleted"))
              .catch(err => res.status(400).json("Error: " + err));
        })
    } catch (error) {
        console.error(error);
        res.status(400).send({ message: 'Wystąpił błąd aplikacji', code: 400 });
    }
};

const blockReview = async (req, res) => {
    try {
        const {bookingId} = req.body;

        await Booking.findById(bookingId)
        .then(booking => {
              booking.review.blocked = true
              booking.save()
              .then(() => res.json("Review blocked"))
              .catch(err => res.status(400).json("Error: " + err));
        })
    } catch (error) {
        console.error(error);
        res.status(400).send({ message: 'Wystąpił błąd aplikacji', code: 400 });
    }
};

const activateReview = async (req, res) => {
    try {
        const {bookingId} = req.body;

        await Booking.findById(bookingId)
        .then(booking => {
              booking.review.blocked = false
              booking.save()
              .then(() => res.json("Review activated"))
              .catch(err => res.status(400).json("Error: " + err));
        })
    } catch (error) {
        console.error(error);
        res.status(400).send({ message: 'Wystąpił błąd aplikacji', code: 400 });
    }
};

const cancelBookingById = async (req, res) => {
    try {
        const {bookingId} = req.body;

        const booking = await Booking.findById(bookingId)
        if (!booking) {
            return res.status(404).json({ message: 'Rezerwacja nie znaleziona', code: 404 });
        }
    
        booking.status = 'canceled';
    
        const updatedBooking = await booking.save();

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: "rentalcarbusinesscontact@gmail.com",
                pass: "fuujddkbargfivkk",
            },
        });

        const mailOptions = {
            from: "rentalcarbusinesscontact@gmail.com",
            to: updatedBooking.email,
            subject: `Anulowano rezerwacje: ${bookingId}`,
            html: `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Anulowanie rezerwacji</title>
            </head>
            <body>
            
                <h2>Rezerwacja ${bookingId}</h2>
            
                <p>Witaj ${updatedBooking.firstName}!</p>
                <p>Twoja rezerwacja została anulowana.</p>
                
            </body>
            </html>`
        };

        transporter.sendMail(mailOptions, async (error, data) => {
            if (error) {
                console.error("Błąd podczas wysyłania e-maila:", error);
                return res.status(500).send("Błąd podczas wysyłania e-maila.");
            } else {
                return res.status(201).json({ message: 'Rezerwacja została anulowana', bookingId: bookingId });
            }
        });


    } catch (error) {
        console.error(error);
        res.status(400).send({ message: 'Wystąpił błąd aplikacji', code: 400 });
    }
};
const getBookingsById = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const id = req.params.id;
        const bookings = await Booking.aggregate([
            {
                $match: {
                    clientId: new mongoose.Types.ObjectId(id),
                    endDate: { $gte: today },
                    status: "confirmed"
                }
            },
            {
                $lookup: {
                    from: "cars",
                    localField: "carId",
                    foreignField: "_id",
                    as: "carDetails"
                }
            },
            {
                $unwind: "$carDetails"
            },
            {
                $lookup: {
                    from: "makes",
                    localField: "carDetails.make_id",
                    foreignField: "_id",
                    as: "makeDetails"
                }
            },
            {
                $unwind: "$makeDetails"
            },
            {
                $project: {
                    _id: 1,
                    clientId: 1,
                    startDate: 1,
                    endDate: 1,
                    totalPrice: 1,
                    firstName: 1,
                    lastName: 1,
                    bookingDate: 1,
                    status: 1,
                    make: "$makeDetails.name",
                    title: "$carDetails.title",
                    carImage: "$carDetails.image",
                    makeImage: "$makeDetails.logo"
                }
            }
        ]
        );
        return res.send(bookings);
    } catch (error) {
        console.error(error);
        res.status(400).send({ message: 'Wystąpił błąd aplikacji', code: 400 });
    }
};

const getBookingById = async (req, res) => {
    try {
        const id = req.body.bookingId;
        const bookings = await Booking.aggregate([ 
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(id)
                    
                }
            },
            {
                $lookup: {
                    from: "cars",
                    localField: "carId",
                    foreignField: "_id",
                    as: "carDetails"
                }
            },
            {
                $unwind: "$carDetails"
            },
            {
                $lookup: {
                    from: "makes",
                    localField: "carDetails.make_id",
                    foreignField: "_id",
                    as: "makeDetails"
                }
            },
            {
                $unwind: "$makeDetails"
            },
            {
                $project: {
                    _id: 1,
                    clientId: 1,
                    startDate: 1,
                    endDate: 1,
                    totalPrice: 1,
                    firstName: 1,
                    lastName: 1,
                    dateOfBirth: 1,
                    email: 1, 
                    bookingDate: 1,
                    phone: 1,
                    drivingLicense: 1,
                    address: 1,
                    city: 1,
                    zipCode: 1,
                    country: 1,
                    extras: 1,
                    rentalPrice: 1,
                    extrasPrice: 1,
                    status: 1, 
                    make: "$makeDetails.name",
                    title: "$carDetails.title",
                    carImage: "$carDetails.image",
                    transmission: "$carDetails.transmission",
                    doors: "$carDetails.doors",
                    ac: "$carDetails.ac",
                    fuel: "$carDetails.fuel",
                    makeImage: "$makeDetails.logo"
                }
            }
        ]
        );
        return res.send(bookings);
    } catch (error) {
        console.error(error);
        res.status(400).send({ message: 'Wystąpił błąd aplikacji', code: 400 });
    }
};

const getAllBookings = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const bookings = await Booking.aggregate([
            {
                $lookup: {
                    from: "cars",
                    localField: "carId",
                    foreignField: "_id",
                    as: "carDetails"
                }
            },
            {
                $unwind: "$carDetails"
            },
            {
                $lookup: {
                    from: "makes",
                    localField: "carDetails.make_id",
                    foreignField: "_id",
                    as: "makeDetails"
                }
            },
            {
                $unwind: "$makeDetails"
            },
            {
                $project: {
                    _id: 1,
                    clientId: 1,
                    startDate: 1,
                    endDate: 1,
                    totalPrice: 1,
                    firstName: 1,
                    lastName: 1,
                    bookingDate: 1,
                    status: 1,
                    title: "$carDetails.title",
                    make: "$makeDetails.name",
                    makeImage: "$makeDetails.logo",
                    carImage: "$carDetails.image"
                }
            },
            {
                $match: {
                    endDate: { $gte: today },
                    status: "confirmed"
                }
            },
            {
                $sort: {
                    bookingDate: -1
                }
            }
        ]);

        return res.send(bookings);
    } catch (error) {
        console.error(error);
        res.status(400).send({ message: 'Wystąpił błąd aplikacji', code: 400 });
    }
};


const getCompletedBookings = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Ustawia godzinę na północ dzisiaj, aby uwzględnić wszystkie rezerwacje kończące się dzisiaj.

        const bookings = await Booking.aggregate([
            {
                $lookup: {
                    from: "cars",
                    localField: "carId",
                    foreignField: "_id",
                    as: "carDetails"
                }
            },
            {
                $unwind: "$carDetails"
            },
            {
                $lookup: {
                    from: "makes",
                    localField: "carDetails.make_id",
                    foreignField: "_id",
                    as: "makeDetails"
                }
            },
            {
                $unwind: "$makeDetails"
            },
            {
                $project: {
                    _id: 1,
                    clientId: 1,
                    startDate: 1,
                    endDate: 1,
                    totalPrice: 1,
                    firstName: 1,
                    lastName: 1,
                    bookingDate: 1,
                    status: 1,
                    title: "$carDetails.title",
                    make: "$makeDetails.name",
                    makeImage: "$makeDetails.logo",
                    carImage: "$carDetails.image"
                }
            },
            {
                $match: {
                    endDate: { $lte: today },
                    status: "confirmed"
                }
            },
            {
                $sort: {
                    bookingDate: -1,
                }
            }
        ]);

        return res.send(bookings);
    } catch (error) {
        console.error(error);
        res.status(400).send({ message: 'Wystąpił błąd aplikacji', code: 400 });
    }
};

const getCanceledBookings = async (req, res) => {
    try {
        const bookings = await Booking.aggregate([
            {
                $lookup: {
                    from: "cars",
                    localField: "carId",
                    foreignField: "_id",
                    as: "carDetails"
                }
            },
            {
                $unwind: "$carDetails"
            },
            {
                $lookup: {
                    from: "makes",
                    localField: "carDetails.make_id",
                    foreignField: "_id",
                    as: "makeDetails"
                }
            },
            {
                $unwind: "$makeDetails"
            },
            {
                $project: {
                    _id: 1,
                    clientId: 1,
                    startDate: 1,
                    endDate: 1,
                    totalPrice: 1,
                    firstName: 1,
                    lastName: 1,
                    bookingDate: 1,
                    status: 1,
                    title: "$carDetails.title",
                    make: "$makeDetails.name",
                    makeImage: "$makeDetails.logo",
                    carImage: "$carDetails.image"
                }
            },
            {
                $match: {
                    status: "canceled"
                }
            },
            {
                $sort: {
                    bookingDate: -1
                }
            }
        ]);

        return res.send(bookings);
    } catch (error) {
        console.error(error);
        res.status(400).send({ message: 'Wystąpił błąd aplikacji', code: 400 });
    }
};

const getCompletedBookingsByIdReview = async (req, res) => {
    try {
        const id = req.params.id;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const bookings = await Booking.aggregate([
            {
                $lookup: {
                    from: "cars",
                    localField: "carId",
                    foreignField: "_id",
                    as: "carDetails"
                }
            },
            {
                $unwind: "$carDetails"
            },
            {
                $lookup: {
                    from: "makes",
                    localField: "carDetails.make_id",
                    foreignField: "_id",
                    as: "makeDetails"
                }
            },
            {
                $unwind: "$makeDetails"
            },
            {
                $project: {
                    _id: 1,
                    clientId: 1,
                    startDate: 1,
                    endDate: 1,
                    totalPrice: 1,
                    firstName: 1,
                    lastName: 1,
                    bookingDate: 1,
                    status: 1,
                    review: 1,
                    title: "$carDetails.title",
                    make: "$makeDetails.name",
                    makeImage: "$makeDetails.logo",
                    carImage: "$carDetails.image"
                }
            },
            {
                $match: {
                    clientId: new mongoose.Types.ObjectId(id),
                    endDate: { $lte: today },
                    status: "confirmed",
                    "review.added": false
                }
            },
            {
                $sort: {
                    bookingDate: -1,
                }
            }
        ]);

        return res.send(bookings);
    } catch (error) {
        console.error(error);
        res.status(400).send({ message: 'Wystąpił błąd aplikacji', code: 400 });
    }
};

const getBookingsWithReviewById = async (req, res) => {
    try {
        const id = req.params.id;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const bookings = await Booking.aggregate([
            {
                $lookup: {
                    from: "cars",
                    localField: "carId",
                    foreignField: "_id",
                    as: "carDetails"
                }
            },
            {
                $unwind: "$carDetails"
            },
            {
                $lookup: {
                    from: "makes",
                    localField: "carDetails.make_id",
                    foreignField: "_id",
                    as: "makeDetails"
                }
            },
            {
                $unwind: "$makeDetails"
            },
            {
                $project: {
                    _id: 1,
                    clientId: 1,
                    startDate: 1,
                    endDate: 1,
                    totalPrice: 1,
                    firstName: 1,
                    lastName: 1,
                    bookingDate: 1,
                    status: 1,
                    review: 1,
                    title: "$carDetails.title",
                    make: "$makeDetails.name",
                    makeImage: "$makeDetails.logo",
                    carImage: "$carDetails.image"
                }
            },
            {
                $match: {
                    clientId: new mongoose.Types.ObjectId(id),
                    endDate: { $lte: today },
                    status: "confirmed",
                    "review.added": true
                }
            },
            {
                $sort: {
                    bookingDate: -1,
                }
            }
        ]);

        return res.send(bookings);
    } catch (error) {
        console.error(error);
        res.status(400).send({ message: 'Wystąpił błąd aplikacji', code: 400 });
    }
};

const getCompletedBookingsById = async (req, res) => {
    try {
        const id = req.params.id;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const bookings = await Booking.aggregate([
            {
                $lookup: {
                    from: "cars",
                    localField: "carId",
                    foreignField: "_id",
                    as: "carDetails"
                }
            },
            {
                $unwind: "$carDetails"
            },
            {
                $lookup: {
                    from: "makes",
                    localField: "carDetails.make_id",
                    foreignField: "_id",
                    as: "makeDetails"
                }
            },
            {
                $unwind: "$makeDetails"
            },
            {
                $project: {
                    _id: 1,
                    clientId: 1,
                    startDate: 1,
                    endDate: 1,
                    totalPrice: 1,
                    firstName: 1,
                    lastName: 1,
                    bookingDate: 1,
                    status: 1,
                    review: 1,
                    title: "$carDetails.title",
                    make: "$makeDetails.name",
                    makeImage: "$makeDetails.logo",
                    carImage: "$carDetails.image"
                }
            },
            {
                $match: {
                    clientId: new mongoose.Types.ObjectId(id),
                    endDate: { $lte: today },
                    status: "confirmed"
                }
            },
            {
                $sort: {
                    bookingDate: -1,
                }
            }
        ]);

        return res.send(bookings);
    } catch (error) {
        console.error(error);
        res.status(400).send({ message: 'Wystąpił błąd aplikacji', code: 400 });
    }
};
const getWaitingBookingsById = async (req, res) => {
    try {
        const id = req.params.id;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const bookings = await Booking.aggregate([
            {
                $lookup: {
                    from: "cars",
                    localField: "carId",
                    foreignField: "_id",
                    as: "carDetails"
                }
            },
            {
                $unwind: "$carDetails"
            },
            {
                $lookup: {
                    from: "makes",
                    localField: "carDetails.make_id",
                    foreignField: "_id",
                    as: "makeDetails"
                }
            },
            {
                $unwind: "$makeDetails"
            },
            {
                $project: {
                    _id: 1,
                    clientId: 1,
                    startDate: 1,
                    endDate: 1,
                    totalPrice: 1,
                    firstName: 1,
                    lastName: 1,
                    bookingDate: 1,
                    status: 1,
                    review: 1,
                    title: "$carDetails.title",
                    make: "$makeDetails.name",
                    makeImage: "$makeDetails.logo",
                    carImage: "$carDetails.image"
                }
            },
            {
                $match: {
                    clientId: new mongoose.Types.ObjectId(id),
                    status: "waiting"
                }
            },
            {
                $sort: {
                    bookingDate: -1,
                }
            }
        ]);

        return res.send(bookings);
    } catch (error) {
        console.error(error);
        res.status(400).send({ message: 'Wystąpił błąd aplikacji', code: 400 });
    }
};
const getWaitingBookings = async (req, res) => {
    try {
        const bookings = await Booking.aggregate([
            {
                $lookup: {
                    from: "cars",
                    localField: "carId",
                    foreignField: "_id",
                    as: "carDetails"
                }
            },
            {
                $unwind: "$carDetails"
            },
            {
                $lookup: {
                    from: "makes",
                    localField: "carDetails.make_id",
                    foreignField: "_id",
                    as: "makeDetails"
                }
            },
            {
                $unwind: "$makeDetails"
            },
            {
                $project: {
                    _id: 1,
                    clientId: 1,
                    startDate: 1,
                    endDate: 1,
                    totalPrice: 1,
                    firstName: 1,
                    lastName: 1,
                    bookingDate: 1,
                    status: 1,
                    review: 1,
                    title: "$carDetails.title",
                    make: "$makeDetails.name",
                    makeImage: "$makeDetails.logo",
                    carImage: "$carDetails.image"
                }
            },
            {
                $match: {
                    status: "waiting"
                }
            },
            {
                $sort: {
                    bookingDate: -1,
                }
            }
        ]);

        return res.send(bookings);
    } catch (error) {
        console.error(error);
        res.status(400).send({ message: 'Wystąpił błąd aplikacji', code: 400 });
    }
};

const confirmBookingById = async (req, res) => {
    try {
        const {bookingId} = req.body;

        const booking = await Booking.findById(bookingId)
        if (!booking) {
            return res.status(404).json({ message: 'Rezerwacja nie znaleziona', code: 404 });
        }
    
        booking.status = 'confirmed';
    
        const updatedBooking = await booking.save();
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: "rentalcarbusinesscontact@gmail.com",
                pass: "fuujddkbargfivkk",
            },
        });

        const mailOptions = {
            from: "rentalcarbusinesscontact@gmail.com",
            to: updatedBooking.email,
            subject: `Potwierdzono rezerwacje: ${bookingId}`,
            html: `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Potwierdzenie rezerwacji</title>
            </head>
            <body>
            
                <h2>Rezerwacja ${bookingId}</h2>
            
                <p>Witaj ${updatedBooking.firstName}!</p>
                <p>Twoja rezerwacja została potwierdzona.</p>
                
            </body>
            </html>`
        };

        transporter.sendMail(mailOptions, async (error, data) => {
            if (error) {
                console.error("Błąd podczas wysyłania e-maila:", error);
                return res.status(500).send("Błąd podczas wysyłania e-maila.");
            } else {
                return res.status(201).json({ message: 'Rezerwacja została potwierdzona', bookingId: bookingId });
            }
        });
    } catch (error) {
        console.error(error);
        res.status(400).send({ message: 'Wystąpił błąd aplikacji', code: 400 });
    }
};
const getCanceledBookingsById = async (req, res) => {
    try {
        const id = req.params.id;

        const bookings = await Booking.aggregate([
            {
                $lookup: {
                    from: "cars",
                    localField: "carId",
                    foreignField: "_id",
                    as: "carDetails"
                }
            },
            {
                $unwind: "$carDetails"
            },
            {
                $lookup: {
                    from: "makes",
                    localField: "carDetails.make_id",
                    foreignField: "_id",
                    as: "makeDetails"
                }
            },
            {
                $unwind: "$makeDetails"
            },
            {
                $project: {
                    _id: 1,
                    clientId: 1,
                    startDate: 1,
                    endDate: 1,
                    totalPrice: 1,
                    firstName: 1,
                    lastName: 1,
                    bookingDate: 1,
                    status: 1,
                    title: "$carDetails.title",
                    make: "$makeDetails.name",
                    makeImage: "$makeDetails.logo",
                    carImage: "$carDetails.image"
                }
            },
            {
                $match: {
                    clientId: new mongoose.Types.ObjectId(id),
                    status: "canceled"
                }
            },
            {
                $sort: {
                    bookingDate: -1
                }
            }
        ]);

        return res.send(bookings);
    } catch (error) {
        console.error(error);
        res.status(400).send({ message: 'Wystąpił błąd aplikacji', code: 400 });
    }
};

const getLastThreeReviews = async (req, res) => {
    try {
        const reviews = await Booking.find(
            {
                "review": { $exists: true, $ne: "" },
                "review.added": true,
                "review.blocked": false,
                "status": "confirmed"
            },
            {
                "firstName": 1,
                "lastName": 1,
                "review": 1,
                "_id": 0,
                "bookingDate": 1
            }
        )
            .sort({ "bookingDate": -1 })  // Dodaj sortowanie po bookingDate w odwrotnej kolejności
            .limit(3);

        return res.send(reviews);
    } catch (error) {
        console.error(error);
        res.status(400).send({ message: 'Wystąpił błąd aplikacji', code: 400 });
    }
};

const getReviews = async (req, res) => {
    try {
        const reviews = await Booking.aggregate([
            {
                $lookup: {
                    from: "cars",
                    localField: "carId",
                    foreignField: "_id",
                    as: "carDetails"
                }
            },
            {
                $unwind: "$carDetails"
            },
            {
                $lookup: {
                    from: "makes",
                    localField: "carDetails.make_id",
                    foreignField: "_id",
                    as: "makeDetails"
                }
            },
            {
                $unwind: "$makeDetails"
            },
            {
                $project: {
                    _id: 1,
                    clientId: 1,
                    startDate: 1,
                    endDate: 1,
                    totalPrice: 1,
                    firstName: 1,
                    lastName: 1,
                    bookingDate: 1,
                    status: 1,
                    review: 1,
                    title: "$carDetails.title",
                    make: "$makeDetails.name",
                    makeImage: "$makeDetails.logo",
                    carImage: "$carDetails.image"
                }
            },
            {
                // $match:{
                //     "review": { $exists: true, $ne: "" },
                //     "status": true
                //   },
                $match:{
                    "review.blocked": false,
                    "review.added": true,
                    "status": "confirmed"
                  },
            },
            {
                $sort: {
                    bookingDate: -1,
                }
            }
        ]);

        return res.send(reviews);
    } catch (error) {
        console.error(error);
        res.status(400).send({ message: 'Wystąpił błąd aplikacji', code: 400 });
    }
};

const getBlockedReviews = async (req, res) => {
    try {
        const reviews = await Booking.aggregate([
            {
                $lookup: {
                    from: "cars",
                    localField: "carId",
                    foreignField: "_id",
                    as: "carDetails"
                }
            },
            {
                $unwind: "$carDetails"
            },
            {
                $lookup: {
                    from: "makes",
                    localField: "carDetails.make_id",
                    foreignField: "_id",
                    as: "makeDetails"
                }
            },
            {
                $unwind: "$makeDetails"
            },
            {
                $project: {
                    _id: 1,
                    clientId: 1,
                    startDate: 1,
                    endDate: 1,
                    totalPrice: 1,
                    firstName: 1,
                    lastName: 1,
                    bookingDate: 1,
                    status: 1,
                    review: 1,
                    title: "$carDetails.title",
                    make: "$makeDetails.name",
                    makeImage: "$makeDetails.logo",
                    carImage: "$carDetails.image"
                }
            },
            {
                $match:{
                    "review.blocked": true,
                    "review.added": true,
                    "status": "confirmed"
                  },
            },
            {
                $sort: {
                    bookingDate: -1,
                }
            }
        ]);

        return res.send(reviews);
    } catch (error) {
        console.error(error);
        res.status(400).send({ message: 'Wystąpił błąd aplikacji', code: 400 });
    }
};




module.exports = { 
    addBooking,
    addReview, 
    deleteReview,
    blockReview,
    cancelBookingById, 
    getBookingsById, 
    getAllBookings, 
    getBookingById, 
    getCompletedBookings, 
    getCanceledBookings, 
    getCompletedBookingsByIdReview, 
    getBookingsWithReviewById,
    getCompletedBookingsById,
    getWaitingBookingsById,
    getCanceledBookingsById,
    getLastThreeReviews,
    getReviews,
    getBlockedReviews,
    activateReview,
    getWaitingBookings,
    confirmBookingById
};
