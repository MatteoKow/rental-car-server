const mongoose = require('mongoose');
const Booking = require('../models/booking');
const Employee = require('../models/employee');
const Car = require('../models/car');



const getStats = async (req, res) => {
    const {year, month} = req.body;

    const startOfMonth = new Date(`${year}-${month}-01`);
    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);

    try {
        const theBestCar = await Booking.aggregate([
            {
              $match: {
                bookingDate: {
                  $gte: startOfMonth,
                  $lt: endOfMonth
                }
              }
            },
            {
              $group: {
                _id: "$carId",
                totalBookings: { $sum: 1 }
              }
            },
            {
              $sort: { totalBookings: -1 }
            },
            {
              $limit: 1
            },
            {
              $lookup: {
                from: "cars",
                localField: "_id",
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
                carId: "$carDetails._id",
                title: "$carDetails.title",
                description: "$carDetails.description",
                typeCar: "$carDetails.typeCar",
                year: "$carDetails.year",
                fuel: "$carDetails.fuel",
                horsepower: "$carDetails.horsepower",
                color: "$carDetails.color",
                transmission: "$carDetails.transmission",
                engine: "$carDetails.engine",
                doors: "$carDetails.doors",
                ac: "$carDetails.ac",
                image: "$carDetails.image",
                price: "$carDetails.price",
                active: "$carDetails.active",
                makeName: "$makeDetails.name",
                makeLogo: "$makeDetails.logo",
                totalBookings: 1
              }
            }
          ]);
        const totalPrice = await Booking.aggregate([
            {
              $match: {
                bookingDate: {
                  $gte: startOfMonth,
                  $lt: endOfMonth
                },
                status: "confirmed"
              }
            },
            {
              $group: {
                _id: null,
                totalAmount: { $sum: "$totalPrice" }
              }
            }
          ]);
        const highestTotalPrice = await Booking.aggregate([
            {
                $match: {
                bookingDate: {
                    $gte: startOfMonth,
                    $lt: endOfMonth
                },
                status: "confirmed",
                }
            },
            {
                $group: {
                _id: null,
                maxTotalPrice: { $max: "$totalPrice" }
                }
            }
          ]);
        const longestRentalDuration = await Booking.aggregate([
            {
              $match: {
                bookingDate: {
                  $gte: startOfMonth,
                  $lt: endOfMonth
                },
                status: "confirmed"
              }
            },
            {
              $project: {
                carId: 1,
                rentalDuration: {
                  $ceil: {
                    $divide: [
                      { $subtract: ["$endDate", "$startDate"] },
                      1000 * 60 * 60 * 24
                    ]
                  }
                }
              }
            },
            {
              $group: {
                _id: "$carId",
                maxRentalDuration: { $max: "$rentalDuration" }
              }
            },
            {
              $lookup: {
                from: "cars",
                localField: "_id",
                foreignField: "_id",
                as: "carDetails"
              }
            },
            {
              $unwind: "$carDetails"
            },
            {
              $project: {
                carId: "$_id",
                title: "$carDetails.title",
                maxRentalDuration: 1
              }
            },
            {
              $sort: { maxRentalDuration: -1 }
            },
            {
              $limit: 1
            }
          ]);
        const bookingsCount = await Booking.count({
            bookingDate: {
              $gte: startOfMonth,
              $lt: endOfMonth
            },
            status: "confirmed"
          });
        const totalBookingsCount = await Booking.count({ status: "confirmed" });
        const allRevenue = await Booking.aggregate([
            {
              $match: {
                status: "confirmed"
              }
            },
            {
              $group: {
                _id: null,
                revenueAmount: { $sum: "$totalPrice" }
              }
            }
          ]);

        const employeesCount = await Employee.count({ "active": true });
        const carsCount = await Car.count({ "active": true });

        const totalAmount = totalPrice.length > 0 ? totalPrice[0].totalAmount : 0;
        const totalRevenue = allRevenue.length > 0 ? allRevenue[0].revenueAmount : 0;

        const highestPrice = highestTotalPrice.map(result => result.maxTotalPrice)[0] || 0;
        const longestDuration = longestRentalDuration.map(result => result.maxRentalDuration)[0] || 0;

        return res.send({theBestCar, totalAmount, highestPrice, longestDuration, bookingsCount, employeesCount, carsCount, totalRevenue, totalBookingsCount});
    } catch (error) {
        console.error(error);
        res.status(400).send({ message: 'Wystąpił błąd aplikacji', code: 400 });
    }
};


module.exports = { getStats };