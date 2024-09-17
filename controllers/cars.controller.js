const Car = require('../models/car');
const mongoose = require('mongoose');
const upload = require('../utils/upload');
const ObjectId = mongoose.Types.ObjectId;


const addCar = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ code: 400, message: 'Brak przesłanych plików' });
    }

    const images = req.files.map(file => "http://localhost:4000/" + file.path);

    const {
      make_id,
      title,
      price,
      description,
      typeCar,
      year,
      fuel,
      horsepower,
      color,
      transmission,
      engine,
      doors,
      ac,
      quantity
    } = req.body;

    const newCar = new Car({
      make_id,
      title,
      price,
      description,
      typeCar,
      year,
      fuel,
      horsepower,
      color,
      transmission,
      engine,
      doors,
      ac,
      image: images,
      quantity
    });

 
    await newCar.save();

    return res.status(201).json({ message: 'Samochód został pomyślnie dodany' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Wewnętrzny błąd serwera' });
  }
};

const getCars = async (req, res) => {
    try {
        const cars = await Car.aggregate([
          {
            $lookup: {
              from: "makes",
              localField: "make_id",
              foreignField: "_id",
              as: "make_info"
            }
          },
          {
            $unwind: "$make_info"
          },
          {
            $match: {
              active: true
            }
          },
          {
            $project: {
              "_id": 1,
              "active": 1,
              "title": 1,
              "description": 1,
              "typeCar": 1,
              "year": 1,
              "fuel": 1,
              "horsepower": 1,
              "color": 1,
              "transmission": 1,
              "engine": 1,
              "doors": 1,
              "ac": 1,
              "image": 1,
              "price": 1,
              make: "$make_info.name",
              makeImage: "$make_info.logo"
            }
          }
        ]);
        return res.send(cars);
    } catch (error) {
        console.error(error);
        res.status(400).send({ message: 'Wystąpił błąd aplikacji', code: 400 });
    }
};

const getInactiveCars = async (req, res) => {
  try {
      const cars = await Car.aggregate([
        {
          $lookup: {
            from: "makes",
            localField: "make_id",
            foreignField: "_id",
            as: "make_info"
          }
        },
        {
          $unwind: "$make_info"
        },
        {
          $match: {
            active: false
          }
        },
        {
          $project: {
            "_id": 1,
            "title": 1,
            "description": 1,
            "typeCar": 1,
            "year": 1,
            "fuel": 1,
            "horsepower": 1,
            "color": 1,
            "transmission": 1,
            "engine": 1,
            "doors": 1,
            "ac": 1,
            "image": 1,
            "price": 1,
            make: "$make_info.name",
            makeImage: "$make_info.logo"
          }
        }
      ]);
      return res.send(cars);
  } catch (error) {
      console.error(error);
      res.status(400).send({ message: 'Wystąpił błąd aplikacji', code: 400 });
  }
};

const getCarsFiltered = async (req, res) => {
  try {
    const { startDate, endDate, minPrice, maxPrice, makes, types, sortByPrice } = req.body;
    const { fuels, transmissions } = req.body;
    const searchCriteria = {};
    const sortCriteria = {};
  
    if (types.length) searchCriteria.typeCar = { $in: types };
    if (fuels.length) searchCriteria.fuel = { $in: fuels };
    if (transmissions.length) searchCriteria.transmission = { $in: transmissions };
    if (makes.length) searchCriteria.make = { $in: makes };

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
            price: {
              $gte: minPrice,
              $lte: maxPrice
            },
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
            description: "$car_info.description",
            typeCar: "$car_info.typeCar",
            year: "$car_info.year",
            fuel: "$car_info.fuel",
            horsepower: "$car_info.horsepower",
            color: "$car_info.color",
            transmission: "$car_info.transmission",
            engine: "$car_info.engine",
            doors: "$car_info.doors",
            ac: "$car_info.ac",
            image: "$car_info.image",
            price: "$car_info.price",
            active: "$car_info.active",
            make: "$make_info.name",
            makeImage: "$make_info.logo",
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
        }
      
    ]

    pipeline.push({
      $match: { ...searchCriteria} 
    });

    if (sortByPrice === 1 || sortByPrice === -1) {
      pipeline.push({
        $sort: {
          price: sortByPrice
        }
      });
    }

    const cars = await Car.aggregate(pipeline); 

    return res.send(cars);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Wystąpił błąd aplikacji', code: 500 });
  }
};

const getCarById = async (req, res) => {
  try {
    const cars = await Car.aggregate([
      {
        $lookup: {
          from: "makes",
          localField: "make_id",
          foreignField: "_id",
          as: "make_info"
        }
      },
      {
        $unwind: "$make_info"
      },
      {
        $match: {
          _id: new ObjectId(req.params.id)
        }
      },
      {
        $project: {
          "_id": 1,
          "make_id":1,
          "title": 1,
          "description": 1,
          "typeCar": 1,
          "year": 1,
          "fuel": 1,
          "horsepower": 1,
          "color": 1,
          "transmission": 1,
          "engine": 1,
          "doors": 1,
          "ac": 1,
          "image": 1,
          "price": 1,
          "quantity": 1,

          make: "$make_info.name",
          makeImage: "$make_info.logo"
        }
      }
    ]);
    return res.send(cars);
} catch (error) {
    console.error(error);
    res.status(400).send({ message: 'Wystąpił błąd aplikacji', code: 400 });
}
};

const updateCarById = async (req, res) => {
  try {
    const { carImages, title, description, price, make_id, typeCar, year, fuel, horsepower, color, transmission, engine, doors, ac, quantity } = req.body;
    const images = req.files.map(file => "http://localhost:4000/" + file.path);
    const car = await Car.findById(req.params.id);

    if (!car) {
      return res.status(404).json({ code: 404, message: 'Car not found' });
    }
    car.image = images.concat(carImages);
    car.title = title;
    car.description = description;
    car.price = price;
    car.make_id = make_id;
    car.typeCar = typeCar;
    car.fuel = fuel;
    car.transmission = transmission;
    car.ac = ac;
    car.year = year;
    car.horsepower = horsepower;
    car.color = color;
    car.engine = engine;
    car.doors = doors;
    car.quantity = quantity;

    await car.save();

    res.json({ code: 200, message: 'Car updated' });
  } catch (error) {
    console.error(error);
    res.status(400).json({ code: 400, message: 'Wystąpił błąd aplikacji' });
  }
};


const deactivateCar = async (req, res) => {
  try {
      await Car.findById(req.params.id)
      .then(car => {
            car.active = false
            car.save()
            .then(() => res.json("Car deactivated"))
            .catch(err => res.status(400).json("Error: " + err));
      })
     .catch(err => res.status(400).json("Error: " + err));
  } catch (error) {
      console.error(error);
      res.status(400).send({ message: 'Wystąpił błąd aplikacji', code: 400 });
  }

};

const activateCar = async (req, res) => {
  try {
      await Car.findById(req.params.id)
      .then(car => {
            car.active = true
            car.save()
            .then(() => res.json("Car activated"))
            .catch(err => res.status(400).json("Error: " + err));
      })
     .catch(err => res.status(400).json("Error: " + err));
  } catch (error) {
      console.error(error);
      res.status(400).send({ message: 'Wystąpił błąd aplikacji', code: 400 });
  }

};

module.exports = { addCar, getCars, getCarById, getCarsFiltered, getInactiveCars, updateCarById, deactivateCar, activateCar};
